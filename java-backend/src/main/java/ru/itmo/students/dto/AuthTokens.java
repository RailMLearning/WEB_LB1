package ru.itmo.students.dto;

public record AuthTokens(
        String accessToken, String refreshToken, String tokenType, int expiresIn, UserDto user) {}
