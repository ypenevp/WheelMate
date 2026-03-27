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

    @Column(name = "userInchair")
    private Boolean userInchair;

    @Column(nullable = false)
    private Boolean panicStatus;

    @OneToOne(optional = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true, updatable = false)
    private String token;

    @PrePersist
    public void setInit(){
        this.panicStatus = false;
        this.userInchair = false;
    }

}
