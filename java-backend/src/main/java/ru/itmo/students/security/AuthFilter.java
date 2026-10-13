package ru.itmo.students.security;

import jakarta.annotation.Priority;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.core.*;
import jakarta.ws.rs.ext.Provider;
import java.security.Principal;
import java.util.Arrays;
import ru.itmo.students.api.ApiException;
import ru.itmo.students.model.UserAccount;
import ru.itmo.students.service.AuthService;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {
    @Context ResourceInfo resource;
    @Inject AuthService auth;

    @Override
    public void filter(ContainerRequestContext request) {
        RolesAllowed roles = resource.getResourceMethod().getAnnotation(RolesAllowed.class);
        if (roles == null) roles = resource.getResourceClass().getAnnotation(RolesAllowed.class);
        if (roles == null) return;
        String authorization = request.getHeaderString("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) throw new ApiException(401, null, "Требуется авторизация.");
        UserAccount user = auth.accessUser(authorization.substring(7));
        if (!Arrays.asList(roles.value()).contains(user.getRole().name())) throw new ApiException(403, null, "Недостаточно прав.");
        boolean secure = request.getSecurityContext().isSecure();
        request.setSecurityContext(new SecurityContext() {
            public Principal getUserPrincipal() { return () -> user.getId().toString(); }
            public boolean isUserInRole(String role) { return user.getRole().name().equals(role); }
            public boolean isSecure() { return secure; }
            public String getAuthenticationScheme() { return "Bearer"; }
        });
        request.setProperty("user", user);
    }
}
