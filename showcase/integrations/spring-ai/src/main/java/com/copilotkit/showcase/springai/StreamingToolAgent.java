package com.copilotkit.showcase.springai;

import com.agui.core.agent.AgentSubscriber;
import com.agui.core.agent.AgentSubscriberParams;
import com.agui.core.agent.RunAgentInput;
import com.agui.core.event.BaseEvent;
import com.agui.core.exception.AGUIException;
import com.agui.core.message.AssistantMessage;
import com.agui.core.message.Role;
import com.agui.core.state.State;
import com.agui.server.LocalAgent;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.PromptChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static com.agui.server.EventFactory.runErrorEvent;
import static com.agui.server.EventFactory.runFinishedEvent;
import static com.agui.server.EventFactory.runStartedEvent;
import static com.agui.server.EventFactory.textMessageContentEvent;
import static com.agui.server.EventFactory.textMessageEndEvent;
import static com.agui.server.EventFactory.textMessageStartEvent;
import static com.agui.server.EventFactory.toolCallArgsEvent;
import static com.agui.server.EventFactory.toolCallEndEvent;
import static com.agui.server.EventFactory.toolCallResultEvent;
import static com.agui.server.EventFactory.toolCallStartEvent;

/**
 * Streaming agent that supports tool execution.
 *
 * <p>Spring AI's {@code ChatClient.stream()} does NOT auto-execute tool callbacks
 * (unlike {@code .call()} which has a built-in tool execution loop). The stock
 * AG-UI {@code SpringAIAgent} uses {@code .stream()} and therefore tools are
 * never invoked — the model returns {@code tool_calls} in the stream but the
 * tool functions are never called, leaving the CopilotKit runtime stuck in an
 * infinite re-invocation loop.
 *
 * <p>This agent implements a two-phase approach:
 * <ol>
 *   <li><b>Phase 1 — stream:</b> Use {@code .stream()} with
 *       {@code internalToolExecutionEnabled=false} for real-time text delivery.
 *       This prevents Spring AI's model layer from auto-executing tool calls
 *       through the global {@code ToolCallingManager} (which only knows about
 *       backend tools and would throw on frontend-provided tools like
 *       {@code generate_task_steps}, {@code show_card}, etc.). If the model
 *       wants to call tools, the stream will contain tool_calls metadata but
 *       they are detected without execution.</li>
 *   <li><b>Phase 2 — call with tools:</b> If tool calls were detected, re-invoke
 *       the model via {@code .call()} WITH tool callbacks attached. Spring AI's
 *       built-in tool execution loop handles all tool iterations automatically.
 *       The final text response is emitted as AG-UI events.</li>
 * </ol>
 *
 * <p>When no tools are needed, the agent behaves as a pure streaming agent.
 * When tools are needed, the first streamed response is discarded (it's just
 * the tool call request) and the {@code .call()} path produces the complete
 * response including tool execution.
 */
public class StreamingToolAgent extends LocalAgent {

    private static final Logger log = LoggerFactory.getLogger(StreamingToolAgent.class);

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final List<ToolCallback> toolCallbacks;
    private final String systemMessage;

    private StreamingToolAgent(Builder builder) {
        super(builder.agentId, new State(), new ArrayList<>());
        this.chatClient = ChatClient.builder(builder.chatModel).build();
        this.chatMemory = builder.chatMemory;
        this.toolCallbacks = builder.toolCallbacks;
        this.systemMessage = builder.systemMessage;
    }

