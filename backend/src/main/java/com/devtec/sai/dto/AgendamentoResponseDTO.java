package com.devtec.sai.dto;

import com.devtec.sai.model.StatusAgendamento;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgendamentoResponseDTO(
        UUID id,
        String nomeSolicitante,
        String cpf,
        String rg,
        String tipoServico,
        String prioridade,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime dataHoraChegada,
        StatusAgendamento status
) {}
