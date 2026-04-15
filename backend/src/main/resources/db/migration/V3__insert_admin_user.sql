INSERT INTO tb_usuarios (id, login, senha, role)
SELECT gen_random_uuid(), '$2a$10$NXivwX8RVSp7CvbZxhgNQOOQBGar5MSFH/pDAK4cnsDDpRJMUKthK', '$2a$10$NLilALcVtSApBw.AxVjotub2K9fnJz6Z981Fc42tTepGM9kNiZiBu', 'ADMIN'
    WHERE NOT EXISTS (
    SELECT 1 FROM tb_usuarios WHERE login = 'admin'
);