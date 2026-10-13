package ru.itmo.students.dto;

import ru.itmo.students.model.UserAccount;

public record UserDto(Long id, String username, String email, String role) {
    public static UserDto from(UserAccount user) {
        return new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }
}
