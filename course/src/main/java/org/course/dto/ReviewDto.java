package org.course.dto;

import java.time.LocalDateTime;

public record ReviewDto(
        Long id,
        Long userId,
        String userName,
        Long dishId,
        String comment,
        int rating,
        LocalDateTime createdAt
) {
}