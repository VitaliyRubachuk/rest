package org.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;
import java.util.List;

/**
 * DTO for {@link org.course.entity.Order}
 */
public record OrderCreateDTO(
        @NotNull(message = "User ID не може бути порожнім")
        long userId,

        @NotEmpty(message = "Список страв не може бути порожнім")
        List<Long> dishIds,

        String addition,

        String status,

        @NotNull(message = "Необхідно вказати, чи це доставка")
        Boolean isDelivery,

        Integer tableNumber,

        String city,
        String street,
        String houseNumber,
        String apartmentNumber,

        @Pattern(regexp = "^\\+?\\d{10,15}$", message = "Некоректний формат номеру телефону. Він має починатись з '+' або складатися з 10-15 цифр.")
        String phoneNumber
) implements Serializable {
}