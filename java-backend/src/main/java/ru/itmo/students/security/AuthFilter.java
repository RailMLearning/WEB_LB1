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
import ru.itmo.students.dto.UserDto;
import ru.itmo.students.service.AuthService;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {
    @Context ResourceInfo resource;
    private final AuthService auth;

    @Inject
    public ContainerRequestFilter(AuthService auth){
        this.auth = auth;
    }
    
    @Override
    public void filter(ContainerRequestContext request) {
        RolesAllowed roles = null;
        if (resource != null && resource.getResourceMethod() != null)
            roles = resource.getResourceMethod().getAnnotation(RolesAllowed.class);
        if (roles == null && resource != null && resource.getResourceClass() != null)
            roles = resource.getResourceClass().getAnnotation(RolesAllowed.class);
        if (roles == null) return;
        String authorization = request.getHeaderString("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer "))
            throw new ApiException(401, null, "Требуется авторизация.");
        UserDto user = auth.accessUser(authorization.substring(7));
        if (!Arrays.asList(roles.value()).contains(user.role()))
            throw new ApiException(403, null, "Недостаточно прав.");
        boolean secure = request.getSecurityContext().isSecure();
        request.setSecurityContext(
                new SecurityContext() {
                    public Principal getUserPrincipal() {
                        return () -> user.id().toString();
                    }

                    public boolean isUserInRole(String role) {
                        return user.role().equals(role);
                    }

                    public boolean isSecure() {
                        return secure;
                    }

                    public String getAuthenticationScheme() {
                        return "Bearer";
                    }
                });
        request.setProperty("user", user);
    }
}
