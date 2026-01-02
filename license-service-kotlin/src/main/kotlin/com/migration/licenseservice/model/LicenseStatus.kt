package com.migration.licenseservice.model

data class LicenseStatus(
    val id: String,
    val isValidSeat: Boolean,
    val seatType: String? = null,
    val expirationDate: String? = null
)

