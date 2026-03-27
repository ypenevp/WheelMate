package com.legendss.backend.repositories;

import com.legendss.backend.entities.Navigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NavigationRepository extends JpaRepository<Navigation, Long> {

}
