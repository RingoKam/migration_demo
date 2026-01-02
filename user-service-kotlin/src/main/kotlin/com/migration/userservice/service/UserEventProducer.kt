package com.migration.userservice.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.migration.userservice.model.UserEvent
import org.slf4j.LoggerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service

@Service
class UserEventProducer(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(UserEventProducer::class.java)
    private val topic = "user-events"

    fun publishEvent(event: UserEvent) {
        try {
            val eventJson = objectMapper.writeValueAsString(event)
            kafkaTemplate.send(topic, event.userId, eventJson)
            logger.info("Published user event: ${event.eventType} for user ${event.userId}")
        } catch (e: Exception) {
            logger.error("Failed to publish user event: ${e.message}", e)
            throw RuntimeException("Failed to publish user event", e)
        }
    }
}

