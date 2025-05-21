package org.course.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Getter
@Setter
@NoArgsConstructor
@ToString
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "viewed_by_user")
    private boolean viewedByUser = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "order_dishes",
            joinColumns = @JoinColumn(name = "order_id"),
            inverseJoinColumns = @JoinColumn(name = "dish_id"))
    private List<Dishes> dishes;

    @Column(name = "fullprice")
    private double fullprice;

    @Column(name = "addition")
    private String addition;

    @Column(name = "dish_ids_string")
    private String dishIdsString;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status;

    @CreationTimestamp
    @Column(name = "order_date", updatable = false)
    private LocalDateTime orderDate;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_delivery")
    private Boolean isDelivery;

    @Column(name = "table_number")
    private Integer tableNumber;

    @Column(name = "delivery_city")
    private String city;

    @Column(name = "delivery_street")
    private String street;

    @Column(name = "delivery_house_number")
    private String houseNumber;

    @Column(name = "delivery_apartment_number")
    private String apartmentNumber;

    @Column(name = "phone_number")
    private String phoneNumber;

    public void updateDishIdsString() {
        if (dishes != null) {
            this.dishIdsString = dishes.stream()
                    .map(dish -> String.valueOf(dish.getId()))
                    .collect(Collectors.joining(","));
        }
    }
}