package com.legendss.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "wheel_chair")
@Getter
@Setter
public class WheelChair {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String gpsCoordinate;

    @Column(nullable = false)
    private Integer speed;

    @Column(nullable = false)
    private Boolean panicStatus;

    @OneToOne(optional = false)
    private User user;

    @PrePersist
    public void setStatus(){
        this.panicStatus = false;
    }
}
