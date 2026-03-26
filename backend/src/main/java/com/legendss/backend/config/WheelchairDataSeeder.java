package com.legendss.backend.config;

import com.legendss.backend.entities.WheelChair;
import com.legendss.backend.repositories.UserRepository;
import com.legendss.backend.repositories.WheelChairRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class WheelchairDataSeeder implements CommandLineRunner {

    private final WheelChairRepository wheelChairRepository;
    private final UserRepository userRepository;

    @Value("${WHEELCHAIR_DEFAULT_GPS:42.6977,23.3219}")
    private String defaultGpsCoordinate;

    @Value("${WHEELCHAIR_DEFAULT_SPEED:0}")
    private int defaultSpeed;

    @Value("${WHEELCHAIR_DEFAULT_USER_EMAIL:}")
    private String defaultUserEmail;

    public WheelchairDataSeeder(
            WheelChairRepository wheelChairRepository,
            UserRepository userRepository
    ) {
        this.wheelChairRepository = wheelChairRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (wheelChairRepository.count() > 0) {
            return;
        }

        if (defaultUserEmail == null || defaultUserEmail.isBlank()) {
            System.out.println("WheelchairDataSeeder skipped: WHEELCHAIR_DEFAULT_USER_EMAIL is not set.");
            return;
        }

        var userOpt = userRepository.findByEmail(defaultUserEmail);
        if (userOpt.isEmpty()) {
            System.out.println("WheelchairDataSeeder skipped: user not found for email=" + defaultUserEmail);
            return;
        }

        WheelChair wheelChair = new WheelChair();
        wheelChair.setGpsCoordinate(defaultGpsCoordinate);
        wheelChair.setSpeed(defaultSpeed);
        wheelChair.setUser(userOpt.get());
        // panicStatus is set to false by @PrePersist

        wheelChairRepository.save(wheelChair);
        System.out.println(
                "Default wheelchair created for user=" + defaultUserEmail +
                        ", gps=" + defaultGpsCoordinate +
                        ", speed=" + defaultSpeed
        );
    }
}

