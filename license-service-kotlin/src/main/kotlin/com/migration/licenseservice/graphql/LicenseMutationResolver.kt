package com.migration.licenseservice.graphql

import com.migration.licenseservice.model.LicenseEvent
import com.migration.licenseservice.model.LicenseEventType
import com.migration.licenseservice.model.LicenseStatus
import com.migration.licenseservice.repository.LicenseRepository
import com.migration.licenseservice.service.LicenseEventProducer
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.MutationMapping
import org.springframework.stereotype.Controller

@Controller
class LicenseMutationResolver(
    private val licenseRepository: LicenseRepository,
    private val eventProducer: LicenseEventProducer
) {
    @MutationMapping
    fun updateLicenseStatus(
        @Argument userId: String,
        @Argument input: UpdateLicenseInput
    ): MutationResult {
        val updates = mutableMapOf<String, Any>()
        input.isValidSeat?.let { updates["isValidSeat"] = it }
        input.seatType?.let { updates["seatType"] = it }
        input.expirationDate?.let { updates["expirationDate"] = it }

        if (updates.isEmpty()) {
            return MutationResult(
                success = false,
                message = "No updates provided"
            )
        }

        // Publish event to Kafka - consumer will handle persistence
        val event = LicenseEvent(
            eventType = LicenseEventType.LICENSE_UPDATED,
            userId = userId,
            payload = updates
        )
        eventProducer.publishEvent(event)

        return MutationResult(
            success = true,
            message = "License update initiated"
        )
    }
}

// Input type
data class UpdateLicenseInput(
    val isValidSeat: Boolean? = null,
    val seatType: String? = null,
    val expirationDate: String? = null
)

data class MutationResult(
    val success: Boolean,
    val message: String? = null
)

