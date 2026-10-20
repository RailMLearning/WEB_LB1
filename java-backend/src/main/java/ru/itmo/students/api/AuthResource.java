package ru.itmo.students.api;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import ru.itmo.students.dto.*;
import ru.itmo.students.service.AuthService;
import ru.itmo.students.validation.InputValidator;

@Path("/auth")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
    @Inject AuthService service;
    @Inject InputValidator validator;

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response register(RegisterRequest request) {
        return Response.status(201)
                .entity(service.register(validator.registerRequest(request)))
                .build();
    }

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    public AuthTokens login(LoginRequest request) {
        return service.login(validator.loginRequest(request));
    }

    @POST
    @Path("/refresh")
    @Consumes(MediaType.APPLICATION_JSON)
    public AuthTokens refresh(RefreshRequest request) {
        return service.refresh(validator.refreshRequest(request));
    }

    @POST
    @Path("/logout")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response logout(RefreshRequest request) {
        service.logout(validator.refreshRequest(request));
        return Response.noContent().build();
    }

    @GET
    @Path("/me")
    @RolesAllowed({"ADMIN", "USER"})
    public UserDto me(@Context ContainerRequestContext request) {
        return (UserDto) request.getProperty("user");
    }
}
