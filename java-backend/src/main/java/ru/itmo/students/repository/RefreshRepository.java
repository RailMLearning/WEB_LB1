package ru.itmo.students.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.*;
import java.time.Instant;
import ru.itmo.students.model.RefreshSession;

@ApplicationScoped
public class RefreshRepository {
    @PersistenceContext(unitName = "students")
    private EntityManager em;

    public RefreshSession lock(String id) {
        return em.find(RefreshSession.class, id, LockModeType.PESSIMISTIC_WRITE);
    }

    public void save(RefreshSession session) {
        em.persist(session);
        em.flush();
    }

    public void delete(RefreshSession session) {
        em.remove(session);
        em.flush();
    }

    public void removeExpired() {
        em.createQuery("delete from RefreshSession s where s.expiresAt < :now").setParameter("now", Instant.now()).executeUpdate();
    }
}
