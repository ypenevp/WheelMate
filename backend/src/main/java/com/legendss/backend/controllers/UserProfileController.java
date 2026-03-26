package com.legendss.backend.controllers;

import java.io.IOException;
import java.util.Map;


import com.cloudinary.utils.ObjectUtils;
import com.legendss.backend.dto.UserProfileCreateRequest;
import com.legendss.backend.entities.ROLE;
import com.legendss.backend.entities.THEME;
import com.legendss.backend.entities.UserProfile;
import com.legendss.backend.entities.User;
import com.legendss.backend.repositories.UserRepository;
import com.legendss.backend.security.JwtService;
import com.legendss.backend.services.AuthService;
import com.legendss.backend.services.CloudinaryService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import com.legendss.backend.services.UserProfileService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/userprofile")
public class UserProfileController {
    private final UserProfileService userProfileService;
    private final CloudinaryService cloudinaryService;
    private final UserRepository userRepository;
    private final JwtService jwtService;


    public UserProfileController(UserProfileService userProfileService, CloudinaryService cloudinaryService, UserRepository userRepository, AuthService authService, JwtService jwtService) {
        this.userProfileService = userProfileService;
        this.cloudinaryService = cloudinaryService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/createuserprofile")
    public UserProfile createUserProfile(
            @ModelAttribute UserProfileCreateRequest data,
            HttpServletRequest request
    ) throws IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile userProfile= new UserProfile();
        userProfile.setAddress(data.getAddress());
        if(user.getRole() == ROLE.USER && data.getTelephone() != null) {
            throw new RuntimeException("Users cannot set telephone number");
        }

        if(user.getRole() == ROLE.CARETAKER || user.getRole() == ROLE.RELATIVE || user.getRole() == ROLE.USER) {
            userProfile.setTelephone(data.getTelephone());
        }

        if(user.getRole() == ROLE.CARETAKER) {
            userProfile.setOrganization(data.getOrganization());
        }

        userProfile.setTheme(THEME.LIGHT);
        userProfile.setUser(user);

        Map uploadImage = cloudinaryService.getCloudinary()
                .uploader()
                .upload(data.getPhoto().getBytes(), ObjectUtils.emptyMap());

        String pictureUrl = (String) uploadImage.get("secure_url");
        userProfile.setPhoto(pictureUrl);

        return userProfileService.addUserProfile(userProfile);
    }

    @GetMapping("/getuserprofile/{id}")
    public UserProfile getNews(@PathVariable Long id) {
        return this.userProfileService.getUserProfile(id);
    }

    @PatchMapping("/updateuserprofile/{id}")
    public UserProfile updateUserProfile(@PathVariable Long id, @RequestBody UserProfile userProfile) {
        userProfile.setId(id);
        return this.userProfileService.updateUserProfile(userProfile);
    }

    @DeleteMapping("/deleteuserprofile/{id}")
    public void deleteUserProfile(@PathVariable Long id) {
        this.userProfileService.deleteUserProfile(id);
    }
}
