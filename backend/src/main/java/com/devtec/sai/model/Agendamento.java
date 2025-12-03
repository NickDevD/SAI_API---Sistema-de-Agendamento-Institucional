package com.devtec.sai.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="tb_agendamentos")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nomeSolicitante;

    @Column(nullable = false, length = 11)
    private String cpf;

    private String rg;

    @Column(nullable = false)
    private String tipoServico;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dataHoraChegada;

    @Enumerated(EnumType.STRING)
    private StatusAgendamento status;

    public Agendamento() {

    }

    public Agendamento(UUID id, String nomeSolicitante, String cpf, String rg, String tipoServico, LocalDateTime dataHoraChegada, StatusAgendamento status) {
        this.id = id;
        this.nomeSolicitante = nomeSolicitante;
        this.cpf = cpf;
        this.rg = rg;
        this.tipoServico = tipoServico;
        this.dataHoraChegada = dataHoraChegada;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public String getNomeSolicitante() {
        return nomeSolicitante;
    }

    public void setNomeSolicitante(String nomeSolicitante) {
        this.nomeSolicitante = nomeSolicitante;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getRg() {
        return rg;
    }

    public void setRg(String rg) {
        this.rg = rg;
    }

    public String getTipoServico() {
        return tipoServico;
    }

    public void setTipoServico(String tipoServico) {
        this.tipoServico = tipoServico;
    }

    public LocalDateTime getDataHoraChegada() {
        return dataHoraChegada;
    }

    public void setDataHoraChegada(LocalDateTime dataHoraChegada) {
        this.dataHoraChegada = dataHoraChegada;
    }

    public StatusAgendamento getStatus() {
        return status;
    }

    public void setStatus(StatusAgendamento status) {
        this.status = status;
    }
}

