package com.legendss.backend.dto;

import com.legendss.backend.entities.ROLE;

public record UserResponse(String email, String username, ROLE role) {}