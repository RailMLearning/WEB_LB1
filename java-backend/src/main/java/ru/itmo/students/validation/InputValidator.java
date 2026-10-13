package ru.itmo.students.validation;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.json.*;
import java.io.StringReader;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import ru.itmo.students.api.ApiException;
import ru.itmo.students.dto.StudentDto;
import ru.itmo.students.dto.StudentQuery;

@ApplicationScoped
public class InputValidator {
    public static final Set<String> FIELDS = Set.of("isu", "fio", "grid", "dnum", "rnum", "expdate", "foreigner", "notes");

    public JsonObject json(String body) {
        if (body == null || body.length() > 16384) throw new ApiException(400, null, "Тело запроса отсутствует или слишком большое.");
        try (JsonReader reader = Json.createReader(new StringReader(body))) {
            JsonValue value = reader.readValue();
            if (!(value instanceof JsonObject object)) throw new ApiException(400, null, "Тело запроса должно быть JSON-объектом.");
            return object;
        } catch (JsonException error) {
            throw new ApiException(400, null, "Некорректный JSON.");
        }
    }

    public StudentDto student(JsonObject data, StudentDto current, boolean partial) {
        known(data.keySet(), FIELDS);
        StudentDto dto = current == null ? new StudentDto() : current;
        for (String field : FIELDS) {
            if (!data.containsKey(field)) {
                if (partial) continue;
                if (field.equals("notes")) { dto.notes = ""; continue; }
                fail(field, "Поле обязательно.");
            }
            Object value = studentValue(field, data.get(field));
            switch (field) {
                case "isu" -> dto.isu = (String) value;
                case "fio" -> dto.fio = (String) value;
                case "grid" -> dto.grid = (String) value;
                case "dnum" -> dto.dnum = (Long) value;
                case "rnum" -> dto.rnum = (Long) value;
                case "expdate" -> dto.expdate = (String) value;
                case "foreigner" -> dto.foreigner = (Boolean) value;
                case "notes" -> dto.notes = (String) value;
            }
        }
        return dto;
    }

    public Object studentValue(String field, JsonValue value) {
        if (field.equals("dnum") || field.equals("rnum")) {
            String raw = value instanceof JsonString s ? s.getString().strip() : value instanceof JsonNumber n && n.isIntegral() ? n.toString() : "";
            if (!raw.matches("[0-9]+")) fail(field, "Номер должен быть положительным целым числом.");
            raw = raw.replaceFirst("^0+(?!$)", "");
            if (raw.length() > 16) fail(field, "Номер слишком большой.");
            BigInteger number = new BigInteger(raw);
            if (number.signum() < 1 || number.compareTo(BigInteger.valueOf(9007199254740991L)) > 0) fail(field, "Номер должен быть положительным безопасным целым числом.");
            return number.longValueExact();
        }
        if (field.equals("foreigner")) {
            if (value == JsonValue.TRUE || value instanceof JsonString s && s.getString().strip().equals("true")) return true;
            if (value == JsonValue.FALSE || value instanceof JsonString s && s.getString().strip().equals("false")) return false;
            fail(field, "Поле должно иметь значение true или false.");
        }
        String text = string(value, field).strip();
        switch (field) {
            case "isu" -> { if (!text.matches("[0-9]{5,7}")) fail(field, "ИСУ ID должен содержать от 5 до 7 цифр."); }
            case "fio" -> {
                text = text.replaceAll("(?U)\\s+", " ");
                if (text.length() > 150 || !text.matches("\\p{L}[\\p{L}\\p{M}'’\\-]*(?: \\p{L}[\\p{L}\\p{M}'’\\-]*)*")) fail(field, "Введите имя буквами, максимум 150 символов. Допустимы дефис и апостроф.");
            }
            case "grid" -> { if (!text.matches("[A-Z][0-9]{4}[a-z]?")) fail(field, "Группа должна иметь формат M3301 или M3301a."); }
            case "expdate" -> {
                try {
                    if (!text.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}") || LocalDate.parse(text).getYear() < 1900) fail(field, "Введите существующую дату от 1900 до 9999 года.");
                } catch (java.time.DateTimeException error) { fail(field, "Введите существующую календарную дату."); }
            }
            case "notes" -> { if (text.length() > 500) fail(field, "Заметки не должны превышать 500 символов."); }
        }
        return text;
    }

