package ru.itmo.students.dto;

import ru.itmo.students.model.UserAccount;

public record UserDto(Long id, String username, String email, String role) {
    public UserDto(Long id, String username, String email, UserAccount.Role role) {
        this(id, username, email, role.name());
    }

    public static UserDto from(UserAccount user) {
        return new UserDto(
                user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }
}
