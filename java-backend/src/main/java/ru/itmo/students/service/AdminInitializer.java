package ru.itmo.students.service;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;
import java.util.logging.Logger;

@Singleton
@Startup
public class AdminInitializer {
    private final AuthService auth;

    @Inject 
    public AdminInitializer(AuthService auth){
        this.auth = auth;
    } 

    @PostConstruct
    public void initialize() {
        auth.bootstrap();
        Logger.getLogger(AdminInitializer.class.getName()).info("Приложение студентов готово.");
    }
}
