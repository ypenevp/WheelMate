package com.legendss.backend.services;

import java.util.List;

import com.legendss.backend.entities.User;
import com.legendss.backend.entities.WheelChair;
import com.legendss.backend.repositories.WheelChairRepository;
import com.legendss.backend.services.utils.DeviceTokenGenerator;
import org.springframework.stereotype.Service;

@Service
public class WheelChairService {

    private final WheelChairRepository wheelChairRepository;
    private final DeviceTokenGenerator deviceTokenGenerator;


    public WheelChairService(WheelChairRepository wheelChairRepository, DeviceTokenGenerator deviceTokenGenerator){
        this.wheelChairRepository = wheelChairRepository;
        this.deviceTokenGenerator = deviceTokenGenerator;
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
        data.setToken(deviceTokenGenerator.generateToken());

        return this.wheelChairRepository.save(data);
    }

    public WheelChair getWheelChair(Long id) {
        return this.wheelChairRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WheelChair not found"));
    }

    public WheelChair updateWheelChair(Long id, WheelChair patchData){

        WheelChair existing = this.wheelChairRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WheelChair not found"));

        if (patchData.getToken() == null || patchData.getToken().isBlank()) {
            throw new RuntimeException("Device token is required for update");
        }

        if (!existing.getToken().equals(patchData.getToken())) {
            throw new RuntimeException("Invalid device token");
        }

        if (patchData.getGpsCoordinate() != null && !patchData.getGpsCoordinate().isBlank()) {
            existing.setGpsCoordinate(patchData.getGpsCoordinate());
        }

        if (patchData.getSpeed() != null) {
            existing.setSpeed(patchData.getSpeed());
        }

        if (patchData.getPanicStatus() != null) {
            existing.setPanicStatus(patchData.getPanicStatus());
        }

        if (patchData.getUserInchair() != null) {
            existing.setUserInchair(patchData.getUserInchair());
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

    public void updateFromHardware(String token, WheelChair payload) {
        WheelChair existing = this.wheelChairRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid Hardware Token"));

        if (payload.getGpsCoordinate() != null && !payload.getGpsCoordinate().isBlank()) {
            existing.setGpsCoordinate(payload.getGpsCoordinate());
        }
        if (payload.getSpeed() != null) {
            existing.setSpeed(payload.getSpeed());
        }
        if (payload.getPanicStatus() != null) {
            existing.setPanicStatus(payload.getPanicStatus());
        }
        if (payload.getUserInchair() != null) {
            existing.setUserInchair(payload.getUserInchair());
        }


        this.wheelChairRepository.save(existing);
    }

    public WheelChair getWheelChairSecurely(Long id, String requesterEmail) {
        WheelChair wheelChair = this.wheelChairRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("WheelChair not found"));

        User owner = wheelChair.getUser();

        if (owner.getEmail().equals(requesterEmail)) {
            return wheelChair;
        }

        boolean isRelative = owner.getRelatives() != null && owner.getRelatives().stream()
                .anyMatch(u -> u.getEmail().equals(requesterEmail));

        if (isRelative) {
            return wheelChair;
        }

        boolean isCaretaker = owner.getCaretakers() != null && owner.getCaretakers().stream()
                .anyMatch(u -> u.getEmail().equals(requesterEmail));

        if (isCaretaker) {
            return wheelChair;
        }

        throw new RuntimeException("Access denied: you are not related to this WheelChair");
    }

    public WheelChair getWheelChairByUserIdSecurely(Long userId, String requesterEmail) {
        WheelChair wheelChair = this.wheelChairRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("WheelChair not found for this user"));

        User owner = wheelChair.getUser();

        if (owner.getEmail().equals(requesterEmail)) {
            return wheelChair;
        }

        boolean isRelative = owner.getRelatives() != null && owner.getRelatives().stream()
                .anyMatch(u -> u.getEmail().equals(requesterEmail));

        if (isRelative) {
            return wheelChair;
        }

        boolean isCaretaker = owner.getCaretakers() != null && owner.getCaretakers().stream()
                .anyMatch(u -> u.getEmail().equals(requesterEmail));

        if (isCaretaker) {
            return wheelChair;
        }

        throw new RuntimeException("Access denied: you are not related to this WheelChair");
    }

    public List<WheelChair> getMyAssociatedWheelChairs(String requesterEmail) {
        return this.wheelChairRepository.findAll().stream().filter(wc -> {
            User owner = wc.getUser();
            if (owner.getEmail().equals(requesterEmail)) {
                return true;
            }

            boolean isRelative = owner.getRelatives() != null && owner.getRelatives().stream()
                    .anyMatch(u -> u.getEmail().equals(requesterEmail));
            if (isRelative) {
                return true;
            }

            boolean isCaretaker = owner.getCaretakers() != null && owner.getCaretakers().stream()
                    .anyMatch(u -> u.getEmail().equals(requesterEmail));

            return isCaretaker;
        }).toList();
    }
}
