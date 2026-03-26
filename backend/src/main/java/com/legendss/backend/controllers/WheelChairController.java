package com.legendss.backend.controllers;

import java.util.List;

import com.legendss.backend.entities.ROLE;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.*;

import com.legendss.backend.entities.User;
import com.legendss.backend.entities.WheelChair;
import com.legendss.backend.repositories.UserRepository;
import com.legendss.backend.security.JwtService;
import com.legendss.backend.services.WheelChairService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/wheelchair")
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

    @PostMapping("/addwheelchair")
    public WheelChair addWheelChair(
            @RequestBody WheelChair data,
            HttpServletRequest request
    ) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == ROLE.USER) {
            return this.wheelChairService.addWheelChair(data, user);
        } else {
            throw new RuntimeException("You do not have permission to perform this action");
        }
    }

    @GetMapping("/getallwheelchair")
    public List<WheelChair> getAllWheelChair() {
        return this.wheelChairService.getAllWheelChairs();
    }

    @GetMapping("/getwheelchair/{id}")
    public WheelChair getWheelChair(@PathVariable Long id) {
        return this.wheelChairService.getWheelChair(id);
    }

    @PatchMapping("/updatewheelchair/{id}")
    public WheelChair updateWheelChair(
            @PathVariable Long id,
            @RequestBody WheelChair wheelChair
    ) {
        wheelChair.setId(id);
        return this.wheelChairService.updateWheelChair(wheelChair);
    }

    @DeleteMapping("/deletewheelchair/{id}")
    public void deleteWheelChair(@PathVariable Long id){
        this.wheelChairService.deleteWheelChair(id);
    }
}