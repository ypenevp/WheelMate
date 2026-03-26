package com.legendss.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "userprofile")
@Getter
@Setter

public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "address", nullable = true)
    private String address;

    @Column(name = "telephone", nullable = false)
    private String telephone;

    @Column(name = "photoUrl", nullable = true)
    private String photo;

    @Column
    @Enumerated(EnumType.STRING)
    private THEME theme;

}
