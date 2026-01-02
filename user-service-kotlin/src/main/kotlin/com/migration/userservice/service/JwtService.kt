package com.migration.userservice.service

import com.migration.userservice.model.User
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.*

@Service
class JwtService(
    @Value("\${jwt.secret}") private val secret: String,
    @Value("\${jwt.expires-in}") private val expiresIn: String
) {
    private val key = Keys.hmacShaKeyFor(ensureSecretLength(secret).toByteArray())
    
    /**
     * Ensures the secret is at least 32 bytes (256 bits) for HMAC SHA-256
     * If shorter, pads it with the secret repeated
     */
    private fun ensureSecretLength(secret: String): String {
        val minLength = 32
        return if (secret.length >= minLength) {
            secret
        } else {
            // Repeat the secret until it's at least 32 bytes
            secret.repeat((minLength / secret.length) + 1).take(minLength)
        }
    }
    
    fun verifyToken(token: String): Claims {
        return try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .payload
        } catch (e: Exception) {
            throw RuntimeException("Invalid or expired token", e)
        }
    }

    fun generateToken(user: User): String {
        val now = Date()
        val expiration = calculateExpiration(now)
        
        return Jwts.builder()
            .subject(user.id)
            .claim("userId", user.id)
            .claim("email", user.email)
            .claim("role", user.role.name)
            .issuedAt(now)
            .expiration(expiration)
            .signWith(key)
            .compact()
    }

    private fun calculateExpiration(issuedAt: Date): Date {
        val expirationMillis = when {
            expiresIn.endsWith("d") -> {
                val days = expiresIn.removeSuffix("d").toLongOrNull() ?: 7L
                days * 24 * 60 * 60 * 1000
            }
            expiresIn.endsWith("h") -> {
                val hours = expiresIn.removeSuffix("h").toLongOrNull() ?: 24L
                hours * 60 * 60 * 1000
            }
            expiresIn.endsWith("m") -> {
                val minutes = expiresIn.removeSuffix("m").toLongOrNull() ?: 60L
                minutes * 60 * 1000
            }
            expiresIn.endsWith("s") -> {
                val seconds = expiresIn.removeSuffix("s").toLongOrNull() ?: 3600L
                seconds * 1000
            }
            else -> 7L * 24 * 60 * 60 * 1000 // Default to 7 days
        }
        return Date(issuedAt.time + expirationMillis)
    }
}

