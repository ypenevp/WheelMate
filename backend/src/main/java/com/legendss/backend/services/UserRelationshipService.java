package com.legendss.backend.services;

import com.legendss.backend.entities.ROLE;
import com.legendss.backend.entities.User;
import com.legendss.backend.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserRelationshipService {
    private final UserRepository userRepository;

    public UserRelationshipService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User addRelative(String userEmail, String relativeEmail){
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User relative = userRepository.findByEmail(relativeEmail)
                .orElseThrow(() -> new RuntimeException("Relative not found"));

        if (relative.getRole() == ROLE.ADMIN) {
            throw new RuntimeException("Cannot add ADMIN as a relative");
        }

        if (relative.getRole() != ROLE.RELATIVE && relative.getRole() != ROLE.USER) {
             throw new RuntimeException("User must have USER or RELATIVE role");
        }

        if (!user.getRelatives().contains(relative)) {
            user.getRelatives().add(relative);
        }

        return userRepository.save(user);
    }

    public User addCaretaker(String userEmail, String caretakerEmail){
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User caretaker = userRepository.findByEmail(caretakerEmail)
                .orElseThrow(() -> new RuntimeException("Caretaker not found"));

        if (caretaker.getRole() == ROLE.ADMIN) {
            throw new RuntimeException("Cannot add ADMIN as a caretaker");
        }

        if (caretaker.getRole() != ROLE.CARETAKER && caretaker.getRole() != ROLE.USER) {
            throw new RuntimeException("User must have USER or CARETAKER role");
        }

        if (!user.getCaretakers().contains(caretaker)) {
            user.getCaretakers().add(caretaker);
        }

        return userRepository.save(user);
    }

    public List<User> getRelatives(String userEmail){
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getRelatives();
    }

    public List<User> getCaretakers(String userEmail){
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getCaretakers();
    }
}