    @Override
    protected void run(RunAgentInput input, AgentSubscriber subscriber) {
        this.combineMessages(input);

        String messageId = UUID.randomUUID().toString();
        String threadId = input.threadId();
        String runId = input.runId();

        String userContent;
        try {
            var userMessage = this.getLatestUserMessage(messages);
            userContent = userMessage.getContent();
        } catch (AGUIException e) {
            log.error("Failed to read latest user message", e);
            this.emitEvent(runErrorEvent(String.format(
                    "agent run failed: %s (see server logs)",
                    e.getClass().getSimpleName())), subscriber);
            return;
        }

        this.emitEvent(runStartedEvent(threadId, runId), subscriber);
        this.emitEvent(textMessageStartEvent(messageId, "assistant"), subscriber);

        var assistantMessage = new AssistantMessage();
        assistantMessage.setId(messageId);
        assistantMessage.setName(this.agentId);
        assistantMessage.setContent("");

        List<BaseEvent> deferredEvents = new ArrayList<>();

        try {
            // Phase 1: Stream WITHOUT tool callbacks to detect whether tools
            // are needed. Text chunks are emitted in real time.
            boolean toolCallsDetected = streamFirstTurn(
                    input, userContent, messageId, assistantMessage, subscriber);

            if (toolCallsDetected) {
                // Phase 2: Tools needed. Discard the streamed text (it was
                // just the model's tool-call request, not a final answer).
                // Re-invoke with .call() + tool callbacks so Spring AI's
                // internal loop handles execution.
                assistantMessage.setContent("");
                callWithTools(input, userContent, messageId,
                        assistantMessage, deferredEvents, subscriber);
            }
        } catch (Exception e) {
            log.error("Agent run failed", e);
            this.emitEvent(runErrorEvent(String.format(
                    "agent run failed: %s (see server logs)",
                    e.getClass().getSimpleName())), subscriber);
            return;
        }

        // Emit tool call events BEFORE textMessageEnd so the frontend's
        // useRenderTool sees them while the message is still "open". Events
        // emitted after textMessageEnd may be missed by renderers.
        for (BaseEvent ev : deferredEvents) {
            this.emitEvent(ev, subscriber);
        }
        this.emitEvent(textMessageEndEvent(messageId), subscriber);
        subscriber.onNewMessage(assistantMessage);
        this.emitEvent(runFinishedEvent(threadId, runId), subscriber);
        subscriber.onRunFinalized(
                new AgentSubscriberParams(input.messages(), state, this, input));
    }

    /**
     * Streams the first model turn WITHOUT tool callbacks. Text chunks are
     * emitted as AG-UI events in real time. Returns true if the model
     * requested tool calls (meaning we need a follow-up .call()).
     */
    private boolean streamFirstTurn(
            RunAgentInput input, String userContent, String messageId,
            AssistantMessage assistantMessage, AgentSubscriber subscriber)
            throws InterruptedException {

        StringBuilder textAccumulator = new StringBuilder();
        AtomicBoolean sawToolCalls = new AtomicBoolean(false);
        AtomicReference<Throwable> streamError = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        // Build request WITHOUT tool callbacks and with internal tool
        // execution disabled — we just want to stream text and detect
        // whether tools are needed without Spring AI's model layer
        // attempting to execute them through the global ToolCallingManager.
        ChatClient.ChatClientRequestSpec request = buildBaseRequest(
                input, userContent, true);

        request.stream()
                .chatResponse()
                .subscribe(
                        evt -> {
                            if (evt.hasToolCalls()) {
                                sawToolCalls.set(true);
                            }
                            String content = evt.getResult().getOutput().getText();
                            if (StringUtils.hasText(content)) {
                                this.emitEvent(
                                        textMessageContentEvent(messageId, content),
                                        subscriber);
                                textAccumulator.append(content);
                            }
                        },
                        err -> {
                            streamError.set(err);
                            latch.countDown();
                        },
                        latch::countDown
                );

        if (!latch.await(120, TimeUnit.SECONDS)) {
            throw new RuntimeException("Streaming timed out after 120 seconds");
        }

        Throwable err = streamError.get();
        if (err != null) {
            throw new RuntimeException("Streaming failed", err);
        }

        assistantMessage.setContent(textAccumulator.toString());
        return sawToolCalls.get();
    }

    /**
     * Re-invokes the model via .call() WITH tool callbacks. Spring AI's
     * built-in tool execution loop handles all iterations. Tool AG-UI events
     * are emitted via the wrapper callbacks.
     *
     * <p>Internal tool execution is left ENABLED here (unlike Phase 1) so
     * Spring AI's loop can execute backend tools. Frontend tools (injected
     * by the CopilotKit runtime but unknown to this agent) are handled by
     * the {@code LenientToolCallbackResolver} in
     * {@link BoundedToolCallingManagerConfig}, which returns a placeholder
     * callback instead of crashing.
     */
    private void callWithTools(
            RunAgentInput input, String userContent, String messageId,
            AssistantMessage assistantMessage, List<BaseEvent> deferredEvents,
            AgentSubscriber subscriber) {

        ChatClient.ChatClientRequestSpec request = buildBaseRequest(
                input, userContent, false);

        // Wrap each tool callback to emit AG-UI events when invoked
        if (!toolCallbacks.isEmpty()) {
            List<ToolCallback> wrapped = new ArrayList<>();
            for (ToolCallback cb : toolCallbacks) {
                wrapped.add(new AgUiToolCallbackWrapper(
                        cb, messageId, deferredEvents));
            }
            request = request.toolCallbacks(wrapped);
        }

        ChatResponse response = request.call().chatResponse();

        String text = response != null
                ? response.getResult().getOutput().getText()
                : null;
        if (StringUtils.hasText(text)) {
            this.emitEvent(textMessageContentEvent(messageId, text), subscriber);
            assistantMessage.setContent(text);
        }
    }

