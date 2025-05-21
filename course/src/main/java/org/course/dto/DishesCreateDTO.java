package org.course.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;

public record DishesCreateDTO(
        @NotNull(message = "Ім’я не може бути нульовим")
        @Size(min = 1, max = 100, message = "Назва має містити від 1 до 100 символів")
        @NotBlank(message = "Ім’я не може бути пустим")
        String name,

        @NotNull(message = "Ціна не може 0")
        @DecimalMin(value = "0.0", inclusive = false, message = "Ціна має бути більше 0")
        @Digits(integer = 5, fraction = 2, message = "Ціна має бути дійсним числом із 2 знаками після коми")
        String price,

        @NotBlank(message = "Категорія не може бути пустою")
        @Pattern(regexp = "^[а-щА-ЩЬьЮюЯяЇїІіЄєҐґa-zA-Z\\s-]+$", message = "Категорія має містити лише літери, пробіли та дефіси")
        String category,

        @Size(max = 255, message = "Опис не повинен перевищувати 255 символів")
        String description,

        String imageUrl
) implements Serializable {
}