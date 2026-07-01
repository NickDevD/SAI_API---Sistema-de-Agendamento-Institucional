package com.devtec.sai.service;

import com.devtec.sai.dto.AgendamentoResponseDTO;
import com.devtec.sai.dto.AgendamentosRequestDTO;
import com.devtec.sai.model.Agendamento;
import com.devtec.sai.model.StatusAgendamento;
import com.devtec.sai.repository.AgendamentosRepository;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class AgendamentoService {

    private final AgendamentosRepository repository;
    private final RelatorioService relatorioService;

    public AgendamentoService(AgendamentosRepository repository, RelatorioService relatorioService) {
        this.repository = repository;
        this.relatorioService = relatorioService;
    }

    public AgendamentoResponseDTO criar(AgendamentosRequestDTO dados) {
        Agendamento agendamento = new Agendamento();
        agendamento.setNomeSolicitante(dados.nomeSolicitante());
        agendamento.setCpf(dados.cpf());
        agendamento.setRg(dados.rg());
        agendamento.setTipoServico(dados.tipoServico());
        agendamento.setPrioridade(dados.prioridade() != null ? dados.prioridade() : "NORMAL");
        agendamento.setDataHoraChegada(dados.dataHoraChegada() != null
                ? dados.dataHoraChegada()
                : LocalDateTime.now());
        agendamento.setStatus(StatusAgendamento.AGUARDANDO);

        Agendamento salvo = repository.save(agendamento);
        return toDTO(salvo);
    }

    public List<AgendamentoResponseDTO> consultar() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public AgendamentoResponseDTO atualizarStatus(UUID id, StatusAgendamento novoStatus) {
        Agendamento agendamento = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        agendamento.setStatus(novoStatus);
        return toDTO(repository.save(agendamento));
    }

    public File fecharExpediente() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime fimDia = LocalDate.now().atTime(LocalTime.MAX);

        List<Agendamento> hoje = repository.findByDataHoraChegadaBetween(inicioDia, fimDia);

        File file = relatorioService.gerarRelatorio(hoje);

        repository.deleteAll(hoje);

        return file;
    }

    private AgendamentoResponseDTO toDTO(Agendamento a) {
        return new AgendamentoResponseDTO(
                a.getId(),
                a.getNomeSolicitante(),
                a.getCpf(),
                a.getRg(),
                a.getTipoServico(),
                a.getPrioridade(),
                a.getDataHoraChegada(),
                a.getStatus()
        );
    }
}
