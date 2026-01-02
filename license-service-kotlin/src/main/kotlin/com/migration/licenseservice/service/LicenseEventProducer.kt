package com.migration.licenseservice.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.migration.licenseservice.model.LicenseEvent
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service

@Service
class LicenseEventProducer(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper,
    @Value("\${KAFKA_LICENSE_EVENTS_TOPIC:license-events}")
    private val topic: String
) {
    private val logger = LoggerFactory.getLogger(LicenseEventProducer::class.java)

    fun publishEvent(event: LicenseEvent) {
        try {
            val eventJson = objectMapper.writeValueAsString(event)
            kafkaTemplate.send(topic, event.userId, eventJson)
            logger.info("Published license event: ${event.eventType} for user ${event.userId}")
        } catch (e: Exception) {
            logger.error("Failed to publish license event: ${e.message}", e)
            throw RuntimeException("Failed to publish license event", e)
        }
    }
}

