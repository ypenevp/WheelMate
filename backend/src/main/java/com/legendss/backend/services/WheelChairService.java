package com.legendss.backend.services;

import java.util.List;

import com.legendss.backend.entities.User;
import com.legendss.backend.entities.WheelChair;
import com.legendss.backend.repositories.WheelChairRepository;

import org.springframework.stereotype.Service;

@Service
public class WheelChairService {

    private final WheelChairRepository wheelChairRepository;

    public WheelChairService(WheelChairRepository wheelChairRepository){
        this.wheelChairRepository = wheelChairRepository;
    }

    public WheelChair addWheelChair(WheelChair data, User user) {

        if (data.getGpsCoordinate() == null || data.getGpsCoordinate().isBlank()) {
            throw new RuntimeException("gpsCoordinate is required");
        }

        if (data.getSpeed() == null) {
            throw new RuntimeException("speed is required");
        }

        if (user == null) {
            throw new RuntimeException("User is required");
        }

        data.setUser(user);

        return this.wheelChairRepository.save(data);
    }

    public WheelChair getWheelChair(Long id) {
        return this.wheelChairRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WheelChair not found"));
    }

    public WheelChair updateWheelChair(WheelChair wheelChair){

        WheelChair existing = this.wheelChairRepository.findById(wheelChair.getId())
                .orElseThrow(() -> new RuntimeException("WheelChair not found"));

        if (wheelChair.getGpsCoordinate() != null && !wheelChair.getGpsCoordinate().isBlank()) {
            existing.setGpsCoordinate(wheelChair.getGpsCoordinate());
        }

        if (wheelChair.getSpeed() != null) {
            existing.setSpeed(wheelChair.getSpeed());
        }

        if (wheelChair.getPanicStatus() != null) {
            existing.setPanicStatus(wheelChair.getPanicStatus());
        }

        return this.wheelChairRepository.save(existing);
    }

    public List<WheelChair> getAllWheelChairs(){
        return this.wheelChairRepository.findAll();
    }

    public void deleteWheelChair(long id){

        if (!wheelChairRepository.existsById(id)) {
            throw new RuntimeException("WheelChair not found");
        }

        this.wheelChairRepository.deleteById(id);
    }
}