    public StudentQuery query(JsonObject input) {
        Set<String> allowed = new HashSet<>(FIELDS);
        allowed.addAll(Set.of("group", "dormitory", "q", "sort", "order", "page", "size"));
        known(input.keySet(), allowed);
        Map<String, Object> filters = new LinkedHashMap<>();
        for (String name : input.keySet()) {
            String field = name.equals("group") ? "grid" : name.equals("dormitory") ? "dnum" : name;
            if (!FIELDS.contains(field)) continue;
            JsonValue value = input.get(name);
            if (value instanceof JsonString s && s.getString().isBlank()) continue;
            if (filters.containsKey(field)) fail(name, "Фильтр указан дважды.");
            filters.put(field, field.equals("fio") || field.equals("notes") ? string(value, name).strip().toLowerCase(Locale.ROOT) : studentValue(field, value));
        }
        String search = input.containsKey("q") ? string(input.get("q"), "q").strip().toLowerCase(Locale.ROOT) : "";
        if (search.length() > 150) fail("q", "Поисковая строка не должна превышать 150 символов.");
        String sort = input.containsKey("sort") ? string(input.get("sort"), "sort") : "isu";
        if (sort.equals("group")) sort = "grid";
        if (sort.equals("dormitory")) sort = "dnum";
        if (!FIELDS.contains(sort)) fail("sort", "Неизвестное поле сортировки.");
        String order = input.containsKey("order") ? string(input.get("order"), "order").toLowerCase(Locale.ROOT) : "asc";
        if (!Set.of("asc", "desc").contains(order)) fail("order", "Порядок должен быть asc или desc.");
        return new StudentQuery(filters, search, sort, order.equals("desc"), integer(input, "page", 0, 0, 1000000), integer(input, "size", 20, 1, 100));
    }

    private int integer(JsonObject data, String field, int fallback, int min, int max) {
        if (!data.containsKey(field)) return fallback;
        JsonValue value = data.get(field);
        String raw = value instanceof JsonString s ? s.getString() : value instanceof JsonNumber n && n.isIntegral() ? n.toString() : "";
        try {
            if (!raw.matches("[0-9]{1,7}")) fail(field, "Введите целое число.");
            int number = Integer.parseInt(raw);
            if (number < min || number > max) fail(field, "Значение должно быть от " + min + " до " + max + ".");
            return number;
        } catch (NumberFormatException error) { throw new ApiException(422, field, "Некорректное число."); }
    }

    public String string(JsonValue value, String field) {
        if (!(value instanceof JsonString)) fail(field, "Поле должно быть строкой.");
        return ((JsonString) value).getString();
    }

    public String username(String value) {
        String name = value.strip().toLowerCase(Locale.ROOT);
        if (!name.matches("[a-z0-9_]{3,40}")) fail("username", "Логин: 3–40 латинских букв, цифр или подчёркиваний.");
        return name;
    }

    public String email(String value) {
        String email = value.strip().toLowerCase(Locale.ROOT);
        if (email.length() > 254 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) fail("email", "Введите корректную электронную почту.");
        return email;
    }

    public String password(String value) {
        if (value.length() < 8 || value.getBytes(StandardCharsets.UTF_8).length > 72) fail("password", "Пароль: минимум 8 символов, максимум 72 байта UTF-8.");
        return value;
    }

    public void known(Set<String> names, Set<String> allowed) {
        for (String name : names) if (!allowed.contains(name)) fail(name, "Неизвестное поле.");
    }

    public void fail(String field, String message) {
        throw new ApiException(422, field, message);
    }
}
