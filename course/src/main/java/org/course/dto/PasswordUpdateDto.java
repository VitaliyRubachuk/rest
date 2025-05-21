package org.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

public record PasswordUpdateDto(
        @NotBlank(message = "Старий пароль не може бути порожнім")
        String oldPassword,
        @NotBlank(message = "Новий пароль не може бути порожнім")
        @Size(min = 6, message = "Новий пароль повинен містити не менше 6 символів")
        String newPassword
) implements Serializable {
}