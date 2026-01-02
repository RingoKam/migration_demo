package com.migration.userservice.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.migration.userservice.model.User
import com.migration.userservice.model.UserEvent
import com.migration.userservice.model.UserEventType
import com.migration.userservice.model.UserRole
import com.migration.userservice.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service

@Service
class UserEventConsumer(
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(UserEventConsumer::class.java)

    @KafkaListener(topics = ["user-events"], groupId = "user-service-group")
    fun handleUserEvent(eventJson: String) {
        try {
            val event = objectMapper.readValue(eventJson, UserEvent::class.java)
            logger.info("Received user event: ${event.eventType} for user ${event.userId}")

            when (event.eventType) {
                UserEventType.USER_CREATED -> {
                    handleUserCreated(event)
                }
                UserEventType.USER_UPDATED -> {
                    handleUserUpdated(event)
                }
            }
        } catch (e: Exception) {
            logger.error("Error processing user event: ${e.message}", e)
        }
    }

    private fun handleUserCreated(event: UserEvent) {
        val payload = event.payload
        val user = User(
            id = payload["id"] as String,
            email = payload["email"] as String,
            username = payload["username"] as String,
            role = UserRole.valueOf(payload["role"] as String),
            password = payload["password"] as? String
        )
        userRepository.save(user)
        logger.info("User created: ${user.id}")
    }

    private fun handleUserUpdated(event: UserEvent) {
        val updates = event.payload.toMutableMap()
        // Remove id from updates as it's not updatable
        updates.remove("id")
        
        userRepository.update(event.userId, updates)
        logger.info("User updated: ${event.userId}")
    }
}

