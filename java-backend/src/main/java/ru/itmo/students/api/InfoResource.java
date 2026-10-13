package ru.itmo.students.api;

import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Path("/")
@RequestScoped
public class InfoResource {
    @GET @Path("/health") @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GET @Path("/openapi.json") @Produces(MediaType.APPLICATION_JSON)
    public String openapi() throws IOException {
        try (var input = getClass().getResourceAsStream("/openapi.json")) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
