package ru.itmo.students.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class UserAccount {
    public UserAccount() {}

    public enum Role {
        ADMIN,
        USER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 40)
    public String username;

    @Column(nullable = false, unique = true, length = 254)
    public String email;

    @Column(name = "password_hash", nullable = false, length = 60)
    public String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    public Role role;

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }
}
