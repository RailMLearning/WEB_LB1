package ru.itmo.students.api;

import java.util.List;
import ru.itmo.students.dto.FieldError;

public class ApiException extends RuntimeException {
    public final int status;
    public final List<FieldError> detail;

    public ApiException(int status, String field, String message) {
        super(message);
        this.status = status;
        this.detail = List.of(new FieldError(field, message));
    }
}
