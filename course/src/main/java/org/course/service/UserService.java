package org.course.service;

import jakarta.annotation.PostConstruct;
import org.course.dto.PasswordUpdateDto;
import org.course.dto.TableDto;
import org.course.dto.UserCreateDTO;
import org.course.dto.UserDto;
import org.course.dto.UserUpdateDto;
import org.course.entity.Role;
import org.course.entity.User;
import org.course.exception.UserNotFoundException;
import org.course.mapper.UserMapper;
import org.course.repository.TableRepository;
import org.course.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Імпортуємо новий DTO для відповіді
import org.course.dto.UpdateUserResponse; // ДОДАНО

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final TableRepository tableRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService; // ДОДАНО: Ін'єкція JwtService
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    public UserService(UserRepository userRepository, UserMapper userMapper, TableRepository tableRepository, PasswordEncoder passwordEncoder, JwtService jwtService) { // ДОДАНО: JwtService до конструктора
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.tableRepository = tableRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService; // ДОДАНО: Ініціалізація JwtService
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Cacheable(value = "usersCache", unless = "#result.isEmpty()")
    public List<UserDto> getAllUsers() {
        try {
            logger.info("Запит на отримання всіх користувачів");
            return userRepository.findAll().stream()
                    .map(userMapper::toDto)
                    .toList();
        } catch (Exception e) {
            logger.error("Помилка під час отримання користувачів: {}", e.getMessage());
            throw new RuntimeException("Помилка при отриманні всіх користувачів");
        }
    }

    @Cacheable(value = "userByIdCache", key = "#id")
    public Optional<UserDto> getUserById(long id) {
        try {
            logger.info("Запит на отримання користувача з ID: {}", id);
            return userRepository.findById(id)
                    .map(userMapper::toDto);
        } catch (Exception e) {
            logger.error("Помилка при отриманні користувача з ID: {}", id, e);
            return Optional.empty();
        }
    }

    @CacheEvict(value = {"usersCache", "userByIdCache"}, allEntries = true)
    public UserDto createUser(UserCreateDTO userCreateDTO) {
        try {
            logger.info("Створення користувача з ім'ям: {}", userCreateDTO.name());
            if (userRepository.findByEmail(userCreateDTO.email()).isPresent()) {
                logger.error("Email {} вже використовується", userCreateDTO.email());
                throw new RuntimeException("Email вже використовується");
            }

            User user = userMapper.toEntity(userCreateDTO);
            user.setPassword(passwordEncoder.encode(userCreateDTO.password()));
            user.setRole(Role.USER);

            User savedUser = userRepository.save(user);
            logger.info("Користувача створено успішно з ID: {}", savedUser.getId());
            return userMapper.toDto(savedUser);
        } catch (RuntimeException e) {
            logger.error("Помилка при створенні користувача: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Неочікувана помилка при створенні користувача", e);
            throw new RuntimeException("Неочікувана помилка при створенні користувача");
        }
    }

    @PostConstruct
    public void createDefaultAdmin() {
        try {
            logger.info("Перевірка наявності адміністратора за замовчуванням");
            if (userRepository.findByEmail("admin@a").isEmpty()) {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@a");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
                logger.info("Адміністратор за замовчуванням створений");
            } else {
                logger.info("Адміністратор за замовчуванням вже існує");
            }
        } catch (Exception e) {
            logger.error("Помилка при створенні адміністратора за замовчуванням", e);
            throw new RuntimeException("Помилка при створенні адміністратора за замовчуванням");
        }
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @CacheEvict(value = {"usersCache", "userByIdCache"}, allEntries = true)
    public UpdateUserResponse updateUser(long id, UserUpdateDto userUpdateDto) { // ЗМІНЕНО ТИП ПОВЕРНЕННЯ
        try {
            logger.info("Оновлення користувача з ID: {}", id);
            User existingUser = userRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.error("Користувача з ID {} не знайдено", id);
                        return new UserNotFoundException("User not found with ID: " + id);
                    });

            String authenticatedEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            if (!existingUser.getEmail().equals(authenticatedEmail)) {
                logger.warn("Користувач {} намагається оновити профіль користувача з ID {}, який не належить йому.", authenticatedEmail, id);
                throw new SecurityException("Доступ заборонено: Ви можете оновити лише свій профіль.");
            }

            if (userUpdateDto.name() != null && !userUpdateDto.name().trim().isEmpty()) {
                existingUser.setName(userUpdateDto.name());
            }
            User updatedUser = userRepository.save(existingUser);
            logger.info("Користувач з ID {} оновлений успішно", updatedUser.getId());

            // ДОДАНО: Генерація нового токена
            String newToken = jwtService.generateToken(updatedUser); // updatedUser є UserDetails
            UserDto updatedUserDto = userMapper.toDto(updatedUser);

            return new UpdateUserResponse(updatedUserDto, newToken); // ПОВЕРТАЄМО DTO з оновленими даними та токеном
        } catch (SecurityException | UserNotFoundException e) {
            logger.error("Помилка оновлення користувача: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Неочікувана помилка при оновленні користувача", e);
            throw new RuntimeException("Неочікувана помилка при оновленні користувача");
        }
    }

    @CacheEvict(value = {"usersCache", "userByIdCache"}, allEntries = true)
    public UserDto updatePassword(long id, PasswordUpdateDto passwordUpdateDto) {
        try {
            logger.info("Оновлення пароля для користувача з ID: {}", id);
            User existingUser = userRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.error("Користувача з ID {} не знайдено", id);
                        return new UserNotFoundException("User not found with ID: " + id);
                    });

            String authenticatedEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            if (!existingUser.getEmail().equals(authenticatedEmail)) {
                logger.warn("Користувач {} намагається оновити пароль користувача з ID {}, який не належить йому.", authenticatedEmail, id);
                throw new SecurityException("Доступ заборонено: Ви можете оновити лише свій пароль.");
            }

            // Перевіряємо старий пароль
            if (!passwordEncoder.matches(passwordUpdateDto.oldPassword(), existingUser.getPassword())) {
                logger.warn("Невірний старий пароль для користувача з ID {}", id);
                throw new IllegalArgumentException("Невірний старий пароль.");
            }

            existingUser.setPassword(passwordEncoder.encode(passwordUpdateDto.newPassword()));
            User updatedUser = userRepository.save(existingUser);
            logger.info("Пароль для користувача з ID {} успішно оновлено", updatedUser.getId());
            return userMapper.toDto(updatedUser);
        } catch (SecurityException | UserNotFoundException | IllegalArgumentException e) {
            logger.error("Помилка оновлення пароля: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Неочікувана помилка при оновленні пароля", e);
            throw new RuntimeException("Неочікувана помилка при оновленні пароля");
        }
    }

    @Cacheable(value = "usersSortedCache")
    public List<UserDto> getUsersSortedByName() {
        try {
            logger.info("Запит на отримання користувачів, відсортованих за іменем");
            return userRepository.findAllByOrderByNameAsc().stream()
                    .map(userMapper::toDto)
                    .toList();
        } catch (Exception e) {
            logger.error("Помилка при отриманні відсортованих користувачів: {}", e.getMessage());
            throw new RuntimeException("Помилка при отриманні відсортованих користувачів");
        }
    }

    @CacheEvict(value = {"usersCache", "userByIdCache"}, allEntries = true)
    public void deleteUser(Long id) {
        try {
            logger.info("Видалення користувача з ID: {}", id);
            User user = userRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.error("Користувача з ID  {} не знайдено", id);
                        return new UserNotFoundException("User not found with ID: " + id);
                    });

            user.getReviews().forEach(review -> review.setUser(null));
            user.getReservedTables().forEach(table -> {
                table.setReserved(false);
                table.setReservedByUser(null);
                table.setReservedAt(null);
            });

            userRepository.delete(user);
            logger.info("Користувача з ID {} видалено успішно", id);
        } catch (UserNotFoundException e) {
            logger.error("Помилка при видаленні користувача з ID: {}", id, e);
            throw e;
        } catch (Exception e) {
            logger.error("Неочікувана помилка при видаленні користувача з ID: {}", id, e);
            throw new RuntimeException("Неочікувана помилка при видаленні користувача");
        }
    }
}