package org.course.dto;

import java.io.Serializable;

/**
 * DTO для {@link org.course.entity.User}
 */
public record UserDto(long id, String name, String email, String role) implements Serializable {

    public UserDto(long id, String name) {
        this(id, name, null, null);
    }
}
