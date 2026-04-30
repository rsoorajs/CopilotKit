package com.copilotkit.showcase.springai;

import com.agui.core.message.AssistantMessage;
import com.agui.core.message.BaseMessage;
import com.agui.core.message.DeveloperMessage;
import com.agui.core.message.SystemMessage;
import com.agui.core.message.ToolMessage;
import com.agui.core.message.UserMessage;
import com.agui.core.message.Role;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

/**
 * Custom Jackson configuration for the showcase spring-ai backend.
 *
 * The AG-UI Java SDK's {@code MessageMixin} only registers five message
 * roles: assistant, developer, user, system, tool. The CopilotKit runtime
 * can forward messages with additional roles (activity, reasoning) that
 * the Java SDK does not model. Without this configuration, Jackson throws
 * {@code InvalidTypeIdException} when encountering an unknown role,
 * causing the entire request deserialization to fail.
 *
 * This configuration replaces the SDK's mixin AFTER {@code AgUiAutoConfiguration}
 * has registered the original one. The replacement adds
 * {@code defaultImpl = UnknownMessage.class} so messages with unrecognized
 * roles deserialize into a harmless object instead of throwing.
 */
@Configuration
public class JacksonConfig {

    private static final Logger log = LoggerFactory.getLogger(JacksonConfig.class);

    /**
     * Catch-all message type for roles the Java SDK does not support.
     * Instances of this class appear in the messages list when the
     * CopilotKit runtime forwards messages with roles like "activity"
     * or "reasoning". They are harmless: getLatestUserMessage() only
     * matches Role.user, and combineMessages() only checks the id.
     */
    public static class UnknownMessage extends BaseMessage {
        @Override
        public Role getRole() {
            // Return a role that will never match Role.user so
            // getLatestUserMessage() skips these.
            return Role.developer;
        }
    }

    /**
     * Mixin that extends the AG-UI SDK's MessageMixin with defaultImpl
     * so that unrecognized role values deserialize to UnknownMessage
     * instead of throwing InvalidTypeIdException.
     */
    @JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "role",
        defaultImpl = UnknownMessage.class
    )
    @JsonSubTypes({
        @JsonSubTypes.Type(value = AssistantMessage.class, name = "assistant"),
        @JsonSubTypes.Type(value = DeveloperMessage.class, name = "developer"),
        @JsonSubTypes.Type(value = UserMessage.class, name = "user"),
        @JsonSubTypes.Type(value = SystemMessage.class, name = "system"),
        @JsonSubTypes.Type(value = ToolMessage.class, name = "tool")
    })
    interface LenientMessageMixin {}

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Override the AG-UI SDK's MessageMixin with our lenient version.
     * This runs after all auto-configuration (including AgUiAutoConfiguration)
     * has completed, ensuring our mixin wins.
     */
    @PostConstruct
    public void overrideMessageMixin() {
        objectMapper.addMixIn(BaseMessage.class, LenientMessageMixin.class);
        log.info("[JacksonConfig] Replaced AG-UI MessageMixin with lenient version (unknown roles -> UnknownMessage)");
    }
}
