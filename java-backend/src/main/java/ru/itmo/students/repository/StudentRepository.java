package ru.itmo.students.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.util.*;
import ru.itmo.students.dto.StudentQuery;
import ru.itmo.students.model.Student;

@ApplicationScoped
public class StudentRepository {
    @PersistenceContext(unitName = "students")
    private EntityManager em;

    public Student find(String isu) {
        return em.createQuery("select s from Student s where s.isu = :isu", Student.class).setParameter("isu", isu).getResultStream().findFirst().orElse(null);
    }

    public void save(Student student) {
        em.persist(student);
        em.flush();
    }

    public void flush() {
        em.flush();
    }

    public void delete(Student student) {
        em.remove(student);
        em.flush();
    }

    public List<Student> list(StudentQuery input) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Student> query = cb.createQuery(Student.class);
        Root<Student> root = query.from(Student.class);
        query.select(root).where(predicates(cb, root, input));
        query.orderBy(input.descending() ? cb.desc(root.get(input.sort())) : cb.asc(root.get(input.sort())), cb.asc(root.get("id")));
        return em.createQuery(query).setFirstResult(input.page() * input.size()).setMaxResults(input.size()).getResultList();
    }

    public long count(StudentQuery input) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Student> root = query.from(Student.class);
        query.select(cb.count(root)).where(predicates(cb, root, input));
        return em.createQuery(query).getSingleResult();
    }

    private Predicate[] predicates(CriteriaBuilder cb, Root<Student> root, StudentQuery input) {
        List<Predicate> values = new ArrayList<>();
        input.filters().forEach((field, value) -> {
            if (field.equals("fio") || field.equals("notes")) values.add(cb.like(cb.lower(root.get(field)), like(value.toString()), '\\'));
            else values.add(cb.equal(root.get(field), field.equals("expdate") ? LocalDate.parse(value.toString()) : value));
        });
        if (!input.search().isEmpty()) {
            values.add(cb.or(cb.like(cb.lower(root.get("fio")), like(input.search()), '\\'), cb.like(cb.lower(root.get("grid")), like(input.search()), '\\'), cb.like(root.get("isu"), like(input.search()), '\\'), cb.like(cb.lower(root.get("notes")), like(input.search()), '\\')));
        }
        return values.toArray(Predicate[]::new);
    }

    private String like(String value) {
        return "%" + value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
