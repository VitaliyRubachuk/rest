package org.course.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 * DTO для створення нового користувача
 */
public record UserCreateDTO(
        @NotNull(message = "Ім'я користувача не може бути порожнім")
        @NotEmpty(message = "Ім'я користувача не може бути порожнім")
        @NotBlank(message = "Ім'я користувача не може бути порожнім")
        String name,

        @NotNull(message = "Email не може бути порожнім")
        @NotEmpty(message = "Email не може бути порожнім")
        @NotBlank(message = "Email не може бути порожнім")
        @Email(message = "Невірний формат email")
        String email,

        @NotNull(message = "Пароль не може бути порожнім")
        @NotEmpty(message = "Пароль не може бути порожнім")
        @NotBlank(message = "Пароль не може бути порожнім")
        @Size(min = 6, message = "Пароль повинен містити не менше 6 символів")
        String password
) implements Serializable {
}
