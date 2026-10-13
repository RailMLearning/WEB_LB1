package ru.itmo.students.service;

import io.jsonwebtoken.Claims;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import ru.itmo.students.api.ApiException;
import ru.itmo.students.config.AppConfig;
import ru.itmo.students.dto.*;
import ru.itmo.students.model.*;
import ru.itmo.students.repository.*;
import ru.itmo.students.security.*;
import ru.itmo.students.validation.InputValidator;

@ApplicationScoped
@Transactional
public class AuthService {
    @Inject UserRepository users;
    @Inject RefreshRepository sessions;
    @Inject InputValidator validator;
    @Inject Passwords passwords;
    @Inject JwtService jwt;
    @Inject AppConfig config;

    public UserDto register(JsonObject data) {
        validator.known(data.keySet(), Set.of("username", "email", "password"));
        UserAccount user = new UserAccount();
        user.username = validator.username(validator.string(data.get("username"), "username"));
        user.email = validator.email(validator.string(data.get("email"), "email"));
        String password = validator.password(validator.string(data.get("password"), "password"));
        if (users.byUsername(user.username) != null) throw new ApiException(409, "username", "Логин уже занят.");
        if (users.emailExists(user.email)) throw new ApiException(409, "email", "Почта уже используется.");
        user.passwordHash = passwords.hash(password);
        user.role = UserAccount.Role.USER;
        users.save(user);
        return UserDto.from(user);
    }

    public AuthTokens login(JsonObject data) {
        validator.known(data.keySet(), Set.of("username", "password"));
        String username = validator.username(validator.string(data.get("username"), "username"));
        String password = validator.password(validator.string(data.get("password"), "password"));
        UserAccount user = users.byUsername(username);
        if (user == null || !passwords.verify(password, user.getPasswordHash())) throw new ApiException(401, null, "Неверный логин или пароль.");
        sessions.removeExpired();
        return tokens(user);
    }

    public AuthTokens refresh(JsonObject data) {
        String token = refreshValue(data);
        Claims claims = jwt.verify(token, "refresh");
        RefreshSession session = sessions.lock(claims.getId());
        if (session == null || !session.tokenHash.equals(jwt.digest(token)) || !session.expiresAt.isAfter(Instant.now()) || !session.user.getId().toString().equals(claims.getSubject())) throw new ApiException(401, null, "Refresh-токен уже использован или отозван.");
        UserAccount user = session.user;
        sessions.delete(session);
        return tokens(user);
    }

    public void logout(JsonObject data) {
        String token = refreshValue(data);
        Claims claims = jwt.verify(token, "refresh");
        RefreshSession session = sessions.lock(claims.getId());
        if (session != null && session.tokenHash.equals(jwt.digest(token))) sessions.delete(session);
    }

    public UserAccount accessUser(String token) {
        Claims claims = jwt.verify(token, "access");
        UserAccount user = users.find(Long.parseLong(claims.getSubject()));
        if (user == null) throw new ApiException(401, null, "Пользователь не найден.");
        return user;
    }

    public void bootstrap() {
        String name = validator.username(config.adminUsername());
        UserAccount existing = users.byUsername(name);
        if (existing != null) {
            if (existing.getRole() != UserAccount.Role.ADMIN) throw new IllegalStateException("ADMIN_USERNAME уже занят обычным пользователем.");
            return;
        }
        UserAccount admin = new UserAccount();
        admin.username = name;
        admin.email = validator.email(config.adminEmail());
        admin.passwordHash = passwords.hash(validator.password(config.adminPassword()));
        admin.role = UserAccount.Role.ADMIN;
        users.save(admin);
    }

    private String refreshValue(JsonObject data) {
        validator.known(data.keySet(), Set.of("refreshToken"));
        return validator.string(data.get("refreshToken"), "refreshToken");
    }

    private AuthTokens tokens(UserAccount user) {
        Instant now = Instant.now();
        String id = UUID.randomUUID().toString();
        String refresh = jwt.create(user, "refresh", id, now, config.refreshSeconds());
        RefreshSession session = new RefreshSession();
        session.id = id;
        session.user = user;
        session.tokenHash = jwt.digest(refresh);
        session.expiresAt = now.plusSeconds(config.refreshSeconds());
        sessions.save(session);
        return new AuthTokens(jwt.create(user, "access", UUID.randomUUID().toString(), now, config.accessSeconds()), refresh, "Bearer", config.accessSeconds(), UserDto.from(user));
    }
}
