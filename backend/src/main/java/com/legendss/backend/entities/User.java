package com.legendss.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.legendss.backend.entities.Caretaker;
import com.legendss.backend.entities.ROLE;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column
    @Enumerated(EnumType.STRING)
    private ROLE role;

    private boolean enabled;

    // RELATIVES of this user (other users)
    @ManyToMany
    @JoinTable(name = "user_relatives", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "relative_id"))
    @JsonIgnore
    private List<User> relatives;

    // CARETAKERS who are users
    @ManyToMany
    @JoinTable(name = "user_caretakers", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "caretaker_id"))
    @JsonIgnore
    private List<User> caretakers;

    // External caretakers (with numbers)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Caretaker> externalCaretakers;
}
