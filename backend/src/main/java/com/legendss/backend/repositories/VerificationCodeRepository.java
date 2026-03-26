package com.legendss.backend.repositories;


import com.legendss.backend.entities.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<com.legendss.backend.entities.VerificationCode, Long> {
    Optional<VerificationCode> findByCode(String code);
}