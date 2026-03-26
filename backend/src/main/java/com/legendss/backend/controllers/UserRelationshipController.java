package com.legendss.backend.controllers;

import com.legendss.backend.dto.EmailRequest;
import com.legendss.backend.entities.User;
import com.legendss.backend.services.UserRelationshipService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/relationships")
public class UserRelationshipController {

    private final UserRelationshipService userRelationshipService;

    public UserRelationshipController(UserRelationshipService userRelationshipService) {
        this.userRelationshipService = userRelationshipService;
    }

    @PostMapping("/relative/add")
    public User addRelative(@RequestAttribute("email") String userEmail, @RequestBody EmailRequest relativeEmailRequest) {
        return userRelationshipService.addRelative(userEmail, relativeEmailRequest.getEmail());
    }

    @PostMapping("/caretaker/add")
    public User addCaretaker(@RequestAttribute("email") String userEmail, @RequestBody EmailRequest caretakerEmailRequest) {
        return userRelationshipService.addCaretaker(userEmail, caretakerEmailRequest.getEmail());
    }

    @GetMapping("/relatives")
    public List<User> getRelatives(@RequestAttribute("email") String userEmail) {
        return userRelationshipService.getRelatives(userEmail);
    }

    @GetMapping("/caretakers")
    public List<User> getCaretakers(@RequestAttribute("email") String userEmail) {
        return userRelationshipService.getCaretakers(userEmail);
    }
}
