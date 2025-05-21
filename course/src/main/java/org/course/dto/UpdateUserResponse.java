package org.course.dto;

public record UpdateUserResponse(
        UserDto updatedUser,
        String newToken
) {}