package com.devtec.sai.repository;

import com.devtec.sai.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AgendamentosRepository extends JpaRepository<Agendamento, UUID> {
}
