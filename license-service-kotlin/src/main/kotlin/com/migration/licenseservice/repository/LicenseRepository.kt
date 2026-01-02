package com.migration.licenseservice.repository

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.migration.licenseservice.model.LicenseStatus
import org.springframework.stereotype.Repository
import java.nio.file.Paths

@Repository
class LicenseRepository {
    private val mapper = jacksonObjectMapper()
    private val dataDir = Paths.get("data").toAbsolutePath()
    private val licensesFile = dataDir.resolve("licenses.json")

    init {
        // Ensure data directory exists
        dataDir.toFile().mkdirs()
    }

    fun findByUserId(userId: String): LicenseStatus {
        val licenses = readLicenses()
        val licenseData = licenses[userId]
        
        return if (licenseData != null) {
            LicenseStatus(
                id = userId,
                isValidSeat = licenseData["isValidSeat"] as? Boolean ?: false,
                seatType = licenseData["seatType"] as? String,
                expirationDate = licenseData["expirationDate"] as? String
            )
        } else {
            // Return default values if user not found (matching Python service behavior)
            LicenseStatus(
                id = userId,
                isValidSeat = false,
                seatType = null,
                expirationDate = null
            )
        }
    }

    private fun readLicenses(): Map<String, Map<String, Any>> {
        return try {
            if (!licensesFile.toFile().exists()) {
                // Create empty file if it doesn't exist
                mapper.writeValue(licensesFile.toFile(), emptyMap<String, Any>())
                return emptyMap()
            }
            val content = licensesFile.toFile().readText()
            if (content.isBlank()) {
                return emptyMap()
            }
            mapper.readValue<Map<String, Map<String, Any>>>(content)
        } catch (e: Exception) {
            println("Error reading licenses file: ${e.message}")
            emptyMap()
        }
    }
}

