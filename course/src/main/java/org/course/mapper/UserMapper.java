package org.course.mapper;

import org.course.entity.User;
import org.course.dto.UserDto;
import org.course.dto.UserCreateDTO;
import org.mapstruct.*;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    User toEntity(UserDto userDto);

    UserDto toDto(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "email", source = "email")
    @Mapping(target = "id", ignore = true)
    User partialUpdate(UserDto userDto, @MappingTarget User user);

    User toEntity(UserCreateDTO userCreateDTO);
}
