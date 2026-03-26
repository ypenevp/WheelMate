package com.legendss.backend.entities;
import com.legendss.backend.entities.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;

    @OneToOne(optional = false)
    private User user;

    private LocalDateTime expiresAt;

}