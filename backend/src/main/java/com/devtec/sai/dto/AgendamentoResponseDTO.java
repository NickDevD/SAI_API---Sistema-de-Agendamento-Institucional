package com.devtec.sai.dto;

import com.devtec.sai.model.StatusAgendamento;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgendamentoResponseDTO(
       UUID id,
       String nomeSolicitante,
       String cpf,
       String tipoServico,
       LocalDateTime dataHoraChegada,
       StatusAgendamento status
) {}
