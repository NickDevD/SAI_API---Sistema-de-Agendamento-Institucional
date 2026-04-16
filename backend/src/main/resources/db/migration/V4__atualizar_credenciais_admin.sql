UPDATE tb_usuarios
SET login = '${ADMIN_LOGIN}',
    senha = '${ADMIN_PASSWORD_HASH}'
WHERE login = 'admin';