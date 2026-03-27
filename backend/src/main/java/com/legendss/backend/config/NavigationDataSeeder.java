package com.legendss.backend.config;

import com.legendss.backend.entities.Navigation;
import com.legendss.backend.entities.POSITION;
import com.legendss.backend.repositories.NavigationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class NavigationDataSeeder implements CommandLineRunner {

    private final NavigationRepository navigationRepository;

    public NavigationDataSeeder(NavigationRepository navigationRepository) {
        this.navigationRepository = navigationRepository;
    }

    @Override
    public void run(String... args) {
        // Ако вече има запис в таблицата 'navigation', спираме дотук
        if (navigationRepository.count() > 0) {
            System.out.println("NavigationDataSeeder skipped: Navigation record already exists.");
            return;
        }

        // Създаваме нов Navigation обект с дефолтни стойности
        Navigation defaultNavigation = new Navigation();
        defaultNavigation.setPosition(POSITION.STRAIGHT); // Default enum стойност
        defaultNavigation.setDistance(0.0);               // Default разстояние

        // Запазваме в базата данни
        navigationRepository.save(defaultNavigation);

        System.out.println(" Default Navigation record created: position=STRAIGHT, distance=0.0");
    }
}
