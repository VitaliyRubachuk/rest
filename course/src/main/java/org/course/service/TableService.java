package org.course.service;

import org.course.dto.TableCreateDto;
import org.course.dto.TableDto;
import org.course.dto.TableReserveDto;
import org.course.entity.Tables;
import org.course.entity.User;
import org.course.exception.TableNotFoundException;
import org.course.exception.UserNotFoundException;
import org.course.mapper.TableMapper;
import org.course.repository.TableRepository;
import org.course.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId; // Додано
import java.util.List;

@Service
public class TableService {

    private final UserRepository userRepository;
    private static final int MAX_SEATS = 30;
    private static final Logger logger = LoggerFactory.getLogger(TableService.class);
    private final TableRepository tableRepository;
    private final TableMapper tableMapper;

    @Autowired
    public TableService(TableRepository tableRepository, TableMapper tableMapper, UserRepository userRepository) {
        this.tableRepository = tableRepository;
        this.tableMapper = tableMapper;
        this.userRepository = userRepository;
    }

    @Cacheable(value = "allTablesCache", unless = "#result.isEmpty()")
    public List<TableDto> getAllTables() {
        logger.info("Отримання списку всіх столиків...");
        List<TableDto> tables = tableRepository.findAll().stream()
                .map(tableMapper::toDto)
                .toList();
        logger.info("Знайдено {} столиків", tables.size());
        return tables;
    }

    @Cacheable(value = "IDTablesCache", key = "#id", unless = "#result == null")
    public TableDto getTableById(long id) {
        logger.info("Запит на отримання столика з ID: {}", id);
        TableDto tableDto = tableRepository.findById(id)
                .map(tableMapper::toDto)
                .orElseThrow(() -> {
                    logger.error("Стіл з ID {} не знайдено", id);
                    return new TableNotFoundException("Стіл з ID " + id + " не знайдено");
                });
        logger.info("Стіл з ID {} успішно знайдено", id);
        return tableDto;
    }

    @CacheEvict(value = {"IDTablesCache", "allTablesCache", "AvailableTablesCache"}, allEntries = true)
    public TableDto createTable(TableCreateDto tableCreateDto) {
        logger.info("Створення нового столика з номером {}", tableCreateDto.tableNumber());
        if (tableCreateDto.seats() > MAX_SEATS) {
            logger.warn("Кількість місць {} перевищує максимальне значення {}", tableCreateDto.seats(), MAX_SEATS);
            throw new IllegalArgumentException("Кількість місць за одним столом не може перевищувати " + MAX_SEATS);
        }

        if (tableRepository.existsByTableNumber(tableCreateDto.tableNumber())) {
            logger.warn("Стіл з номером {} вже існує", tableCreateDto.tableNumber());
            throw new IllegalArgumentException("Стіл з таким номером вже існує");
        }

        Tables table = tableMapper.toEntity(tableCreateDto);
        Tables savedTable = tableRepository.save(table);
        logger.info("Стіл з номером {} успішно створено", tableCreateDto.tableNumber());
        return tableMapper.toDto(savedTable);
    }

