package com.legendss.backend.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class WheelChairCreateRequest {
    private String gpsCoordinates;
    private Integer speed;
}