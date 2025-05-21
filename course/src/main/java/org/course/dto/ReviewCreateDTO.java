package org.course.dto;

import jakarta.validation.constraints.*;

public record ReviewCreateDTO(
        Long userId,

        @NotNull(message = "Ідентифікатор страви не може бути порожнім")
        Long dishId,

        @NotBlank(message = "Коментар не може бути порожнім")
        @Size(max = 500, message = "Коментар не може перевищувати 500 символів")
        String comment,

        @Min(value = 1, message = "Оцінка повинна бути від 1 до 5")
        @Max(value = 5, message = "Оцінка повинна бути від 1 до 5")
        int rating
) {
}
