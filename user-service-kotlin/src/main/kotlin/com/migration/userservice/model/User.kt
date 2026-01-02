package com.migration.userservice.model

data class User(
    val id: String,
    val email: String,
    val username: String,
    val role: UserRole,
    val password: String? = null // Excluded from GraphQL responses
)

enum class UserRole {
    STUDENT,
    TEACHER,
    ADMIN
}

