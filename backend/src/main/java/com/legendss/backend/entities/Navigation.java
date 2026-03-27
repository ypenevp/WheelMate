package com.legendss.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "navigation")
@Data
public class Navigation {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "position", nullable = false)
    @Enumerated(EnumType.STRING)
    private POSITION position;

    @Column(name = "distance", nullable = false)
    private Double distance;
}
