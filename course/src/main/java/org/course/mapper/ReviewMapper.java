package org.course.mapper;

import org.course.dto.ReviewCreateDTO;
import org.course.dto.ReviewDto;
import org.course.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.name")
    @Mapping(target = "dishId", source = "dish.id")
    @Mapping(target = "createdAt", expression = "java(review.getCreatedAt())")
    ReviewDto toDto(Review review);

    @Mapping(target = "user.id", source = "userId")
    @Mapping(target = "dish.id", source = "dishId")
    Review toEntity(ReviewCreateDTO reviewCreateDTO);
}