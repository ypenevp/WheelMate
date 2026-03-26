package com.legendss.backend.services;

import com.legendss.backend.dto.AuthResponse;
import com.legendss.backend.dto.LoginRequest;
import com.legendss.backend.dto.RegisterRequest;
import com.legendss.backend.dto.UserResponse;
import com.legendss.backend.entities.*;
import com.legendss.backend.repositories.*;
import com.legendss.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.legendss.backend.entities.ROLE;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final VerificationCodeRepository codeRepo;
    private final PasswordEncoder encoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepo,
            VerificationCodeRepository codeRepo,
            PasswordEncoder encoder,
            EmailService emailService,
            JwtService jwtService
    ) {
        this.userRepo = userRepo;
        this.codeRepo = codeRepo;
        this.encoder = encoder;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    public void register(RegisterRequest request) {

        var user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(ROLE.USER);
        user.setEnabled(false);

        userRepo.save(user);

        var code = UUID.randomUUID().toString().substring(0, 6);

        var verification = new VerificationCode();
        verification.setCode(code);
        verification.setUser(user);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        codeRepo.save(verification);
        emailService.sendVerificationCode(user.getEmail(), code);
    }


    public void verifyEmail(String code) {
        var verification = codeRepo.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid code"));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expired");
        }

        var user = verification.getUser();
        user.setEnabled(true);

        userRepo.save(user);
        codeRepo.delete(verification);
    }

    public AuthResponse login(LoginRequest request) {
        var user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Bad credentials");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("Email not verified");
        }

        return new AuthResponse(jwtService.generateToken(user.getEmail(), String.valueOf(user.getRole())));
    }

    public UserResponse getUserData(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserResponse(user.getEmail(), user.getUsername(), user.getRole());
    }

    public List<User> getAllUsers(){
        return this.userRepo.findAll();
    }
}