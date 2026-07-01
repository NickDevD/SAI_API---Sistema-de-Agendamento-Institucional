package com.devtec.sai.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

import java.time.LocalDateTime;

public record AgendamentosRequestDTO(

        @NotBlank(message = "O nome do solicitante é obrigatório")
        @Size(min = 3, max = 100, message = "O nome deve ter entre 3 e 100 caracteres")
        String nomeSolicitante,

        @NotBlank(message = "O CPF é obrigatório")
        @CPF(message = "CPF inválido")
        String cpf,

        String rg,

        @NotBlank(message = "O tipo de serviço é obrigatório")
        String tipoServico,

        String prioridade,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        LocalDateTime dataHoraChegada

) {}
