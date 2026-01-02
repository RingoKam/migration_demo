package com.migration.userservice.graphql

import com.migration.userservice.model.User
import com.migration.userservice.repository.UserRepository
import com.migration.userservice.service.JwtService
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.stereotype.Controller

@Controller
class UserQueryResolver(
    private val userRepository: UserRepository,
    private val jwtService: JwtService
) {
    @QueryMapping
    fun getUser(@Argument id: String): User? {
        return userRepository.findById(id)?.copy(password = null)
    }

    @QueryMapping
    fun verifyToken(@Argument token: String): VerifyTokenResponse {
        try {
            // Verify token
            val claims = jwtService.verifyToken(token)
            val userId = claims["userId"] as? String ?: claims.subject

            // Find user by ID
            val user = userRepository.findById(userId)
                ?: throw RuntimeException("User not found")

            return VerifyTokenResponse(
                user = user.copy(password = null),
                isValid = true
            )
        } catch (e: Exception) {
            throw RuntimeException("Invalid or expired token: ${e.message}")
        }
    }
}

data class VerifyTokenResponse(
    val user: User,
    val isValid: Boolean
)

