package ru.itmo.students.api;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
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

    @POST @Path("/register") @Consumes(MediaType.APPLICATION_JSON)
    public Response register(String body) {
        return Response.status(201).entity(service.register(validator.json(body))).build();
    }

    @POST @Path("/login") @Consumes(MediaType.APPLICATION_JSON)
    public AuthTokens login(String body) {
        return service.login(validator.json(body));
    }

    @POST @Path("/refresh") @Consumes(MediaType.APPLICATION_JSON)
    public AuthTokens refresh(String body) {
        return service.refresh(validator.json(body));
    }

    @POST @Path("/logout") @Consumes(MediaType.APPLICATION_JSON)
    public Response logout(String body) {
        service.logout(validator.json(body));
        return Response.noContent().build();
    }

    @GET @Path("/me") @RolesAllowed({"ADMIN", "USER"})
    public UserDto me(@Context SecurityContext security) {
        return UserDto.from(service.accessUser(currentToken.getHeaderString("Authorization").substring(7)));
    }

    @Context private HttpHeaders currentToken;
}
