package com.devtec.sai.controller;

import com.devtec.sai.dto.AuthenticationDTO;
import com.devtec.sai.dto.LoginResponseDTO;
import com.devtec.sai.dto.RegisterDTO;
import com.devtec.sai.model.Usuario;
import com.devtec.sai.repository.UsuarioRepository;
import com.devtec.sai.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {
    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final TokenService tokenService;


    public AuthenticationController(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthenticationDTO data) {
        try {
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.login(), data.senha());
            var auth = authenticationManager.authenticate(usernamePassword);
            var token = tokenService.gerarToken((Usuario) auth.getPrincipal());
            return ResponseEntity.ok(new LoginResponseDTO(token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody @Valid RegisterDTO data){
        if (usuarioRepository.findByLogin(data.login()) != null){
            return ResponseEntity.badRequest().build();
        }

        String encryptedPassword = new BCryptPasswordEncoder().encode(data.senha());
        Usuario newUser = new Usuario(data.login(), encryptedPassword, data.role());

        usuarioRepository.save(newUser);
        return ResponseEntity.ok().build();
    }
}
