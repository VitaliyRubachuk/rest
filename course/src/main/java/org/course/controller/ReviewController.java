package org.course.controller;

import jakarta.validation.Valid;
import org.course.dto.ReviewCreateDTO;
import org.course.dto.ReviewDto;
import org.course.exception.ReviewNotFoundException;
import org.course.exception.UnauthorizedReviewUpdateException;
import org.course.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.course.dto.ReviewUpdateDTO;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @Autowired
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewUpdateDTO reviewUpdateDTO,
            BindingResult bindingResult,
            Principal principal
    ) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        try {
            ReviewDto updatedReview = reviewService.updateReview(id, reviewUpdateDTO, principal.getName());
            return ResponseEntity.ok(Map.of("updatedReview", updatedReview));
        } catch (UnauthorizedReviewUpdateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (ReviewNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/dish/{dishId}")
    public ResponseEntity<Map<String, Object>> getReviewsByDishId(@PathVariable Long dishId) {
        try {
            List<ReviewDto> reviews = reviewService.getReviewsByDish(dishId);
            return ResponseEntity.ok(Map.of("reviews", reviews));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Страва не знайдена."));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getReviewsByUserId(@PathVariable Long userId) {
        try {
            List<ReviewDto> reviews = reviewService.getReviewsByUser(userId);
            return ResponseEntity.ok(Map.of("reviews", reviews));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Користувач не знайдений."));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addReview(@Valid @RequestBody ReviewCreateDTO reviewCreateDTO, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        ReviewDto createdReview = reviewService.createReview(reviewCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("createdReview", createdReview));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteReview(@PathVariable Long id) {
        try {
            reviewService.deleteReview(id);
            return ResponseEntity.ok(Map.of("message", "Відгук успішно видалено."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Відгук не знайдено."));
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllReviews() {
        List<ReviewDto> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(Map.of("reviews", reviews));
    }

    @GetMapping("/sort")
    public ResponseEntity<Map<String, Object>> sortReviews(
            @RequestParam(required = false, defaultValue = "date") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String order) {
        if (!sortBy.matches("date|rating") || !order.matches("asc|desc")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Некоректні параметри сортування. Доступні sortBy: 'date', 'rating'. Order: 'asc', 'desc'."));
        }
        List<ReviewDto> sortedReviews = reviewService.sortReviews(sortBy, order);
        return ResponseEntity.ok(Map.of("sortedReviews", sortedReviews));
    }
}
