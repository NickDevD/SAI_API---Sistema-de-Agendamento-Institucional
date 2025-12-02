package com.devtec.sai.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponseDTO(
        String message,
        int status,
        LocalDateTime dataHora,
        List<FieldErrorDTO> errosValidacao
) {}

