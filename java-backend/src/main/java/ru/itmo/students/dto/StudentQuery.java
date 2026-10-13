package ru.itmo.students.dto;

import java.util.Map;

public record StudentQuery(Map<String, Object> filters, String search, String sort, boolean descending, int page, int size) {
}
