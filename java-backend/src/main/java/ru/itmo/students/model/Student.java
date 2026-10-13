package ru.itmo.students.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "students")
public class Student {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Version
    public long version;
    @Column(nullable = false, unique = true, length = 7)
    public String isu;
    @Column(nullable = false, length = 150)
    public String fio;
    @Column(nullable = false, length = 6)
    public String grid;
    @Column(nullable = false)
    public Long dnum;
    @Column(nullable = false)
    public Long rnum;
    @Column(nullable = false)
    public LocalDate expdate;
    @Column(nullable = false)
    public boolean foreigner;
    @Column(nullable = false, length = 500)
    public String notes;
}
