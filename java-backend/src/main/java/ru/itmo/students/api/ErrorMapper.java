package ru.itmo.students.api;

import jakarta.persistence.OptimisticLockException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import ru.itmo.students.dto.FieldError;

@Provider
public class ErrorMapper implements ExceptionMapper<Throwable> {
    private static final Logger LOG = Logger.getLogger(ErrorMapper.class.getName());

    @Override
    public Response toResponse(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof ApiException api) return response(api.status, api.detail);
            if (cause instanceof OptimisticLockException)
                return response(409, "Запись уже изменена другим запросом.");
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState()))
                return response(409, "Запись с таким уникальным значением уже существует.");
        }
        if (error instanceof WebApplicationException web) {
            int status = web.getResponse().getStatus();
            String message =
                    switch (status) {
                        case 400 -> "Некорректный запрос.";
                        case 401 -> "Требуется авторизация.";
                        case 403 -> "Недостаточно прав.";
                        case 404 -> "Ресурс не найден.";
                        case 405 -> "Метод не поддерживается.";
                        case 415 -> "Требуется Content-Type: application/json.";
                        default -> "Не удалось выполнить запрос.";
                    };
            return response(status, message);
        }
        LOG.log(Level.SEVERE, "Ошибка обработки запроса", error);
        return response(500, "Не удалось выполнить запрос на сервере.");
    }

    private Response response(int status, String message) {
        return response(status, List.of(new FieldError(null, message)));
    }

    private Response response(int status, List<FieldError> detail) {
        Response.ResponseBuilder builder =
                Response.status(status)
                        .type(MediaType.APPLICATION_JSON)
                        .entity(Map.of("detail", detail));
        if (status == 401) builder.header("WWW-Authenticate", "Bearer");
        return builder.build();
    }
}
