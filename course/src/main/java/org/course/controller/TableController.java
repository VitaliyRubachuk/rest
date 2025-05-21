package org.course.controller;

import jakarta.validation.Valid;
import org.course.dto.TableCreateDto;
import org.course.dto.TableDto;
import org.course.dto.TableReserveDto; // Імпортуємо новий DTO
import org.course.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    @Autowired
    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllTables() {
        List<TableDto> tables = tableService.getAllTables();
        return ResponseEntity.ok(Map.of("tables", tables));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTableById(@PathVariable long id) {
        try {
            TableDto table = tableService.getTableById(id);
            return ResponseEntity.ok(Map.of("table", table));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Стіл не знайдено."));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTable(@Valid @RequestBody TableCreateDto tableCreateDto, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }

        TableDto createdTable = tableService.createTable(tableCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("createdTable", createdTable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTable(@PathVariable long id, @Valid @RequestBody TableDto tableDto, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }

        try {
            TableDto updatedTable = tableService.updateTable(id, tableDto);
            return ResponseEntity.ok(Map.of("updatedTable", updatedTable));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Стіл не знайдено."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTable(@PathVariable long id) {
        try {
            tableService.deleteTable(id);
            return ResponseEntity.ok(Map.of("message", "Стіл успішно видалено."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Стіл не знайдено."));
        }
    }

    @PostMapping("/{id}/reserve")
    public ResponseEntity<Map<String, Object>> reserveTable(@PathVariable long id, @Valid @RequestBody TableReserveDto tableReserveDto, BindingResult bindingResult) { // Змінено
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        try {
            TableDto reservedTable = tableService.reserveTable(id, tableReserveDto);
            return ResponseEntity.ok(Map.of("reservedTable", reservedTable));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reserve")
    public ResponseEntity<Map<String, Object>> updateReservationTime(@PathVariable long id, @Valid @RequestBody TableReserveDto tableReserveDto, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        try {
            TableDto updatedTable = tableService.updateReservationTime(id, tableReserveDto);
            return ResponseEntity.ok(Map.of("updatedTable", updatedTable));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/reserve")
    public ResponseEntity<Map<String, Object>> cancelReservation(@PathVariable long id) {
        try {
            TableDto table = tableService.cancelReservation(id);
            return ResponseEntity.ok(Map.of("canceledReservation", table));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> getAvailableTables() {
        List<TableDto> availableTables = tableService.getAvailableTables();
        return ResponseEntity.ok(Map.of("availableTables", availableTables));
    }
}