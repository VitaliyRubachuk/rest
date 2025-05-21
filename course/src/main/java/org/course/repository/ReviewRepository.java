package org.course.repository;
import org.course.entity.User;
import org.course.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUser(User user);
    List<Review> findByDishId(Long dishId);
    List<Review> findByDishIdAndUserId(Long dishId, Long userId);
    List<Review> findByUserId(Long userId);
}
