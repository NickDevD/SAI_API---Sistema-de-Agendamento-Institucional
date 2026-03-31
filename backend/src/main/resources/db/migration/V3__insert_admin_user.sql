INSERT INTO tb_usuarios (id, login, senha, role)
SELECT gen_random_uuid(), 'admin', '$2a$10$NLilALcVtSApBw.AxVjotub2K9fnJz6Z981Fc42tTepGM9kNiZiBu', 'ADMIN'
    WHERE NOT EXISTS (
    SELECT 1 FROM tb_usuarios WHERE login = 'admin'
);