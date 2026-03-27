package com.legendss.backend.services;

import com.legendss.backend.entities.Navigation;
import com.legendss.backend.repositories.NavigationRepository;
import org.springframework.stereotype.Service;

@Service
public class NavigationService {
    private final NavigationRepository navigationRepository;

    public NavigationService(NavigationRepository navigationRepository) {
        this.navigationRepository = navigationRepository;
    }

    public Navigation addNavigation(Navigation data) {
        return this.navigationRepository.save(data);
    }

    public Navigation getNavigation(Long id) {
        return this.navigationRepository.findById(id).orElseThrow(() -> new RuntimeException("Navigation not found"));
    }

    public Navigation updateNavigation(Navigation data) {
        Navigation navigationToUpdate = this.getNavigation(data.getId());

        if(data.getPosition() != null){
            navigationToUpdate.setPosition(data.getPosition());
        }

        if(data.getDistance() != null){
            navigationToUpdate.setDistance(data.getDistance());
        }

        return this.navigationRepository.save(navigationToUpdate);
    }

}
