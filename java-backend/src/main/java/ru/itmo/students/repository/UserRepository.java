package ru.itmo.students.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.*;
import jakarta.persistence.criteria.*;
import ru.itmo.students.dto.UserDto;
import ru.itmo.students.model.UserAccount;

@ApplicationScoped
public class UserRepository {
    @PersistenceContext(unitName = "students")
    private EntityManager em;

    public UserDto findDto(long id) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<UserDto> query = cb.createQuery(UserDto.class);
        Root<UserAccount> user = query.from(UserAccount.class);
        query.select(cb.construct(
                UserDto.class,
                user.get("id"),
                user.get("username"),
                user.get("email"),
                user.get("role")));
        query.where(cb.equal(user.get("id"), id));
        return em.createQuery(query).getResultStream().findFirst().orElse(null);
    }

    public UserAccount byUsername(String username) {
        return em.createQuery(
                        "select u from UserAccount u where u.username = :name", UserAccount.class)
                .setParameter("name", username)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    public boolean emailExists(String email) {
        return em.createQuery(
                                "select count(u) from UserAccount u where u.email = :email",
                                Long.class)
                        .setParameter("email", email)
                        .getSingleResult()
                > 0;
    }

    public void save(UserAccount user) {
        em.persist(user);
        em.flush();
    }
}
