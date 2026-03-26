package com.legendss.backend.controllers;

import com.legendss.backend.dto.*;
import com.legendss.backend.entities.User;
import com.legendss.backend.services.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register") //register?role=CARETAKER
    public void register(@RequestBody RegisterRequest request, @RequestParam String role) {
        authService.register(request, role);
    }

    @PostMapping("/verify")
    public void verify(@RequestBody VerificationRequest request) {
        authService.verifyEmail(request.getCode());
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse getUserData(@RequestAttribute("email") String email) {
        return authService.getUserData(email);
    }

    @GetMapping("/getallusers")
    public List<User> getAllUsers() {
        return this.authService.getAllUsers();
    }

}
