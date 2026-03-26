package com.legendss.backend.services;

import com.legendss.backend.entities.Caretaker;
import com.legendss.backend.repositories.CaretakerRepository;
import com.legendss.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CaretakerService {
    private final CaretakerRepository caretakerRepository;
    private final UserRepository userRepository;

    @Autowired
    public CaretakerService(CaretakerRepository caretakerRepository, UserRepository userRepository){
        this.caretakerRepository = caretakerRepository;
        this.userRepository = userRepository;
    }

    public Caretaker addCaretaker(Caretaker caretaker, String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        caretaker.setUser(user);
        return this.caretakerRepository.save(caretaker);
    }

    public Caretaker getCaretakerById(Long id) {
        return this.caretakerRepository.findById(id).orElse(null);
    }

    public List<Caretaker> getAllCaretakers() {
        return this.caretakerRepository.findAll();
    }

    public Caretaker updateCaretaker(Caretaker caretaker) {
        Caretaker caretakerToUpdate = getCaretakerById(caretaker.getId());

        if(caretakerToUpdate == null) {
            throw new RuntimeException("Caretaker not found");
        }

        if(caretaker.getName() != null) {
            caretakerToUpdate.setName(caretaker.getName());
        }

        if(caretaker.getNumber() != null) {
            caretakerToUpdate.setNumber(caretaker.getNumber());
        }

        return this.caretakerRepository.save(caretakerToUpdate);
    }

    public void deleteCaretakerById(Long id) {
        this.caretakerRepository.deleteById(id);
    }

}
