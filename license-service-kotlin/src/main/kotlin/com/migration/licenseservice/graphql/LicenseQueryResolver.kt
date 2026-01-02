package com.migration.licenseservice.graphql

import com.migration.licenseservice.model.LicenseStatus
import com.migration.licenseservice.repository.LicenseRepository
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.stereotype.Controller

@Controller
class LicenseQueryResolver(
    private val licenseRepository: LicenseRepository
) {
    @QueryMapping
    fun getLicenseStatus(@Argument userId: String): LicenseStatus {
        return licenseRepository.findByUserId(userId)
    }
}

