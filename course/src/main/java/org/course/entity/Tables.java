package org.course.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import jakarta.persistence.Entity;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@ToString
public class Tables {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "table_number", nullable = false, unique = true)
    private int tableNumber;

    @Column(name = "seats", nullable = false)
    private int seats;

    @Column(name = "is_reserved", nullable = false)
    private boolean isReserved;

    @ManyToOne
    @JoinColumn(name = "reserved_by_user_id")
    private User reservedByUser;

    private LocalDateTime reservedAt;
    private LocalDateTime reservedUntil;

    public Tables(int tableNumber, int seats, boolean isReserved) {
        this.tableNumber = tableNumber;
        this.seats = seats;
        this.isReserved = isReserved;
    }
}