package com.devtec.sai.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String senha = "";
        String hash = encoder.encode(senha);

        System.out.println("Hash gerado: " + hash);
    }
}