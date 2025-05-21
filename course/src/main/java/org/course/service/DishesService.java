package org.course.service;
import org.course.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.course.dto.DishesCreateDTO;
import org.course.dto.DishesDto;
import org.course.entity.Dishes;
import org.course.mapper.DishesMapper;
import org.course.repository.DishesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;
import org.course.entity.Order;

@Service
public class DishesService {

    private static final Logger logger = LoggerFactory.getLogger(DishesService.class);
    private final DishesRepository dishesRepository;
    private final DishesMapper dishesMapper;
    private final OrderRepository orderRepository;

    @Autowired
    public DishesService(DishesRepository dishesRepository, DishesMapper dishesMapper, OrderRepository orderRepository) {
        this.dishesRepository = dishesRepository;
        this.dishesMapper = dishesMapper;
        this.orderRepository = orderRepository;
    }

    @Cacheable(value = "dishesCache", unless = "#result == null || #result.isEmpty()")
    public List<DishesDto> getAllDishes() {
        try {
            logger.info("Отримання всіх страв з бази даних");
            List<DishesDto> dishes = dishesRepository.findAll().stream()
                    .map(dishesMapper::toDto)
                    .toList();
            logger.info("Знайдено {} страв", dishes.size());
            return dishes;
        } catch (Exception e) {
            logger.error("Помилка при отриманні всіх страв", e);
            throw new RuntimeException("Помилка при отриманні всіх страв", e);
        }
    }
    @Cacheable(value = "dishesCache", unless = "#result == null || #result.isEmpty()")
    public List<DishesDto> getDishesWithPagination(int size, int page) {
        try {
            logger.info("Отримання страв з пагінацією: сторінка {}, розмір {}", page, size);
            Pageable pageable = PageRequest.of(page, size);
            Page<Dishes> dishesPage = dishesRepository.findAll(pageable);
            if (dishesPage.isEmpty()) {
                logger.warn("Не знайдено страв на сторінці {} з розміром {}", page, size);
            }
            return dishesPage.stream()
                    .map(dishesMapper::toDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Помилка при отриманні страв з пагінацією для сторінки {} і розміру {}", page, size, e);
            throw new RuntimeException("Помилка при отриманні страв з пагінацією", e);
        }
    }
    @Cacheable(value = "dishesCache", unless = "#result == null || #result.isEmpty()")
    public List<DishesDto> getDishesByCategory(String category) {
        try {
            logger.info("Отримання страв за категорією: {}", category);
            List<DishesDto> dishes = dishesRepository.findByCategory(category).stream()
                    .map(dishesMapper::toDto)
                    .toList();
            if (dishes.isEmpty()) {
                logger.warn("Не знайдено жодної страви для категорії: {}", category);
            }
            return dishes;
        } catch (Exception e) {
            logger.error("Помилка при отриманні страв за категорією {}", category, e);
            throw new RuntimeException("Помилка при отриманні страв за категорією", e);
        }
    }
    @Cacheable(value = "dishesCache", unless = "#result == null || #result.isEmpty()")
    public List<DishesDto> sortDishesByPrice(boolean ascending) {
        try {
            logger.info("Сортування страв за ціною в порядку {}", ascending ? "зростання" : "спадання");
            List<Dishes> dishes = ascending ? dishesRepository.findAllByOrderByPriceAsc() : dishesRepository.findAllByOrderByPriceDesc();
            if (dishes.isEmpty()) {
                logger.warn("Жодних страв для сортування за ціною");
            }
            return dishes.stream()
                    .map(dishesMapper::toDto)
                    .toList();
        } catch (Exception e) {
            logger.error("Помилка при сортуванні страв за ціною", e);
            throw new RuntimeException("Помилка при сортуванні страв за ціною", e);
        }
    }
    @Cacheable(value = "dishesCache", unless = "#result == null || #result.isEmpty()")
    public List<DishesDto> sortDishesByName(boolean ascending) {
        try {
            logger.info("Сортування страв за назвою в порядку {}", ascending ? "зростання" : "спадання");
            List<Dishes> dishes = ascending ? dishesRepository.findAllByOrderByNameAsc() : dishesRepository.findAllByOrderByNameDesc();
            if (dishes.isEmpty()) {
                logger.warn("Жодних страв для сортування за назвою");
            }
            return dishes.stream()
                    .map(dishesMapper::toDto)
                    .toList();
        } catch (Exception e) {
            logger.error("Помилка при сортуванні страв за назвою", e);
            throw new RuntimeException("Помилка при сортуванні страв за назвою", e);
        }
    }

    @Cacheable(value = "dishesCache", unless = "#result == null")
    public Optional<DishesDto> getDishesById(long id) {
        try {
            logger.info("Запит на отримання страви з ID: {}", id);
            Optional<DishesDto> dish = dishesRepository.findById(id)
                    .map(dishesMapper::toDto);
            if (dish.isEmpty()) {
                logger.warn("Страва з ID: {} не знайдена", id);
            } else {
                logger.info("Страва з ID: {} знайдена", id);
            }
            return dish;
        } catch (Exception e) {
            logger.error("Помилка при отриманні страви з ID: {}", id, e);
            throw new RuntimeException("Помилка при отриманні страви", e);
        }
    }
    @CacheEvict(value = "dishesCache", allEntries = true)
    public DishesDto createDishes(DishesCreateDTO dishesCreateDTO) {
        try {
            logger.info("Створення нової страви з даними: {}", dishesCreateDTO);
            Dishes dishes = dishesMapper.toEntity(dishesCreateDTO);
            try {
                dishes.setPrice(Double.parseDouble(dishesCreateDTO.price().replace(",", ".")));
            } catch (NumberFormatException e) {
                logger.error("Некоректний формат ціни: {}", dishesCreateDTO.price(), e);
                throw new IllegalArgumentException("Некоректний формат ціни: " + dishesCreateDTO.price());
            }
            Dishes savedDishes = dishesRepository.save(dishes);
            logger.info("Страва створена з ID: {}", savedDishes.getId());
            return dishesMapper.toDto(savedDishes);
        } catch (Exception e) {
            logger.error("Помилка при створенні страви з даними: {}", dishesCreateDTO, e);
            throw new RuntimeException("Помилка при створенні страви", e);
        }
    }

    @CacheEvict(value = "dishesCache", allEntries = true)
    public DishesDto updateDishes(long id, DishesDto dishesDto) {
        try {
            logger.info("Оновлення страви з ID: {}", id);
            Dishes dishes = dishesRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.error("Страва з ID: {} не знайдена", id);
                        return new RuntimeException("Страва не знайдена");
                    });

            dishes.setName(dishesDto.name());
            dishes.setCategory(dishesDto.category());
            dishes.setDescription(dishesDto.description());
            dishes.setImageUrl(dishesDto.imageUrl());
            try {
                dishes.setPrice(Double.parseDouble(dishesDto.price().replace(",", ".")));
            } catch (NumberFormatException e) {
                logger.error("Некоректний формат ціни при оновленні: {}", dishesDto.price(), e);
                throw new IllegalArgumentException("Некоректний формат ціни: " + dishesDto.price());
            }

            Dishes updatedDishes = dishesRepository.save(dishes);
            logger.info("Страва з ID: {} успішно оновлена", id);
            return dishesMapper.toDto(updatedDishes);
        } catch (Exception e) {
            logger.error("Помилка при оновленні страви з ID: {}", id, e);
            throw new RuntimeException("Помилка при оновленні страви", e);
        }
    }

    @CacheEvict(value = "dishesCache", allEntries = true)
    public void deleteDishes(long id) {
        try {
            logger.info("Видалення страви з ID: {}", id);

            List<Order> ordersWithDish = orderRepository.findAll().stream()
                    .filter(order -> order.getDishes().stream().anyMatch(dish -> dish.getId() == id))
                    .collect(Collectors.toList());

            for (Order order : ordersWithDish) {
                order.getDishes().removeIf(dish -> dish.getId() == id);
                orderRepository.save(order);
                logger.info("Страва з ID: {} була видалена з замовлення з ID: {}", id, order.getId());
            }

            dishesRepository.deleteById(id);

            logger.info("Страва з ID: {} успішно видалена", id);
        } catch (Exception e) {
            logger.error("Помилка при видаленні страви з ID: {}", id, e);
            throw new RuntimeException("Помилка при видаленні страви", e);
        }
    }
}