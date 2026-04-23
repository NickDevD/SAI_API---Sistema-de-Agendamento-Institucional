package com.devtec.sai.controller;

import com.devtec.sai.dto.AgendamentoResponseDTO;
import com.devtec.sai.dto.AgendamentosRequestDTO;
import com.devtec.sai.dto.AtualizarStatusDTO;
import com.devtec.sai.service.AgendamentoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/agendamentos")
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

    @PostMapping("/{id}/status")
    public ResponseEntity<AgendamentoResponseDTO> atualizarStatus(@PathVariable UUID id, @RequestBody @Valid AtualizarStatusDTO atualizar) {
        AgendamentoResponseDTO novoStatus = agendamentoService.atualizarStatus(id,atualizar.status());
        return ResponseEntity.status(HttpStatus.CREATED).body(novoStatus);
    }

    @GetMapping("/consultar_agendamentos")
    public ResponseEntity<List<AgendamentoResponseDTO>> consultarAgendamentos() {
        List<AgendamentoResponseDTO> consultar =  agendamentoService.consultar();
        return ResponseEntity.status(HttpStatus.OK).body(consultar);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/fechar-expediente")
    public ResponseEntity<org.springframework.core.io.Resource> fecharExpediente() {

        java.io.File file = agendamentoService.fecharExpediente();

        org.springframework.core.io.Resource resource =
                new org.springframework.core.io.FileSystemResource(file);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + file.getName())
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(resource);
    }


}
