package ru.itmo.students.dto;

import java.time.LocalDate;
import ru.itmo.students.model.Student;

public class StudentDto {
    public String isu;
    public String fio;
    public String grid;
    public Long dnum;
    public Long rnum;
    public String expdate;
    public Boolean foreigner;
    public String notes;

    public static StudentDto from(Student entity) {
        StudentDto dto = new StudentDto();
        dto.isu = entity.isu;
        dto.fio = entity.fio;
        dto.grid = entity.grid;
        dto.dnum = entity.dnum;
        dto.rnum = entity.rnum;
        dto.expdate = entity.expdate.toString();
        dto.foreigner = entity.foreigner;
        dto.notes = entity.notes;
        return dto;
    }

    public void apply(Student entity) {
        entity.isu = isu;
        entity.fio = fio;
        entity.grid = grid;
        entity.dnum = dnum;
        entity.rnum = rnum;
        entity.expdate = LocalDate.parse(expdate);
        entity.foreigner = foreigner;
        entity.notes = notes;
    }
}
