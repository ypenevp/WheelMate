package com.legendss.backend.controllers;

import com.legendss.backend.entities.Navigation;
import com.legendss.backend.services.NavigationService;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/navigation")
public class NavigationController {
    private final NavigationService navigationService;

    public NavigationController(NavigationService navigationService) {
        this.navigationService = navigationService;
    }

    @PostMapping("/add")
    public Navigation addNavigationController(@RequestBody Navigation navigation) {
        return this.navigationService.addNavigation(navigation);
    }

    @GetMapping("/get/{id}")
    public Navigation getNavigationController(@PathVariable Long id) {
        return this.navigationService.getNavigation(id);
    }

    @PatchMapping("/update/{id}")
    public Navigation updateNavigationController(@PathVariable Long id, @RequestBody Navigation navigation) {
        navigation.setId(id);
        return this.navigationService.updateNavigation(navigation);
    }
}
