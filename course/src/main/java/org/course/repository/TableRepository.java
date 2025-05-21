package org.course.repository;

import org.course.entity.Tables;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableRepository extends JpaRepository<Tables, Long> {
    boolean existsByTableNumber(int tableNumber);
    List<Tables> findByIsReservedFalse();
    boolean existsByTableNumberAndIdNot(int tableNumber, long id);
}
