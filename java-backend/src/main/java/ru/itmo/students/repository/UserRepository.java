package ru.itmo.students.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.*;
import ru.itmo.students.model.UserAccount;

@ApplicationScoped
public class UserRepository {
    @PersistenceContext(unitName = "students")
    private EntityManager em;

    public UserAccount find(long id) {
        return em.find(UserAccount.class, id);
    }

    public UserAccount byUsername(String username) {
        return em.createQuery("select u from UserAccount u where u.username = :name", UserAccount.class).setParameter("name", username).getResultStream().findFirst().orElse(null);
    }

    public boolean emailExists(String email) {
        return em.createQuery("select count(u) from UserAccount u where u.email = :email", Long.class).setParameter("email", email).getSingleResult() > 0;
    }

    public void save(UserAccount user) {
        em.persist(user);
        em.flush();
    }
}
