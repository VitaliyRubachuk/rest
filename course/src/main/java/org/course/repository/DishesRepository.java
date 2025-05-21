package org.course.repository;
import org.course.entity.Dishes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface DishesRepository extends JpaRepository<Dishes, Long> {

    List<Dishes> findByCategory(String category);

    List<Dishes> findAllByOrderByPriceAsc();
    List<Dishes> findAllByOrderByPriceDesc();

    Page<Dishes> findAll(Pageable pageable);

    List<Dishes> findAllByOrderByNameAsc();
    List<Dishes> findAllByOrderByNameDesc();


}
