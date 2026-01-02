package com.migration.licenseservice.model

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

data class LicenseEvent(
    @JsonProperty("eventType")
    val eventType: LicenseEventType,
    
    @JsonProperty("userId")
    val userId: String,
    
    @JsonProperty("payload")
    val payload: Map<String, Any>,
    
    @JsonProperty("timestamp")
    val timestamp: String = Instant.now().toString()
)

enum class LicenseEventType {
    LICENSE_UPDATED
}

