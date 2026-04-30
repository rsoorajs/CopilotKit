package com.copilotkit.showcase.springai;

import com.fasterxml.jackson.databind.DeserializationFeature;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson configuration for tolerant deserialization of AG-UI messages.
 *
 * <p>The CopilotKit runtime forwards the full conversation history to the
 * agent, including messages with roles that the AG-UI Java SDK does not
 * recognise (e.g. "activity", "reasoning"). The AG-UI {@code MessageMixin}
 * uses {@code @JsonTypeInfo(property = "role")} with a closed set of
 * {@code @JsonSubTypes}; an unrecognised role causes
 * {@code InvalidTypeIdException} during deserialization, crashing the
 * request before the agent code even runs.
 *
 * <p>We disable two features:
 * <ul>
 *   <li>{@code FAIL_ON_UNKNOWN_PROPERTIES} — tolerates extra JSON fields
 *       that don't map to a Java field.</li>
 *   <li>{@code FAIL_ON_INVALID_SUBTYPE} — when the {@code role} type-id
 *       doesn't match any registered {@code @JsonSubTypes} name, Jackson
 *       returns {@code null} for that list element instead of throwing.
 *       Downstream code must null-check message lists (see
 *       {@link MessageListFilter}).</li>
 * </ul>
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer tolerantObjectMapperCustomizer() {
        return builder -> builder.featuresToDisable(
                DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
                DeserializationFeature.FAIL_ON_INVALID_SUBTYPE
        );
    }
}
