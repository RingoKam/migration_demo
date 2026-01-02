package com.migration.userservice.model

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant

data class UserEvent(
    @JsonProperty("eventType")
    val eventType: UserEventType,
    
    @JsonProperty("userId")
    val userId: String,
    
    @JsonProperty("payload")
    val payload: Map<String, Any>,
    
    @JsonProperty("timestamp")
    val timestamp: String = Instant.now().toString(),
    
    @JsonProperty("source")
    val source: String
)

enum class UserEventType {
    USER_CREATED,
    USER_UPDATED
}

