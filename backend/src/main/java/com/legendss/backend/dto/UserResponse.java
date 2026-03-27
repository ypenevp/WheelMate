package com.legendss.backend.dto;

import com.legendss.backend.entities.ROLE;

import java.io.Serializable;

public record UserResponse(String email, String username, ROLE role, Long id)  {}