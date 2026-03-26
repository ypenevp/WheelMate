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
        try {
            System.out.println("=== LOGIN PROCESSED START ===");
            var user = userRepo.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!encoder.matches(request.getPassword(), user.getPassword())) {
                throw new RuntimeException("Bad credentials");
            }

            if (!user.isEnabled()) {
                throw new RuntimeException("Email not verified");
            }

            String role = (user.getRole() != null) ? String.valueOf(user.getRole()) : "USER";

            System.out.println("Generating token for user: " + user.getEmail() + " with role: " + role);

            // Изпълняваме го на отделен ред, за да сме сигурни къде гърми
            String token = jwtService.generateToken(user.getEmail(), role);

            System.out.println("Token SUCCESS: " + token);

            return new AuthResponse(token);

        } catch (Throwable e) { // ← ПРОМЯНА: Хващаме Throwable (вкл. Error), а не само Exception
            System.err.println("!!! FATAL LOGIN ERROR !!!");
            System.err.println("Type: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Internal Server Error: " + e.getMessage());
        }
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