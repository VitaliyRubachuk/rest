package org.course.mapper;

import org.course.dto.OrderCreateDTO;
import org.course.dto.OrderDto;
import org.course.entity.Dishes;
import org.course.entity.Order;
import org.mapstruct.*;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = MappingConstants.ComponentModel.SPRING)
@Component
public interface OrderMapper {

    @Mapping(target = "fullPrice", source = "fullprice")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "dishIds", source = "dishes", qualifiedByName = "mapDishesToDishIds")
    @Mapping(target = "userId", expression = "java(order.getUser() != null ? order.getUser().getId().longValue() : 0L)")
    @Mapping(target = "orderDate", source = "orderDate")
    @Mapping(target = "updatedAt", source = "updatedAt")
    @Mapping(target = "isDelivery", source = "isDelivery")
    @Mapping(target = "tableNumber", source = "tableNumber")
    @Mapping(target = "city", source = "city")
    @Mapping(target = "street", source = "street")
    @Mapping(target = "houseNumber", source = "houseNumber")
    @Mapping(target = "apartmentNumber", source = "apartmentNumber")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    OrderDto toDto(Order order);

    @Mapping(target = "fullprice", source = "fullPrice")
    @Mapping(target = "dishes", ignore = true)
    @Mapping(target = "user", ignore = true)
    Order toEntity(OrderDto orderDto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "fullprice", source = "fullPrice")
    @Mapping(target = "dishes", ignore = true)
    @Mapping(target = "user", ignore = true)
    Order partialUpdate(OrderDto orderDto, @MappingTarget Order order);

    @Mapping(target = "fullprice", ignore = true)
    @Mapping(target = "dishes", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "viewedByUser", ignore = true)
    @Mapping(target = "orderDate", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    Order toEntity(OrderCreateDTO orderCreateDTO);

    @Named("mapDishesToDishIds")
    static List<Long> mapDishesToDishIds(List<Dishes> dishes) {
        return dishes == null ? List.of() : dishes.stream().map(Dishes::getId).collect(Collectors.toList());
    }

    // Конвертація списку у рядок
    default String mapDishIdsListToString(List<Long> dishIds) {
        if (dishIds == null || dishIds.isEmpty()) {
            return "";
        }
        return dishIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    // Конвертація рядка у список
    default List<Long> mapDishIdsStringToList(String dishIdsString) {
        if (dishIdsString == null || dishIdsString.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(dishIdsString.split(","))
                .map(Long::valueOf)
                .collect(Collectors.toList());
    }
}