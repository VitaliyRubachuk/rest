package org.course.mapper;

import org.course.dto.TableCreateDto;
import org.course.dto.TableDto;
import org.course.entity.Tables;
import org.course.entity.User;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TableMapper {

    Tables toEntity(TableCreateDto tableCreateDto);

    @Mapping(target = "reservedByUserId", source = "reservedByUser.id")
    @Mapping(target = "isReserved", source = "reserved")
    @Mapping(target = "reservedAt", source = "reservedAt")
    @Mapping(target = "reservedUntil", source = "reservedUntil")
    TableDto toDto(Tables table);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    Tables partialUpdate(TableDto tableDto, @MappingTarget Tables table);
}