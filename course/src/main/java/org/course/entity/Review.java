package org.course.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"user", "dish"})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne
    @JoinColumn(name = "dish_id", nullable = false)
    private Dishes dish;

    private String comment;

    private int rating;

    private LocalDateTime createdAt = LocalDateTime.now();


    public Review(User user, Dishes dish, String comment, int rating) {
        this.user = user;
        this.dish = dish;
        this.comment = comment;
        this.rating = rating;
    }
}
