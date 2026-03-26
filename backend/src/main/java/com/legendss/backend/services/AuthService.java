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
    private final UserProfileRepository userProfileRepository;

    public AuthService(
            UserRepository userRepo,
            VerificationCodeRepository codeRepo,
            PasswordEncoder encoder,
            EmailService emailService,
            JwtService jwtService,
            UserProfileRepository userProfileRepository
    ) {
        this.userRepo = userRepo;
        this.codeRepo = codeRepo;
        this.encoder = encoder;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.userProfileRepository = userProfileRepository;
    }

    public void register(RegisterRequest request, String roleStr) {

        ROLE role;
        try {
            role = ROLE.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role. Allowed roles: USER, CARETAKER, RELATIVE");
        }

        if (role == ROLE.ADMIN) {
            throw new RuntimeException("Cannot register as ADMIN");
        }

        var user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(encoder.encode(request.getPassword()));

        // 2. Задаваме подадената роля
        user.setRole(role);

        user.setEnabled(false);

        userRepo.save(user);

        var userProfile = new UserProfile();
        userProfile.setUser(user);
        userProfile.setTheme(THEME.LIGHT);
        userProfile.setTelephone("");

        userProfileRepository.save(userProfile);

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
            var user = userRepo.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!encoder.matches(request.getPassword(), user.getPassword())) {
                throw new RuntimeException("Bad credentials");
            }

            if (!user.isEnabled()) {
                throw new RuntimeException("Email not verified");
            }

            String role = (user.getRole() != null) ? String.valueOf(user.getRole()) : "USER";

            String token = jwtService.generateToken(user.getEmail(), role);

            return new AuthResponse(token);

        } catch (Throwable e) {
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