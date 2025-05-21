package org.course.controller;

import jakarta.validation.Valid;
import org.course.dto.OrderCreateDTO;
import org.course.dto.OrderDto;
import org.course.entity.OrderStatus;
import org.course.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        List<OrderDto> orders = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(Map.of("orders", orders));
    }

    @PutMapping("/{orderId}/viewed")
    public ResponseEntity<Map<String, Object>> markOrderAsViewed(@PathVariable long orderId) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        try {
            orderService.markOrderAsViewedByUser(orderId, email);
            return ResponseEntity.ok(Map.of("message", "Замовлення позначено як переглянуте."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Замовлення не знайдено."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        List<OrderDto> orders = orderService.getActiveOrdersForDisplay(email, page, size);
        return ResponseEntity.ok(Map.of("orders", orders));
    }

    @GetMapping("/my/archive")
    public ResponseEntity<Map<String, Object>> getMyArchiveOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        List<OrderDto> orders = orderService.getArchivedOrdersForDisplay(email, page, size);
        return ResponseEntity.ok(Map.of("orders", orders));
    }

    @GetMapping("/{size}/page/{page}")
    public ResponseEntity<Map<String, Object>> getAllOrdersWithPath(
            @PathVariable int size,
            @PathVariable int page,
            @RequestParam(required = false) OrderStatus status) {
        List<OrderDto> orders = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(Map.of("orders", orders));
    }

    @GetMapping("/my/{size}/page/{page}")
    public ResponseEntity<Map<String, Object>> getMyOrdersWithPath(
            @PathVariable int size,
            @PathVariable int page) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        List<OrderDto> orders = orderService.getOrdersByUserEmail(email, page, size);
        return ResponseEntity.ok(Map.of("orders", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable long id) {
        Optional<OrderDto> order = orderService.getOrderById(id);
        return order.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(
            @Valid @RequestBody OrderCreateDTO orderCreateDTO,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        OrderDto createdOrder = orderService.createOrder(orderCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("order", createdOrder));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateOrder(
            @PathVariable long id,
            @Valid @RequestBody OrderCreateDTO orderCreateDTO,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        OrderDto updatedOrder = orderService.updateOrder(id, orderCreateDTO);
        return ResponseEntity.ok(Map.of("order", updatedOrder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteOrder(@PathVariable long id) {
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.ok(Map.of("message", "Замовлення успішно видалено."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Замовлення не знайдено."));
        }
    }

    @PutMapping("/my/{id}")
    public ResponseEntity<Map<String, Object>> updateMyOrder(
            @PathVariable long id,
            @Valid @RequestBody OrderCreateDTO orderCreateDTO,
            BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            List<String> errorMessages = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("errors", errorMessages));
        }
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = userDetails.getUsername();
        try {
            OrderDto updatedOrder = orderService.updateUserOrder(id, orderCreateDTO, email);
            return ResponseEntity.ok(Map.of("order", updatedOrder));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Доступ заборонено."));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable long id,
            @RequestBody Map<String, String> request) {
        String statusString = request.get("status");
        try {
            OrderStatus status = OrderStatus.valueOf(statusString.toUpperCase());
            OrderDto updatedOrder = orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(Map.of("order", updatedOrder));
        } catch (IllegalArgumentException e) {
            String errorMessage = String.format("Статус '%s' є некоректним. Доступні значення: %s.",
                    statusString,
                    Arrays.stream(OrderStatus.values())
                            .map(Enum::name)
                            .collect(Collectors.joining(", ")));
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Виникла внутрішня помилка сервера."));
        }
    }
}