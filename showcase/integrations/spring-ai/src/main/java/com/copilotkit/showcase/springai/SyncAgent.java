package com.copilotkit.showcase.springai;

import com.agui.core.agent.AgentSubscriber;
import com.agui.core.agent.AgentSubscriberParams;
import com.agui.core.agent.RunAgentInput;
import com.agui.core.event.BaseEvent;
import com.agui.core.exception.AGUIException;
import com.agui.core.function.FunctionCall;
import com.agui.core.message.AssistantMessage;
import com.agui.core.message.Role;
import com.agui.core.state.State;
import com.agui.core.tool.ToolCall;
import com.agui.server.LocalAgent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.definition.ToolDefinition;
import org.springframework.lang.Nullable;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
 * Synchronous LocalAgent that uses {@link ChatClient#call()} instead of
 * {@code .stream()}. This is necessary because Spring AI's streaming mode
 * does NOT auto-execute tool callbacks — the model returns tool_calls but
 * they are never invoked, causing the CopilotKit runtime to re-invoke the
 * agent in an infinite loop.
 *
 * By using {@code .call()}, Spring AI's internal tool-execution loop runs
 * tools automatically, and we emit the full AG-UI event envelope
 * (TOOL_CALL_START/ARGS/END/RESULT) so the CopilotKit runtime sees a
 * complete tool cycle and does not re-invoke.
 *
 * This replaces the upstream {@code SpringAIAgent} for all showcase
 * endpoints that register backend tools (agentic_chat, a2ui-fixed-schema,
 * agent-config, etc.). Controllers that need custom state management
 * (SubagentsController, SharedStateReadWriteController) already extend
 * LocalAgent directly with their own .call()-based run() implementations.
 */
public class SyncAgent extends LocalAgent {

    private static final Logger log = LoggerFactory.getLogger(SyncAgent.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ChatClient chatClient;
    private final String systemMessage;
    private final List<ToolCallback> toolCallbacks;
    private final ChatMemory chatMemory;

    public SyncAgent(
            String agentId,
            ChatModel chatModel,
            ChatMemory chatMemory,
            String systemMessage,
            List<ToolCallback> toolCallbacks
    ) {
        super(agentId, new State(), new ArrayList<>());
        this.chatClient = ChatClient.builder(chatModel).build();
        this.chatMemory = chatMemory;
        this.systemMessage = systemMessage;
        this.toolCallbacks = toolCallbacks;
    }

    @Override
    protected void run(RunAgentInput input, AgentSubscriber subscriber) {
        this.combineMessages(input);

        String messageId = UUID.randomUUID().toString();
        String threadId = input.threadId();
        String runId = input.runId();

        State runState = input.state() != null ? input.state() : new State();
        this.state = runState;

        String userContent;
        try {
            userContent = this.getLatestUserMessage(messages).getContent();
        } catch (AGUIException e) {
            log.error("Failed to read latest user message from {} messages", messages.size(), e);
            this.emitEvent(runErrorEvent(String.format(
                    "agent run failed: %s (see server logs)",
                    e.getClass().getSimpleName())), subscriber);
            return;
        }

        this.emitEvent(runStartedEvent(threadId, runId), subscriber);

        List<BaseEvent> deferredEvents = new ArrayList<>();
        List<ToolCall> capturedToolCalls = new ArrayList<>();

        // Wrap backend tool callbacks to capture AG-UI events during
        // Spring AI's auto-invocation inside .call().
        List<ToolCallback> allCallbacks = new ArrayList<>();
        for (ToolCallback cb : toolCallbacks) {
            allCallbacks.add(new EventCapturingToolCallback(
                    cb, deferredEvents, capturedToolCalls, messageId));
        }

        // Map frontend tools (from CopilotKit runtime) to pass-through callbacks.
        if (input.tools() != null && !input.tools().isEmpty()) {
            for (var tool : input.tools()) {
                String toolName = tool.name();
                String description = tool.description() != null ? tool.description() : "";
                String inputSchema;
                try {
                    inputSchema = MAPPER.writeValueAsString(tool.parameters());
                } catch (Exception e) {
                    inputSchema = "{}";
                }
                allCallbacks.add(new FrontendToolPassthrough(
                        toolName, description, inputSchema,
                        deferredEvents, capturedToolCalls, messageId));
            }
        }

        AssistantMessage assistantMessage = new AssistantMessage();
        assistantMessage.setId(messageId);
        assistantMessage.setName(this.agentId);
        assistantMessage.setContent("");

        this.emitEvent(textMessageStartEvent(messageId, "assistant"), subscriber);

        try {
            ChatClient.ChatClientRequestSpec chatRequest = chatClient.prompt(
                        Prompt.builder().content(userContent).build())
                    .system(systemMessage);

            if (!allCallbacks.isEmpty()) {
                chatRequest = chatRequest.toolCallbacks(allCallbacks.toArray(new ToolCallback[0]));
            }

            ChatResponse response = chatRequest.call().chatResponse();

            // Surface captured tool calls on the assistant message
            for (ToolCall call : capturedToolCalls) {
                if (assistantMessage.getToolCalls() == null) {
                    assistantMessage.setToolCalls(new ArrayList<>());
                }
                assistantMessage.getToolCalls().add(call);
                subscriber.onNewToolCall(call);
            }

            String text = response != null
                    ? response.getResult().getOutput().getText()
                    : null;
            if (StringUtils.hasText(text)) {
                this.emitEvent(textMessageContentEvent(messageId, text), subscriber);
                assistantMessage.setContent(text);
            }
        } catch (Exception e) {
            log.error("ChatClient call failed", e);
            this.emitEvent(runErrorEvent(String.format(
                    "agent run failed: %s (see server logs)",
                    e.getClass().getSimpleName())), subscriber);
            return;
        }

        this.emitEvent(textMessageEndEvent(messageId), subscriber);
        for (BaseEvent ev : deferredEvents) {
            this.emitEvent(ev, subscriber);
        }
        subscriber.onNewMessage(assistantMessage);
        this.emitEvent(runFinishedEvent(threadId, runId), subscriber);
        subscriber.onRunFinalized(
                new AgentSubscriberParams(input.messages(), runState, this, input));
    }

    /**
     * Wraps a backend ToolCallback to capture AG-UI events during Spring AI's
     * auto-invocation inside .call(). Delegates the tool definition and call
     * to the original callback, then records the result as AG-UI events.
     */
    static class EventCapturingToolCallback implements ToolCallback {

        private final ToolCallback delegate;
        private final List<BaseEvent> deferredEvents;
        private final List<ToolCall> capturedToolCalls;
        private final String parentMessageId;

        EventCapturingToolCallback(
                ToolCallback delegate,
                List<BaseEvent> deferredEvents,
                List<ToolCall> capturedToolCalls,
                String parentMessageId) {
            this.delegate = delegate;
            this.deferredEvents = deferredEvents;
            this.capturedToolCalls = capturedToolCalls;
            this.parentMessageId = parentMessageId;
        }

        @Override
        public ToolDefinition getToolDefinition() {
            return delegate.getToolDefinition();
        }

        @Override
        public String call(String toolInput) {
            return call(toolInput, null);
        }

        @Override
        public String call(String toolInput, @Nullable ToolContext toolContext) {
            String result = delegate.call(toolInput, toolContext);

            String toolCallId = UUID.randomUUID().toString();
            String toolName = delegate.getToolDefinition().name();

            FunctionCall fc = new FunctionCall(toolName, toolInput);
            capturedToolCalls.add(new ToolCall(toolCallId, "function", fc));

            deferredEvents.add(toolCallStartEvent(parentMessageId, toolName, toolCallId));
            deferredEvents.add(toolCallArgsEvent(toolInput, toolCallId));
            deferredEvents.add(toolCallEndEvent(toolCallId));
            deferredEvents.add(toolCallResultEvent(
                    toolCallId, result, parentMessageId, Role.tool));

            return result;
        }
    }

    /**
     * Pass-through callback for frontend tools. When Spring AI auto-invokes
     * this during .call(), it returns an empty string (the frontend will
     * handle actual execution). We capture AG-UI events (start/args/end)
     * WITHOUT a result so the CopilotKit runtime knows to execute them on
     * the frontend.
     */
    static class FrontendToolPassthrough implements ToolCallback {

        private final String toolName;
        private final String description;
        private final String inputSchema;
        private final List<BaseEvent> deferredEvents;
        private final List<ToolCall> capturedToolCalls;
        private final String parentMessageId;

        FrontendToolPassthrough(
                String toolName,
                String description,
                String inputSchema,
                List<BaseEvent> deferredEvents,
                List<ToolCall> capturedToolCalls,
                String parentMessageId) {
            this.toolName = toolName;
            this.description = description;
            this.inputSchema = inputSchema;
            this.deferredEvents = deferredEvents;
            this.capturedToolCalls = capturedToolCalls;
            this.parentMessageId = parentMessageId;
        }

        @Override
        public ToolDefinition getToolDefinition() {
            return new ToolDefinition() {
                @Override
                public String name() { return toolName; }

                @Override
                public String description() { return description; }

                @Override
                public String inputSchema() { return inputSchema; }
            };
        }

        @Override
        public String call(String toolInput) {
            String toolCallId = UUID.randomUUID().toString();

            FunctionCall fc = new FunctionCall(toolName, toolInput);
            capturedToolCalls.add(new ToolCall(toolCallId, "function", fc));

            deferredEvents.add(toolCallStartEvent(parentMessageId, toolName, toolCallId));
            deferredEvents.add(toolCallArgsEvent(toolInput, toolCallId));
            deferredEvents.add(toolCallEndEvent(toolCallId));

            return "";
        }
    }
}
