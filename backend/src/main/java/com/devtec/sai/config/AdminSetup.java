package com.devtec.sai.config;

import com.devtec.sai.model.UserRole;
import com.devtec.sai.model.Usuario;
import com.devtec.sai.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSetup implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminSetup.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;

    @Value("${ADMIN_LOGIN_LINE}")
    private String adminLogin;

    @Value("${ADMIN_PASSWORD_LINE}")
    private String adminPassword;

    @Autowired
    public AdminSetup(UsuarioRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (repository.findByLogin(adminLogin) == null) {
            Usuario admin = new Usuario(adminLogin, encoder.encode(adminPassword), UserRole.ADMIN);
            repository.save(admin);
            logger.info("✅ Usuário Admin criado com sucesso pelo Java! login={}", adminLogin);
        } else {
            logger.info("Usuário admin já existe. login={}", adminLogin);
        }
    }
}

