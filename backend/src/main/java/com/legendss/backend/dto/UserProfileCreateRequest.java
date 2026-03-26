package com.legendss.backend.dto;

import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class UserProfileCreateRequest {
    private String address;

    @NonNull
    private String telephone;

    @NonNull
    private MultipartFile photo;
}
