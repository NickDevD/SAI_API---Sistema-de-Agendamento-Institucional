package com.devtec.sai.controller;

import com.devtec.sai.dto.AgendamentoResponseDTO;
import com.devtec.sai.dto.AgendamentosRequestDTO;
import com.devtec.sai.model.Agendamento;
import com.devtec.sai.service.AgendamentoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agendamentos")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    @PostMapping("/agendar")
    public ResponseEntity<AgendamentoResponseDTO> agendar(@RequestBody @Valid AgendamentosRequestDTO dados) {
        AgendamentoResponseDTO response = agendamentoService.criar(dados);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/consultar_agendamentos")
    public ResponseEntity<List<AgendamentoResponseDTO>> consultarAgendamentos() {
        List<AgendamentoResponseDTO> consultar =  agendamentoService.consultar();
        return ResponseEntity.status(HttpStatus.OK).body(consultar);
    }

}
