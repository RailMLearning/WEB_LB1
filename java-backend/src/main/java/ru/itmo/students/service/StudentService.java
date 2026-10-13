package ru.itmo.students.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.transaction.Transactional;
import java.util.List;
import ru.itmo.students.api.ApiException;
import ru.itmo.students.dto.*;
import ru.itmo.students.model.Student;
import ru.itmo.students.repository.StudentRepository;
import ru.itmo.students.validation.InputValidator;

@ApplicationScoped
@Transactional
public class StudentService {
    @Inject StudentRepository repository;
    @Inject InputValidator validator;

    public record Page(List<StudentDto> students, long total) { }

    public Page list(StudentQuery query) {
        return new Page(repository.list(query).stream().map(StudentDto::from).toList(), repository.count(query));
    }

    public StudentDto get(String isu) {
        return StudentDto.from(required(isu));
    }

    public StudentDto create(JsonObject data) {
        StudentDto dto = validator.student(data, null, false);
        if (repository.find(dto.isu) != null) throw new ApiException(409, "isu", "Студент с таким ИСУ уже существует.");
        Student entity = new Student();
        dto.apply(entity);
        repository.save(entity);
        return StudentDto.from(entity);
    }

    public StudentDto update(String isu, JsonObject data, boolean partial) {
        Student entity = required(isu);
        StudentDto dto = validator.student(data, partial ? StudentDto.from(entity) : null, partial);
        Student duplicate = repository.find(dto.isu);
        if (duplicate != null && !duplicate.id.equals(entity.id)) throw new ApiException(409, "isu", "Студент с таким ИСУ уже существует.");
        dto.apply(entity);
        repository.flush();
        return StudentDto.from(entity);
    }

    public void delete(String isu) {
        repository.delete(required(isu));
    }

    private Student required(String isu) {
        Student student = repository.find(isu);
        if (student == null) throw new ApiException(404, null, "Студент не найден.");
        return student;
    }
}
