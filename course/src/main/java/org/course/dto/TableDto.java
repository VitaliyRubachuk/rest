package org.course.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public record TableDto(long id, int tableNumber, int seats, boolean isReserved, Long reservedByUserId, LocalDateTime reservedAt, LocalDateTime reservedUntil) implements Serializable { }