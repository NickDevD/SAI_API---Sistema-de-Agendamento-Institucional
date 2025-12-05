package com.devtec.sai.service;

import com.devtec.sai.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService implements UserDetailsService {
    private final UsuarioRepository repository;

    public AuthorizationService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String nomeUsuario) throws UsernameNotFoundException {
        // Obter o Usuario (retorna null se não encontrar, assumindo a definição do repositório)
        UserDetails usuario = repository.findByLogin(nomeUsuario);

        if (usuario == null) {
            throw new UsernameNotFoundException("Usuário " + nomeUsuario + " não encontrado.");
        }

        return usuario;
    }

}
