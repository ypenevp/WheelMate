package com.legendss.backend.dto;

import com.legendss.backend.entities.ROLE;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRoleRequest {
    private String email;
    private ROLE role;
}