    /**
     * Builds a base ChatClient request with system prompt and memory
     * but WITHOUT tool callbacks.
     *
     * @param disableInternalToolExecution when {@code true}, sets
     *        {@code internalToolExecutionEnabled=false} on the request
     *        options. This prevents Spring AI's model layer from
     *        auto-executing tool calls through the global
     *        {@link org.springframework.ai.model.tool.ToolCallingManager}.
     *        Used by the streaming path (Phase 1) so that tool_calls in
     *        the stream are detected but not executed — execution happens
     *        in Phase 2 via {@code .call()} with explicit tool callbacks.
     */
    private ChatClient.ChatClientRequestSpec buildBaseRequest(
            RunAgentInput input, String userContent,
            boolean disableInternalToolExecution) {
        ChatClient.ChatClientRequestSpec request = chatClient.prompt(
                Prompt.builder().content(userContent).build())
                .system(systemMessage);

        if (disableInternalToolExecution) {
            request = request.options(
                    OpenAiChatOptions.builder()
                            .internalToolExecutionEnabled(false)
                            .build());
        }

        if (chatMemory != null) {
            request.advisors(PromptChatMemoryAdvisor.builder(chatMemory).build());
            request.advisors(a -> a.param(
                    ChatMemory.CONVERSATION_ID, input.threadId()));
        }

        return request;
    }

    /**
     * Wraps a Spring AI ToolCallback to emit AG-UI tool call events when
     * the tool is invoked during .call()'s internal tool execution loop.
     */
    static class AgUiToolCallbackWrapper implements ToolCallback {
        private final ToolCallback delegate;
        private final String parentMessageId;
        private final List<BaseEvent> deferredEvents;

        AgUiToolCallbackWrapper(ToolCallback delegate, String parentMessageId,
                                List<BaseEvent> deferredEvents) {
            this.delegate = delegate;
            this.parentMessageId = parentMessageId;
            this.deferredEvents = deferredEvents;
        }

        @Override
        public org.springframework.ai.tool.definition.ToolDefinition getToolDefinition() {
            return delegate.getToolDefinition();
        }

        @Override
        public String call(String toolInput) {
            return call(toolInput, null);
        }

        @Override
        public String call(String toolInput,
                           org.springframework.ai.chat.model.ToolContext toolContext) {
            String result = delegate.call(toolInput, toolContext);

            String toolCallId = UUID.randomUUID().toString();
            String toolName = delegate.getToolDefinition().name();

            deferredEvents.add(toolCallStartEvent(parentMessageId, toolName, toolCallId));
            deferredEvents.add(toolCallArgsEvent(toolInput, toolCallId));
            deferredEvents.add(toolCallEndEvent(toolCallId));
            deferredEvents.add(toolCallResultEvent(
                    toolCallId, result, parentMessageId, Role.tool));

            return result;
        }
    }

    // -- Builder --

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String agentId;
        private ChatModel chatModel;
        private ChatMemory chatMemory;
        private String systemMessage;
        private final List<ToolCallback> toolCallbacks = new ArrayList<>();

        public Builder agentId(String agentId) {
            this.agentId = agentId;
            return this;
        }

        public Builder chatModel(ChatModel chatModel) {
            this.chatModel = chatModel;
            return this;
        }

        public Builder chatMemory(ChatMemory chatMemory) {
            this.chatMemory = chatMemory;
            return this;
        }

        public Builder systemMessage(String systemMessage) {
            this.systemMessage = systemMessage;
            return this;
        }

        public Builder toolCallback(ToolCallback toolCallback) {
            this.toolCallbacks.add(toolCallback);
            return this;
        }

        public Builder toolCallbacks(List<ToolCallback> toolCallbacks) {
            this.toolCallbacks.addAll(toolCallbacks);
            return this;
        }

        public StreamingToolAgent build() {
            if (agentId == null) {
                throw new IllegalArgumentException("agentId is required");
            }
            if (chatModel == null) {
                throw new IllegalArgumentException("chatModel is required");
            }
            if (systemMessage == null) {
                throw new IllegalArgumentException("systemMessage is required");
            }
            return new StreamingToolAgent(this);
        }
    }
}
