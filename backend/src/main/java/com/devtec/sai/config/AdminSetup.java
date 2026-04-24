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
import org.springframework.util.StringUtils;

@Component
public class AdminSetup implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminSetup.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;

    // Allow either ADMIN_LOGIN_LINE (platform-specific) or ADMIN_LOGIN (generic)
    @Value("${ADMIN_LOGIN_LINE:${ADMIN_LOGIN:}}")
    private String adminLogin;

    // Support multiple names for deploy compatibility. ADMIN_PASSWORD_LINE is used in our GCP setup.
    @Value("${ADMIN_PASSWORD_LINE:}")
    private String adminPasswordLine;

    @Value("${ADMIN_PASSWORD_PLAIN:}")
    private String adminPasswordPlain;

    @Value("${ADMIN_PASSWORD_HASH:}")
    private String adminPasswordHash;

    @Autowired
    public AdminSetup(UsuarioRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!StringUtils.hasText(adminLogin)) {
            logger.warn("ADMIN_LOGIN not set - skipping auto-creation of admin user");
            return;
        }

        if (repository.findByLogin(adminLogin) == null) {
            String senhaEncrypted;
            // Priority: ADMIN_PASSWORD_LINE (GCP) -> ADMIN_PASSWORD_PLAIN -> ADMIN_PASSWORD_HASH
            if (StringUtils.hasText(adminPasswordLine)) {
                senhaEncrypted = encoder.encode(adminPasswordLine);
            } else if (StringUtils.hasText(adminPasswordPlain)) {
                senhaEncrypted = encoder.encode(adminPasswordPlain);
            } else if (StringUtils.hasText(adminPasswordHash)) {
                senhaEncrypted = adminPasswordHash;
            } else {
                logger.error("No admin password provided. Set ADMIN_PASSWORD_LINE, ADMIN_PASSWORD_PLAIN or ADMIN_PASSWORD_HASH to enable admin creation. Skipping.");
                return;
            }

            Usuario admin = new Usuario(adminLogin, senhaEncrypted, UserRole.ADMIN);
            repository.save(admin);
            logger.info("✅ Usuário Admin criado com sucesso pelo Java! login={}", adminLogin);
        } else {
            logger.info("Usuário admin já existe. login={}", adminLogin);
        }
    }
}

