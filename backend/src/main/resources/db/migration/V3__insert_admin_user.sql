INSERT INTO tb_usuarios (id, login, senha, role)
SELECT gen_random_uuid(), '${ADMIN_LOGIN}', '${ADMIN_PASSWORD_HASH}', 'ADMIN'
    WHERE NOT EXISTS (
    SELECT 1 FROM tb_usuarios WHERE login = '${ADMIN_LOGIN}'
);