package org.course.repository;

import org.course.entity.Order;
import org.course.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatus(OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.user.email = :email")
    List<Order> findByUserEmail(String email);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    Page<Order> findByUserEmailAndStatusIn(String email, List<OrderStatus> statuses, Pageable pageable);

    Page<Order> findByUserEmailAndStatusInAndViewedByUserFalse(
            String email, List<OrderStatus> statuses, Pageable pageable
    );

    Page<Order> findByUserEmailAndStatusInAndViewedByUserTrue(String email, List<OrderStatus> statuses, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.user.email = :email")
    Page<Order> findByUserEmail(String email, Pageable pageable);
}