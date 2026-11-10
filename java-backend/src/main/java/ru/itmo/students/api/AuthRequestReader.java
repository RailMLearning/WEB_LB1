package ru.itmo.students.api;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.ext.MessageBodyReader;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;
import java.io.InputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import ru.itmo.students.dto.LoginRequest;
import ru.itmo.students.dto.RefreshRequest;
import ru.itmo.students.dto.RegisterRequest;
import ru.itmo.students.validation.InputValidator;

@Provider
@Consumes(MediaType.APPLICATION_JSON)
@Priority(Priorities.ENTITY_CODER - 100)
public class AuthRequestReader implements MessageBodyReader<Object> {
    @Inject
    private InputValidator validator;

    @Override
    public boolean isReadable(
            Class<?> type, Type genericType, Annotation[] annotations, MediaType mediaType) {
        return type == RegisterRequest.class
                || type == LoginRequest.class
                || type == RefreshRequest.class;
    }

    @Override
    public Object readFrom(
            Class<Object> type,
            Type genericType,
            Annotation[] annotations,
            MediaType mediaType,
            MultivaluedMap<String, String> headers,
            InputStream input) throws IOException {
        try {
            byte[] bytes = input.readNBytes(16385);
            if (bytes.length > 16384) {
                throw new ApiException(400, null, "Тело запроса слишком большое.");
            }
            String body = new String(bytes, StandardCharsets.UTF_8);
            if (type.equals(RegisterRequest.class)) return validator.registerRequest(body);
            if (type.equals(LoginRequest.class)) return validator.loginRequest(body);
            return validator.refreshRequest(body);
        } catch (ApiException error) {
            throw new WebApplicationException(new ErrorMapper().toResponse(error));
        }
    }
}
