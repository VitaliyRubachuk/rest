package org.course.controller;

import org.course.dto.DishesCreateDTO;
import org.course.dto.DishesDto;
import org.course.service.DishesService;
import org.course.service.FileStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dishes")
public class DishesController {

    private final DishesService dishesService;
    private final FileStorageService fileStorageService;

    public DishesController(DishesService dishesService, FileStorageService fileStorageService) {
        this.dishesService = dishesService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDishes() {
        List<DishesDto> dishes = dishesService.getAllDishes();
        return ResponseEntity.ok(Map.of("dishes", dishes));
    }

    @GetMapping("/{size}/page/{page}")
    public ResponseEntity<Map<String, Object>> getDishesWithPagination(@PathVariable int size, @PathVariable int page) {
        List<DishesDto> dishes = dishesService.getDishesWithPagination(size, page);
        return ResponseEntity.ok(Map.of("dishes", dishes));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getDishesByCategory(@PathVariable String category) {
        List<DishesDto> dishes = dishesService.getDishesByCategory(category);
        return ResponseEntity.ok(Map.of("dishes", dishes));
    }

    @GetMapping("/sort/price/{order}")
    public ResponseEntity<Map<String, Object>> sortDishesByPrice(@PathVariable boolean order) {
        List<DishesDto> dishes = dishesService.sortDishesByPrice(order);
        return ResponseEntity.ok(Map.of("dishes", dishes));
    }

    @GetMapping("/sort/name/{order}")
    public ResponseEntity<Map<String, Object>> sortDishesByName(@PathVariable boolean order) {
        List<DishesDto> dishes = dishesService.sortDishesByName(order);
        return ResponseEntity.ok(Map.of("dishes", dishes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DishesDto> getDishesById(@PathVariable long id) {
        return dishesService.getDishesById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> createDishes(
            @Valid @RequestPart("dish") DishesCreateDTO dishesRequest,
            BindingResult bindingResult,
            @RequestPart(name = "image", required = false) MultipartFile imageFile) {

        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }

        String imageUrl = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                imageUrl = fileStorageService.storeFile(imageFile);
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Помилка збереження файлу зображення: " + e.getMessage()));
            }
        } else if (dishesRequest.imageUrl() != null && !dishesRequest.imageUrl().isEmpty()) {
            imageUrl = dishesRequest.imageUrl();
        }

        DishesCreateDTO dishToCreate = new DishesCreateDTO(
                dishesRequest.name(),
                dishesRequest.price(),
                dishesRequest.category(),
                dishesRequest.description(),
                imageUrl
        );

        DishesDto createdDishes = dishesService.createDishes(dishToCreate);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("createdDish", createdDishes));
    }

    @PutMapping(value = "/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> updateDishes(
            @PathVariable long id,
            @Valid @RequestPart("dish") DishesDto dishesRequest,
            BindingResult bindingResult,
            @RequestPart(name = "image", required = false) MultipartFile imageFile) {

        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        if (dishesRequest.id() != id) {
            return ResponseEntity.badRequest().body(Map.of("error", "ID в тілі запиту не співпадає з ID в URL."));
        }

        String newImageUrl = dishesRequest.imageUrl();

        if (imageFile != null && !imageFile.isEmpty()) {
            Optional<DishesDto> existingDishOpt = dishesService.getDishesById(id);
            if (existingDishOpt.isPresent() && existingDishOpt.get().imageUrl() != null) {
                if (!existingDishOpt.get().imageUrl().startsWith("http://") && !existingDishOpt.get().imageUrl().startsWith("https://")) {
                    fileStorageService.deleteFile(existingDishOpt.get().imageUrl());
                }
            }
            try {
                newImageUrl = fileStorageService.storeFile(imageFile);
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Помилка збереження нового файлу зображення: " + e.getMessage()));
            }
        }

        DishesDto dishToUpdate = new DishesDto(
                id,
                dishesRequest.name(),
                dishesRequest.category(),
                dishesRequest.price(),
                dishesRequest.description(),
                newImageUrl
        );

        DishesDto updatedDishes = dishesService.updateDishes(id, dishToUpdate);
        return ResponseEntity.ok(Map.of("updatedDish", updatedDishes));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDishes(@PathVariable long id) {
        try {
            Optional<DishesDto> dishOpt = dishesService.getDishesById(id);
            String imageUrlToDelete = null;
            if (dishOpt.isPresent() && dishOpt.get().imageUrl() != null) {
                imageUrlToDelete = dishOpt.get().imageUrl();
            }

            dishesService.deleteDishes(id);

            if (imageUrlToDelete != null) {
                if (!imageUrlToDelete.startsWith("http://") && !imageUrlToDelete.startsWith("https://")) {
                    fileStorageService.deleteFile(imageUrlToDelete);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Страва успішно видалена."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Страва не знайдена або помилка видалення: " + e.getMessage()));
        }
    }
}