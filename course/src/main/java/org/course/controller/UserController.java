package org.course.controller;

import jakarta.validation.Valid;
import org.course.dto.*; // Переконайтеся, що UpdateUserResponse імпортовано
import org.course.entity.User;
import org.course.exception.UserNotFoundException;
import org.course.repository.UserRepository;
import org.course.service.TableService;
import org.course.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final TableService tableService;

    @Autowired
    public UserController(UserService userService, UserRepository userRepository, TableService tableService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.tableService = tableService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(Map.of("users", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable long id) {
        Optional<UserDto> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody UserCreateDTO userCreateDTO, BindingResult result) {
        if (result.hasErrors()) {
            List<String> errors = result.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("errors", errors));
        }
        try {
            UserDto createdUser = userService.createUser(userCreateDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("createdUser", createdUser));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sorted/name")
    public ResponseEntity<Map<String, Object>> getUsersSortedByName() {
        List<UserDto> users = userService.getUsersSortedByName();
        return ResponseEntity.ok(Map.of("users", users));
    }

    @PutMapping("/{id}") // Змінено на UserUpdateDto
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable long id, @Valid @RequestBody UserUpdateDto userUpdateDto, BindingResult result) {
        if (result.hasErrors()) {
            List<String> errors = result.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("errors", errors));
        }
        try {
            // Перевіряємо, чи оновлюється лише ім'я (password = null)
            if (userUpdateDto.password() == null) {
                UpdateUserResponse response = userService.updateUser(id, userUpdateDto); // ЗМІНЕНО: Отримуємо UpdateUserResponse
                return ResponseEntity.ok(Map.of(
                        "updatedUser", response.updatedUser(), // ДОДАНО: Оновлений користувач DTO
                        "newToken", response.newToken() // ДОДАНО: Новий токен
                ));
            } else {
                // Якщо password не null, це не той ендпоінт для зміни пароля
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Для зміни пароля використовуйте /api/users/{id}/password."));
            }
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Користувача не знайдено."));
        }
    }

    @PutMapping("/{id}/password") // Новий ендпоінт для зміни пароля
    public ResponseEntity<Map<String, Object>> updatePassword(@PathVariable long id, @Valid @RequestBody PasswordUpdateDto passwordUpdateDto, BindingResult result) {
        if (result.hasErrors()) {
            List<String> errors = result.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("errors", errors));
        }
        try {
            UserDto updatedUser = userService.updatePassword(id, passwordUpdateDto);
            return ResponseEntity.ok(Map.of("message", "Пароль успішно оновлено.", "updatedUser", updatedUser));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Користувача не знайдено."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Користувача успішно видалено."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Користувача не знайдено."));
        }
    }

    @GetMapping("/my-tables")
    public ResponseEntity<Map<String, Object>> getMyTables() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        User user = userRepository.findByEmail(currentUserName)
                .orElseThrow(() -> new UserNotFoundException("Користувач не знайдений."));

        List<TableDto> myTables = tableService.getAllTables().stream()
                .filter(tableDto -> tableDto.isReserved() && tableDto.reservedByUserId() != null && tableDto.reservedByUserId().equals(user.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("myTables", myTables));
    }
}