package com.migration.userservice.graphql

import com.migration.userservice.model.User
import com.migration.userservice.repository.UserRepository
import org.springframework.graphql.data.method.annotation.Argument
import org.springframework.graphql.data.method.annotation.QueryMapping
import org.springframework.stereotype.Controller

@Controller
class UserQueryResolver(
    private val userRepository: UserRepository
) {
    @QueryMapping
    fun getUser(@Argument id: String): User? {
        return userRepository.findById(id)?.copy(password = null)
    }
}

