package org.course.service;

import org.course.dto.ReviewCreateDTO;
import org.course.dto.ReviewDto;
import org.course.entity.Dishes;
import org.course.entity.Review;
import org.course.entity.User;
import org.course.exception.ReviewNotFoundException;
import org.course.exception.UnauthorizedReviewUpdateException;
import org.course.mapper.ReviewMapper;
import org.course.repository.DishesRepository;
import org.course.repository.ReviewRepository;
import org.course.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.course.dto.ReviewUpdateDTO;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);
    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;
    private final UserRepository userRepository;
    private final DishesRepository dishesRepository;

    @Autowired
    public ReviewService(ReviewRepository reviewRepository, ReviewMapper reviewMapper,
                         UserRepository userRepository, DishesRepository dishesRepository) {
        this.reviewRepository = reviewRepository;
        this.reviewMapper = reviewMapper;
        this.userRepository = userRepository;
        this.dishesRepository = dishesRepository;
    }
    @CacheEvict(value = {"reviewsByUser", "reviewsByDish", "allReviews","sortReviews"}, allEntries = true)
    public ReviewDto createReview(ReviewCreateDTO reviewCreateDTO) {
        logger.info("Створення нового відгуку для блюда ID: {}", reviewCreateDTO.dishId());

        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("Користувача з емейлом {} не знайдено", email);
                    return new RuntimeException("Користувач не знайдений");
                });

        Dishes dish = dishesRepository.findById(reviewCreateDTO.dishId())
                .orElseThrow(() -> {
                    logger.error("Блюдо з ID {} не знайдено", reviewCreateDTO.dishId());
                    return new RuntimeException("Блюдо не знайдено");
                });

        logger.info("Знайдено користувача та блюдо. Зберігається відгук...");

        Review review = reviewMapper.toEntity(reviewCreateDTO);
        review.setUser(user);
        review.setDish(dish);

        Review savedReview = reviewRepository.save(review);
        logger.info("Відгук успішно збережено з ID: {}", savedReview.getId());

        return reviewMapper.toDto(savedReview);
    }
    @CacheEvict(value = {"reviewsByUser", "reviewsByDish", "allReviews", "sortReviews"}, allEntries = true)
    public ReviewDto updateReview(Long id, ReviewUpdateDTO reviewUpdateDTO, String email) {
        logger.info("Оновлення відгуку з ID: {}", id);

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ReviewNotFoundException("Відгук з ID " + id + " не знайдено"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Користувач не знайдений"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedReviewUpdateException("Ви не можете редагувати цей відгук");
        }

        review.setComment(reviewUpdateDTO.comment());
        review.setRating(reviewUpdateDTO.rating());

        Review updatedReview = reviewRepository.save(review);
        return reviewMapper.toDto(updatedReview);
    }
    @Cacheable("allReviews")
    public List<ReviewDto> getAllReviews() {
        logger.info("Отримання всіх відгуків...");
        List<ReviewDto> reviews = reviewRepository.findAll().stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
        logger.info("Знайдено {} відгуків", reviews.size());
        return reviews;
    }
    @Cacheable(value = "reviewsByUser", key = "#userId")
    public List<ReviewDto> getReviewsByUser(Long userId) {
        logger.info("Отримання відгуків для користувача з ID: {}", userId);
        List<ReviewDto> reviews = reviewRepository.findByUserId(userId).stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
        logger.info("Знайдено {} відгуків для користувача з ID {}", reviews.size(), userId);
        return reviews;
    }
    @Cacheable(value = "reviewsByDish", key = "#dishId")
    public List<ReviewDto> getReviewsByDish(Long dishId) {
        logger.info("Отримання відгуків для блюда з ID: {}", dishId);
        List<ReviewDto> reviews = reviewRepository.findByDishId(dishId).stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
        logger.info("Знайдено {} відгуків для блюда з ID {}", reviews.size(), dishId);
        return reviews;
    }
    @CacheEvict(value = {"reviewsByUser", "reviewsByDish", "allReviews", "sortReviews"}, allEntries = true)
    public void deleteReview(Long id) {
        logger.info("Видалення відгуку з ID: {}", id);
        if (reviewRepository.existsById(id)) {
            reviewRepository.deleteById(id);
            logger.info("Відгук з ID {} успішно видалено", id);
        } else {
            logger.warn("Відгук з ID {} не знайдено для видалення", id);
            throw new ReviewNotFoundException("Відгук з ID " + id + " не знайдено для видалення");
        }
    }
    @Cacheable("sortReviews")
    public List<ReviewDto> sortReviews(String sortBy, String order) {
        logger.info("Сортування відгуків за {} у порядку {}", sortBy, order);
        List<Review> reviews = reviewRepository.findAll();

        Comparator<Review> comparator = null;
        if ("date".equalsIgnoreCase(sortBy)) {
            comparator = Comparator.comparing(Review::getCreatedAt);
        } else if ("rating".equalsIgnoreCase(sortBy)) {
            comparator = Comparator.comparingInt(Review::getRating);
        }

        if (comparator != null) {
            if ("desc".equalsIgnoreCase(order)) {
                comparator = comparator.reversed();
            }
            reviews.sort(comparator);
            logger.info("Відгуки успішно відсортовано");
        } else {
            logger.warn("Некоректне поле сортування: {}", sortBy);
            throw new IllegalArgumentException("Некоректне поле сортування: " + sortBy);
        }

        return reviews.stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
    }
}
