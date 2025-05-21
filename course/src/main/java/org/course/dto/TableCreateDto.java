package org.course.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

public record TableCreateDto(
        @NotNull(message = "Номер столу не може бути порожнім")
        @Min(value = 1, message = "Номер столу повинен бути більше 0")
        int tableNumber,

        @NotNull(message = "Кількість місць не може бути порожньою")
        @Min(value = 1, message = "Кількість місць повинна бути більше 0")
        @Max(value = 30, message = "Кількість місць не може перевищувати 30")
        int seats
) implements Serializable { }
