package org.course.dto;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDateTime;

public record TableReserveDto(
        @NotNull(message = "Час закінчення резервації не може бути порожнім")
        LocalDateTime reservedUntil
) implements Serializable { }