    @CacheEvict(value = {"IDTablesCache", "allTablesCache", "AvailableTablesCache"}, allEntries = true)
    public TableDto updateTable(long id, TableDto tableDto) {
        logger.info("Оновлення столика з ID: {}", id);
        if (tableDto.seats() <= 0) {
            logger.warn("Недопустима кількість місць: {}", tableDto.seats());
            throw new IllegalArgumentException("Кількість місць повинна бути більше нуля");
        }

        if (tableDto.seats() > MAX_SEATS) {
            logger.warn("Кількість місць {} перевищує максимальне значення {}", tableDto.seats(), MAX_SEATS);
            throw new IllegalArgumentException("Кількість місць за одним столом не може перевищувати " + MAX_SEATS);
        }

        if (tableRepository.existsByTableNumberAndIdNot(tableDto.tableNumber(), id)) {
            logger.warn("Стіл з номером {} вже існує", tableDto.tableNumber());
            throw new IllegalArgumentException("Стіл з таким номером вже існує");
        }

        Tables table = tableRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Стіл з ID {} не знайдено", id);
                    return new TableNotFoundException("Стіл з ID " + id + " не знайдено");
                });

        table.setTableNumber(tableDto.tableNumber());
        table.setSeats(tableDto.seats());
        table.setReserved(tableDto.isReserved());

        if (tableDto.isReserved()) {
            logger.info("Резервування столика з ID: {} користувачем ID: {}", id, tableDto.reservedByUserId());
            User user = userRepository.findById(tableDto.reservedByUserId())
                    .orElseThrow(() -> {
                        logger.error("Користувач з ID {} не знайдений", tableDto.reservedByUserId());
                        return new UserNotFoundException("Користувач з ID " + tableDto.reservedByUserId() + " не знайдений");
                    });

            table.setReservedByUser(user);
            table.setReservedAt(LocalDateTime.now());
            table.setReservedUntil(tableDto.reservedUntil());
        } else {
            logger.info("Скасування резервування столика з ID: {}", id);
            table.setReservedByUser(null);
            table.setReservedAt(null);
            table.setReservedUntil(null);
        }

        Tables updatedTable = tableRepository.save(table);
        logger.info("Стіл з ID {} успішно оновлено", id);
        return tableMapper.toDto(updatedTable);
    }

    @CacheEvict(value = {"IDTablesCache", "allTablesCache", "AvailableTablesCache"}, allEntries = true)
    public void deleteTable(long id) {
        logger.info("Видалення столика з ID: {}", id);
        if (!tableRepository.existsById(id)) {
            logger.error("Стіл з ID {} не знайдено для видалення", id);
            throw new TableNotFoundException("Стіл з ID " + id + " не знайдено для видалення");
        }
        tableRepository.deleteById(id);
        logger.info("Стіл з ID {} успішно видалено", id);
    }

    @CacheEvict(value = {"IDTablesCache", "allTablesCache", "AvailableTablesCache"}, allEntries = true)
    public TableDto reserveTable(long id, TableReserveDto tableReserveDto) {
        logger.info("Резервування столика з ID: {} до {}", id, tableReserveDto.reservedUntil());
        Tables table = tableRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Стіл з ID {} не знайдено", id);
                    return new TableNotFoundException("Стіл з ID " + id + " не знайдено");
                });

        if (table.isReserved()) {
            logger.warn("Стіл з ID {} вже зарезервований", id);
            throw new RuntimeException("Стіл вже зарезервований");
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneId.of("UTC"));
        if (tableReserveDto.reservedUntil().isBefore(nowUtc.plusMinutes(5))) {
            logger.warn("Час резервації має бути в майбутньому і мінімум на 5 хвилин вперед.");
            throw new IllegalArgumentException("Час резервації має бути в майбутньому і мінімум на 5 хвилин вперед.");
        }


        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    logger.error("Користувач з емейлом {} не знайдений", username);
                    return new UserNotFoundException("Користувач з емейлом " + username + " не знайдений");
                });

        table.setReserved(true);
        table.setReservedByUser(user);
        table.setReservedAt(LocalDateTime.now());
        table.setReservedUntil(tableReserveDto.reservedUntil());

        Tables reservedTable = tableRepository.save(table);
        logger.info("Стіл з ID {} успішно зарезервовано користувачем {} до {}", id, username, tableReserveDto.reservedUntil());
        return tableMapper.toDto(reservedTable);
    }

    @CacheEvict(value = {"IDTablesCache", "allTablesCache", "AvailableTablesCache"}, allEntries = true)
    public TableDto cancelReservation(long id) {
        logger.info("Скасування резервування  столика з ID: {}", id);
        Tables table = tableRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Стіл з ID {}  не  знайдено", id);
                    return new TableNotFoundException("Стіл з ID " + id + " не знайдено");
                });

        if (!table.isReserved()) {
            logger.warn("Стіл з ID {} не зарезервований", id);
            throw new RuntimeException("Стіл не зарезервований");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new UserNotFoundException("Користувач з емейлом " + username + " не знайдений"));

        if (!table.getReservedByUser().getId().equals(currentUser.getId())) {
            logger.warn("Користувач {} намагається скасувати резервацію столика {}, який не належить йому.", username, id);
            throw new RuntimeException("Ви можете скасувати резервацію лише своїх столиків.");
        }

        table.setReserved(false);
        table.setReservedByUser(null);
        table.setReservedAt(null);
        table.setReservedUntil(null);

        Tables updatedTable = tableRepository.save(table);
        logger.info("Резервування столика з ID {} успішно скасовано", id);
        return tableMapper.toDto(updatedTable);
    }

    @CacheEvict(value = {"IDTablesCache", "allTablesCache", "AvailableTablesCache"}, allEntries = true)
    public TableDto updateReservationTime(long id, TableReserveDto tableReserveDto) {
        logger.info("Оновлення часу резервації столика з ID: {} до {}", id, tableReserveDto.reservedUntil());
        Tables table = tableRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Стіл з ID {} не знайдено", id);
                    return new TableNotFoundException("Стіл з ID " + id + " не знайдено");
                });

        if (!table.isReserved()) {
            logger.warn("Стіл з ID {} не зарезервований, неможливо оновити час резервації.", id);
            throw new RuntimeException("Стіл не зарезервований, неможливо оновити час резервації.");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new UserNotFoundException("Користувач з емейлом " + username + " не знайдений"));

        if (!table.getReservedByUser().getId().equals(currentUser.getId())) {
            logger.warn("Користувач {} намагається змінити резервацію столика {}, який не належить йому.", username, id);
            throw new RuntimeException("Ви можете змінити час резервації лише своїх столиків.");
        }

        LocalDateTime nowUtc = LocalDateTime.now(ZoneId.of("UTC"));
        if (tableReserveDto.reservedUntil().isBefore(nowUtc.plusMinutes(5))) {
            logger.warn("Новий час резервації має бути в майбутньому і мінімум на 5 хвилин вперед.");
            throw new IllegalArgumentException("Новий час резервації має бути в майбутньому і мінімум на 5 хвилин вперед.");
        }

        table.setReservedUntil(tableReserveDto.reservedUntil());
        Tables updatedTable = tableRepository.save(table);
        logger.info("Час резервації столика з ID {} успішно оновлено до {}", id, tableReserveDto.reservedUntil());
        return tableMapper.toDto(updatedTable);
    }

    @Cacheable(value = "AvailableTablesCache", unless = "#result.isEmpty()")
    public List<TableDto> getAvailableTables() {
        logger.info("Отримання списку вільних столиків...");
        List<Tables> tables = tableRepository.findAll();
        LocalDateTime nowUtc = LocalDateTime.now(ZoneId.of("UTC"));
        for (Tables table : tables) {
            if (table.isReserved() && table.getReservedUntil() != null && table.getReservedUntil().isBefore(nowUtc)) {
                logger.info("Скасування резервації столика з ID {} через закінчення часу резервації.", table.getId());
                table.setReserved(false);
                table.setReservedByUser(null);
                table.setReservedAt(null);
                table.setReservedUntil(null);
                tableRepository.save(table);
            }
        }

        List<TableDto> availableTables = tableRepository.findByIsReservedFalse().stream()
                .map(tableMapper::toDto)
                .toList();
        logger.info("Знайдено {} вільних столиків", availableTables.size());
        return availableTables;
    }
}