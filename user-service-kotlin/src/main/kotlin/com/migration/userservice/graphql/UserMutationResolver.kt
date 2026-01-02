package com.migration.userservice.graphql

import com.migration.userservice.model.User
import com.migration.userservice.model.UserEvent
import com.migration.userservice.model.UserEventType
import com.migration.userservice.model.UserRole
import com.migration.userservice.repository.UserRepository
import com.migration.userservice.service.JwtService
import com.migration.userservice.service.UserEventProducer
import org.springframework.beans.factory.annotation.Value
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.MutationMapping
import org.springframework.stereotype.Controller
import java.util.*

@Controller
class UserMutationResolver(
    private val userRepository: UserRepository,
    private val eventProducer: UserEventProducer,
    private val jwtService: JwtService,
    @Value("\${KAFKA_EVENT_SOURCE:user-service-kotlin}")
    private val eventSource: String
) {
    @MutationMapping
    fun login(@Argument credentials: LoginInput): AuthPayload {
        // Find user by email
        val user = userRepository.findByEmail(credentials.email)
            ?: throw RuntimeException("Invalid credentials")

        // TODO: use hashed passwords
        if (user.password != credentials.password) {
            throw RuntimeException("Invalid credentials")
        }

        val token = jwtService.generateToken(user)

        return AuthPayload(
            token = token,
            user = user.copy(password = null) // Don't return password
        )
    }

    @MutationMapping
    fun register(@Argument input: RegisterInput): MutationResult {
        // Check if user already exists
        if (userRepository.findByEmail(input.email) != null) {
            throw RuntimeException("User with email ${input.email} already exists")
        }

        // Generate new user ID
        val userId = UUID.randomUUID().toString()
        
        // Create user data
        val userData = mapOf<String, Any>(
            "id" to userId,
            "email" to input.email,
            "username" to input.username,
            "role" to (input.role ?: UserRole.STUDENT).name,
            "password" to input.password // In production, this should be hashed
        )

        // Publish event to Kafka - consumer will handle persistence
        val event = UserEvent(
            eventType = UserEventType.USER_CREATED,
            userId = userId,
            payload = userData,
            source = eventSource
        )
        eventProducer.publishEvent(event)

        return MutationResult(
            success = true,
            message = "User registration initiated. Please login to get your token.",
            userId = userId
        )
    }

}

// Input types
data class LoginInput(
    val email: String,
    val password: String
)

data class RegisterInput(
    val email: String,
    val password: String,
    val username: String,
    val role: UserRole? = null
)

data class AuthPayload(
    val token: String,
    val user: User
)

data class MutationResult(
    val success: Boolean,
    val message: String? = null,
    val userId: String? = null
)

