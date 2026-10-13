package ru.itmo.students.api;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.json.*;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import ru.itmo.students.dto.*;
import ru.itmo.students.service.StudentService;
import ru.itmo.students.validation.InputValidator;

@Path("/requests")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "USER"})
public class StudentResource {
    @Inject StudentService service;
    @Inject InputValidator validator;

    @GET
    public Response list(@Context UriInfo uri) {
        JsonObjectBuilder data = Json.createObjectBuilder();
        uri.getQueryParameters().forEach((key, values) -> {
            if (values.size() != 1) throw new ApiException(422, key, "Параметр указан дважды.");
            data.add(key, values.get(0));
        });
        return page(validator.query(data.build()));
    }

    @HttpMethod("QUERY")
    @java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
    @java.lang.annotation.Target(java.lang.annotation.ElementType.METHOD)
    public @interface Query { }

    @Query
    @Consumes(MediaType.APPLICATION_JSON)
    public Response query(String body) {
        return page(validator.query(validator.json(body)));
    }

    @GET @Path("/{isu}")
    public StudentDto get(@PathParam("isu") String isu) {
        return service.get(isu);
    }

    @POST @RolesAllowed("ADMIN") @Consumes(MediaType.APPLICATION_JSON)
    public Response create(String body, @Context UriInfo uri) {
        StudentDto student = service.create(validator.json(body));
        return Response.created(uri.getAbsolutePathBuilder().path(student.isu).build()).entity(student).build();
    }

    @PUT @Path("/{isu}") @RolesAllowed("ADMIN") @Consumes(MediaType.APPLICATION_JSON)
    public StudentDto replace(@PathParam("isu") String isu, String body) {
        return service.update(isu, validator.json(body), false);
    }

    @PATCH @Path("/{isu}") @RolesAllowed("ADMIN") @Consumes(MediaType.APPLICATION_JSON)
    public StudentDto patch(@PathParam("isu") String isu, String body) {
        return service.update(isu, validator.json(body), true);
    }

    @DELETE @Path("/{isu}") @RolesAllowed("ADMIN")
    public Response delete(@PathParam("isu") String isu) {
        service.delete(isu);
        return Response.noContent().build();
    }

    private Response page(StudentQuery query) {
        StudentService.Page result = service.list(query);
        return Response.ok(result.students()).header("X-Total-Count", result.total()).header("X-Page", query.page()).header("X-Page-Size", query.size()).build();
    }
}
