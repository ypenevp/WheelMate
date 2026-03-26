package com.legendss.backend.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class UserProfileCreateRequest {
    private String address;
    private String telephone;
    private MultipartFile photo;
    private String organization;
}
