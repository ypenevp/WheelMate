package com.legendss.backend.controllers;

import java.util.List;

import com.legendss.backend.entities.ROLE;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.legendss.backend.entities.User;
import com.legendss.backend.entities.WheelChair;
import com.legendss.backend.repositories.UserRepository;
import com.legendss.backend.security.JwtService;
import com.legendss.backend.services.WheelChairService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/wheelchairs")
public class WheelChairController {

    private final WheelChairService wheelChairService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public WheelChairController(
            WheelChairService wheelChairService,
            UserRepository userRepository,
            JwtService jwtService
    ){
        this.wheelChairService = wheelChairService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/wheelchair/add")
    public WheelChair addWheelChair(@RequestBody WheelChair data, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return this.wheelChairService.addWheelChair(data, user);
    }

    @GetMapping("/wheelchair/get/all")
    public List<WheelChair> getAllWheelChair() {
        return this.wheelChairService.getAllWheelChairs();
    }

    @GetMapping("/wheelchair/get/{id}")
    public WheelChair getWheelChair(@PathVariable Long id) {
        return this.wheelChairService.getWheelChair(id);
    }

    @PatchMapping("/wheelchair/update/{id}")
    public WheelChair updateWheelChair(@PathVariable Long id, @RequestBody WheelChair wheelChair) {
        return this.wheelChairService.updateWheelChair(id, wheelChair);
    }

    @DeleteMapping("/wheelchair/delete/{id}")
    public void deleteWheelChair(@PathVariable Long id){
        this.wheelChairService.deleteWheelChair(id);
    }
}
