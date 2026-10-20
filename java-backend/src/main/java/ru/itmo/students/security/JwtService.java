package ru.itmo.students.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import javax.crypto.SecretKey;
import ru.itmo.students.api.ApiException;
import ru.itmo.students.config.AppConfig;
import ru.itmo.students.model.UserAccount;

@ApplicationScoped
public class JwtService {
    private final AppConfig config;

    @Inject
    public JwtService(AppConfig config) {
        this.config = config;
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(config.jwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String create(UserAccount user, String type, String id, Instant now, int seconds) {
        return Jwts.builder()
                .issuer(config.issuer())
                .subject(user.getId().toString())
                .id(id)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(seconds)))
                .claim("type", type)
                .claim("role", user.getRole().name())
                .signWith(key(), Jwts.SIG.HS256)
                .compact();
    }

    public Claims verify(String token, String type) {
        try {
            Jws<Claims> signed =
                    Jwts.parser()
                            .verifyWith(key())
                            .requireIssuer(config.issuer())
                            .require("type", type)
                            .build()
                            .parseSignedClaims(token);
            Claims claims = signed.getPayload();
            if (!"HS256".equals(signed.getHeader().getAlgorithm())
                    || claims.getExpiration() == null
                    || claims.getIssuedAt() == null
                    || claims.getId() == null
                    || Long.parseLong(claims.getSubject()) < 1)
                throw new IllegalArgumentException();
            return claims;
        } catch (JwtException | IllegalArgumentException error) {
            throw new ApiException(401, null, "Токен недействителен или истёк.");
        }
    }

    public String digest(String token) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }
}
