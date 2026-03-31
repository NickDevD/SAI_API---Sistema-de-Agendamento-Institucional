INSERT INTO tb_usuarios (id, login, senha, role)
SELECT gen_random_uuid(), 'admin', '$2a$10$S/S5FMYsKq5zKe5abuCzmeQxT9x3IJUaIC43Kli5Nkvy02qc/IXXa', 'ROLE_ADMIN'
    WHERE NOT EXISTS (
    SELECT 1 FROM tb_usuarios WHERE login = 'admin'
);