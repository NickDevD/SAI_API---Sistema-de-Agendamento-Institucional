CREATE TABLE tb_agendamentos(
    id UUID PRIMARY KEY,
    nome_solicitante VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    rg VARCHAR(20),
    tipo_servico VARCHAR(100) NOT NULL,
    data_hora_chegada TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL
);