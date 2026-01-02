package com.migration.licenseservice.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.migration.licenseservice.model.LicenseEvent
import com.migration.licenseservice.model.LicenseEventType
import com.migration.licenseservice.repository.LicenseRepository
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service

@Service
class LicenseEventConsumer(
    private val licenseRepository: LicenseRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(LicenseEventConsumer::class.java)

    @KafkaListener(topics = ["license-events"], groupId = "license-service-group")
    fun handleLicenseEvent(eventJson: String) {
        try {
            val event = objectMapper.readValue(eventJson, LicenseEvent::class.java)
            logger.info("Received license event: ${event.eventType} for user ${event.userId} from source: ${event.source}")

            when (event.eventType) {
                LicenseEventType.LICENSE_UPDATED -> {
                    handleLicenseUpdated(event)
                }
            }
        } catch (e: Exception) {
            logger.error("Error processing license event: ${e.message}", e)
        }
    }

    private fun handleLicenseUpdated(event: LicenseEvent) {
        licenseRepository.saveOrUpdate(event.userId, event.payload)
        logger.info("License updated for user: ${event.userId}")
    }
}

