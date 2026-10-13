package ru.itmo.students;

import jakarta.json.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ru.itmo.students.api.ApiException;
import ru.itmo.students.config.AppConfig;
import ru.itmo.students.dto.StudentDto;
import ru.itmo.students.model.UserAccount;
import ru.itmo.students.security.JwtService;
import ru.itmo.students.security.Passwords;
import ru.itmo.students.validation.InputValidator;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;

public class ValidationTest {
    private final InputValidator validator = new InputValidator();
    private final JsonObject student = validator.json("{\"isu\":\"001234\",\"fio\":\"  Анна-Мария  \",\"grid\":\"M3301\",\"dnum\":\"08\",\"rnum\":42,\"expdate\":\"2026-10-12\",\"foreigner\":\"false\"}");

    @Test
    void normalizesWithoutLosingIdOrFalse() {
        StudentDto dto = validator.student(student, null, false);
        assertEquals("001234", dto.isu);
        assertEquals("Анна-Мария", dto.fio);
        assertEquals(8L, dto.dnum);
        assertFalse(dto.foreigner);
        assertEquals("", dto.notes);
    }

    @Test
    void rejectsBadFieldTypesAndValues() {
        for (JsonObject change : new JsonObject[] {
            validator.json("{\"fio\":\"Иван2\"}"), validator.json("{\"isu\":123456}"), validator.json("{\"dnum\":true}"),
            validator.json("{\"rnum\":1.5}"), validator.json("{\"expdate\":\"2026-02-30\"}"), validator.json("{\"grid\":\"m3301\"}"),
            validator.json("{\"foreigner\":null}"), validator.json("{\"rnum\":9007199254740992}")
        }) {
            JsonObjectBuilder value = Json.createObjectBuilder(student);
            change.forEach(value::add);
            assertEquals(422, assertThrows(ApiException.class, () -> validator.student(value.build(), null, false)).status);
        }
    }

    @Test
    void patchKeepsOmittedFieldsAndRejectsExplicitNull() {
        StudentDto dto = validator.student(student, null, false);
        validator.student(validator.json("{\"notes\":\"\",\"foreigner\":false}"), dto, true);
        assertEquals("001234", dto.isu);
        assertFalse(dto.foreigner);
        assertThrows(ApiException.class, () -> validator.student(validator.json("{\"fio\":null}"), dto, true));
        assertThrows(ApiException.class, () -> validator.student(validator.json("{}"), null, false));
    }

    @Test
    void handlesInvalidBodiesAndUnknownFields() {
        for (String body : new String[] {"{", "[]", "null", "42", "\"text\""}) assertEquals(400, assertThrows(ApiException.class, () -> validator.json(body)).status);
        assertThrows(ApiException.class, () -> validator.student(validator.json("{\"role\":\"ADMIN\"}"), null, true));
    }

    @Test
    void validatesFiltersAndPagination() {
        var query = validator.query(validator.json("{\"group\":\"M3301\",\"dormitory\":\"8\",\"foreigner\":false,\"page\":\"0\",\"size\":1,\"sort\":\"fio\",\"order\":\"desc\"}"));
        assertEquals(8L, query.filters().get("dnum"));
        assertEquals(false, query.filters().get("foreigner"));
        assertTrue(query.descending());
        for (String body : new String[] {"{\"page\":-1}", "{\"size\":0}", "{\"size\":101}", "{\"sort\":\"passwordHash\"}", "{\"group\":\"M3301\",\"grid\":\"M3301\"}"}) assertThrows(ApiException.class, () -> validator.query(validator.json(body)));
    }

    @Test
    void passwordsAreSaltedAndUnicodeLengthIsChecked() {
        Passwords passwords = new Passwords();
        String first = passwords.hash("TestPassword1!");
        String second = passwords.hash("TestPassword1!");
        assertNotEquals(first, second);
        assertTrue(passwords.verify("TestPassword1!", first));
        assertFalse(passwords.verify("wrong", first));
        assertThrows(ApiException.class, () -> validator.password("я".repeat(37)));
    }

    @Test
    void jwtRequiresSignatureExpiryIssuerAndCorrectPurpose() {
        AppConfig config = new AppConfig(Map.of("JWT_SECRET", "x".repeat(48)));
        JwtService jwt = new JwtService(config);
        UserAccount user = new UserAccount();
        user.id = 1L;
        user.role = UserAccount.Role.USER;
        String token = jwt.create(user, "access", "test", Instant.now(), 60);
        assertEquals("1", jwt.verify(token, "access").getSubject());
        assertThrows(ApiException.class, () -> jwt.verify(token, "refresh"));
        assertThrows(ApiException.class, () -> jwt.verify(token.substring(0, token.lastIndexOf('.') + 1) + "invalid", "access"));
        String expired = jwt.create(user, "access", "old", Instant.now().minusSeconds(120), 1);
        assertThrows(ApiException.class, () -> jwt.verify(expired, "access"));
        JwtService other = new JwtService(new AppConfig(Map.of("JWT_SECRET", "y".repeat(48))));
        assertThrows(ApiException.class, () -> other.verify(token, "access"));
        assertEquals(64, jwt.digest(token).length());
    }
}
