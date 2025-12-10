package com.devtec.sai.service;

import com.devtec.sai.dto.AgendamentoResponseDTO;
import com.devtec.sai.dto.AgendamentosRequestDTO;
import com.devtec.sai.model.Agendamento;
import com.devtec.sai.model.StatusAgendamento;
import com.devtec.sai.repository.AgendamentosRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AgendamentoService {

    private final AgendamentosRepository repository;

    public AgendamentoService(AgendamentosRepository repository) {
        this.repository = repository;
    }

    public AgendamentoResponseDTO criar(AgendamentosRequestDTO dados) {
        Agendamento agendamento = new Agendamento();
        agendamento.setNomeSolicitante(dados.nomeSolicitante());
        agendamento.setCpf(dados.cpf());
        agendamento.setRg(dados.rg());
        agendamento.setTipoServico(dados.tipoServico());
        agendamento.setStatus(StatusAgendamento.AGUARDANDO);

        Agendamento agendamentoSalvo = repository.save(agendamento);

        return new AgendamentoResponseDTO(
                agendamentoSalvo.getId(),
                agendamentoSalvo.getNomeSolicitante(),
                agendamentoSalvo.getCpf(),
                agendamentoSalvo.getTipoServico(),
                agendamentoSalvo.getDataHoraChegada(),
                agendamentoSalvo.getStatus()
        );
    }

    public List<AgendamentoResponseDTO> consultar() {

        List<Agendamento> agendamentos = repository.findAll();

        return agendamentos.stream()
                .map(agendamento -> new AgendamentoResponseDTO(
                        agendamento.getId(),
                        agendamento.getNomeSolicitante(),
                        agendamento.getCpf(),
                        agendamento.getTipoServico(),
                        agendamento.getDataHoraChegada(),
                        agendamento.getStatus()
                ))
                .toList();
    }

    public AgendamentoResponseDTO atualizarStatus(UUID id, StatusAgendamento novoStatus) {

        Agendamento agendamento = repository.findById(id)
                .orElseThrow(()-> new RuntimeException("Agendamento não encontrado"));

        agendamento.setStatus(novoStatus);

        Agendamento atualizado = repository.save(agendamento);

        return new AgendamentoResponseDTO(
                atualizado.getId(),
                atualizado.getNomeSolicitante(),
                atualizado.getCpf(),
                atualizado.getTipoServico(),
                atualizado.getDataHoraChegada(),
                atualizado.getStatus()
        );
    }
}
