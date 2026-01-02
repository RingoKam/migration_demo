package com.migration.userservice.repository

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.migration.userservice.model.User
import com.migration.userservice.model.UserRole
import org.springframework.stereotype.Repository
import java.io.File
import java.nio.file.Paths

@Repository
class UserRepository {
    private val mapper = jacksonObjectMapper()
    private val dataDir = Paths.get("data").toAbsolutePath()
    private val usersFile = dataDir.resolve("users.json")

    init {
        // Ensure data directory exists
        dataDir.toFile().mkdirs()
    }

    fun findById(id: String): User? {
        val users = readUsers()
        return users[id]?.let { userData ->
            User(
                id = userData["id"] as String,
                email = userData["email"] as String,
                username = userData["username"] as String,
                role = UserRole.valueOf(userData["role"] as String),
                password = userData["password"] as? String
            )
        }
    }

    fun findByEmail(email: String): User? {
        val users = readUsers()
        return users.values.firstOrNull { it["email"] == email }?.let { userData ->
            User(
                id = userData["id"] as String,
                email = userData["email"] as String,
                username = userData["username"] as String,
                role = UserRole.valueOf(userData["role"] as String),
                password = userData["password"] as? String
            )
        }
    }

    fun save(user: User): User {
        val users = readUsers().toMutableMap()
        users[user.id] = mapOf(
            "id" to user.id,
            "email" to user.email,
            "username" to user.username,
            "role" to user.role.name,
            "password" to (user.password ?: "")
        )
        writeUsers(users)
        return user
    }

    fun update(id: String, updates: Map<String, Any>): User? {
        val users = readUsers().toMutableMap()
        val existing = users[id]?.toMutableMap() ?: return null
        
        updates.forEach { (key, value) ->
            when (key) {
                "email" -> existing["email"] = value as String
                "username" -> existing["username"] = value as String
                "role" -> existing["role"] = (value as UserRole).name
                "password" -> existing["password"] = value as String
            }
        }
        
        users[id] = existing
        writeUsers(users)
        
        return findById(id)
    }

    private fun writeUsers(users: Map<String, Map<String, Any>>) {
        try {
            mapper.writeValue(usersFile.toFile(), users)
        } catch (e: Exception) {
            println("Error writing users file: ${e.message}")
            throw RuntimeException("Failed to save user data", e)
        }
    }

    private fun readUsers(): Map<String, Map<String, Any>> {
        return try {
            if (!usersFile.toFile().exists()) {
                // Create empty file if it doesn't exist
                mapper.writeValue(usersFile.toFile(), emptyMap<String, Any>())
                return emptyMap()
            }
            val content = usersFile.toFile().readText()
            if (content.isBlank()) {
                return emptyMap()
            }
            mapper.readValue<Map<String, Map<String, Any>>>(content)
        } catch (e: Exception) {
            println("Error reading users file: ${e.message}")
            emptyMap()
        }
    }
}

