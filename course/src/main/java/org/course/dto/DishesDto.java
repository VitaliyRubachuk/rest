package org.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

public record DishesDto(
        @NotNull(message = "ID не може бути нульовим")
        long id,

        @NotBlank(message = "Ім’я не може бути пустим")
        @Size(min = 1, max = 100, message = "Назва має містити від 1 до 100 символів")
        String name,

        @NotBlank(message = "Категорія не може бути пустою")
        String category,

        @NotBlank(message = "Ціна не може бути пустою")
        @Pattern(regexp = "^[0-9]+(\\.[0-9]{1,2})?$", message = "Ціна має бути дійсним числом із 2 знаками після коми")
        String price,

        String description,

        String imageUrl
) implements Serializable {
}