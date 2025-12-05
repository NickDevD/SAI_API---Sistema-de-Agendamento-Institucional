package com.devtec.sai.config;

import com.devtec.sai.model.Usuario;
import com.devtec.sai.model.UserRole;
import com.devtec.sai.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component // Garante que o Spring encontre e execute esta classe na inicialização
public class DefaultUserSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // O Spring injeta o Repositório e o Encoder configurado no SecurityConfigurations
    public DefaultUserSeeder(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Este método é executado uma vez, logo após a inicialização da aplicação
    @Override
    public void run(String... args) throws Exception {
        try {
            if (usuarioRepository.findByLogin("admin") == null) {
                String senhaCodificada = passwordEncoder.encode("123456");
                Usuario admin = new Usuario("admin", senhaCodificada, UserRole.ADMIN);
                usuarioRepository.save(admin);
                System.out.println("✅ USUÁRIO ADMIN SALVO!");
            }
        } catch (Exception e) {
            // Se falhar, você verá esta exceção no log do Docker.
            System.err.println("❌ ERRO GRAVE ao executar o Seeder: " + e.getMessage());
            e.printStackTrace();
        }
    }
}