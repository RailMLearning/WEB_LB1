package ru.itmo.students.config;

import jakarta.enterprise.context.ApplicationScoped;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@ApplicationScoped
public class AppConfig {
    private final String jwtSecret;
    private final String issuer;
    private final int accessSeconds;
    private final int refreshSeconds;
    private final String adminUsername;
    private final String adminEmail;
    private final String adminPassword;

    public AppConfig() {
        this(System.getenv());
    }

    public AppConfig(Map<String, String> values) {
        jwtSecret = values.getOrDefault("JWT_SECRET", "");
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) throw new IllegalStateException("JWT_SECRET должен содержать минимум 32 байта.");
        issuer = values.getOrDefault("JWT_ISSUER", "students-lab");
        accessSeconds = positive(values, "ACCESS_TOKEN_SECONDS", 900);
        refreshSeconds = positive(values, "REFRESH_TOKEN_SECONDS", 604800);
        adminUsername = values.getOrDefault("ADMIN_USERNAME", "admin");
        adminEmail = values.getOrDefault("ADMIN_EMAIL", "admin@students.local");
        adminPassword = values.getOrDefault("ADMIN_PASSWORD", "");
    }


    public String jwtSecret() { return jwtSecret; }
    public String issuer() { return issuer; }
    public int accessSeconds() { return accessSeconds; }
    public int refreshSeconds() { return refreshSeconds; }
    public String adminUsername() { return adminUsername; }
    public String adminEmail() { return adminEmail; }
    public String adminPassword() { return adminPassword; }

    private int positive(Map<String, String> values, String name, int fallback) {
        int value = Integer.parseInt(values.getOrDefault(name, String.valueOf(fallback)));
        if (value < 1) throw new IllegalStateException(name + " должен быть положительным.");
        return value;
    }
}
