package com.legendss.backend.config;

import com.legendss.backend.entities.User;
import com.legendss.backend.entities.ROLE;
import com.legendss.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    @Value("${default.admin.email}")
    private String adminEmail;

    @Value("${default.admin.username}")
    private String adminUsername;

    @Value("${default.admin.password}")
    private String adminPassword;

    public DataSeeder(UserRepository userRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!userRepo.findByEmail(adminEmail).isPresent()) {
            var admin = new User();
            admin.setEmail(adminEmail);
            admin.setUsername(adminUsername);
            admin.setPassword(encoder.encode(adminPassword));
            admin.setRole(ROLE.ADMIN);
            admin.setEnabled(true);

            userRepo.save(admin);
            System.out.println("Default admin created: " + adminUsername);
        }
    }
}
