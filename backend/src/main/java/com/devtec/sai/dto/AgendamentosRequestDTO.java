package com.devtec.sai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

public record AgendamentosRequestDTO(
     @NotBlank(message = "O nome do solicitante é obrigatório")
     @Size(min = 3, max = 100, message = "O nome deve ter entre 3 e 100 caracteres")
     String nomeSolicitante,

     @NotBlank(message = "O CPF é obrigatório")
     @CPF(message = "CPF invalido")
     String cpf,

     String rg,

     @NotBlank(message = "O tipo de serviço é obrigatório")
     String tipoServico
) {}
