package com.devtec.sai.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHash {
    public static void main(String[] args) {
        if (args.length != 1) {
            System.out.println("Uso: mvnw exec:java -Dexec.mainClass=com.devtec.sai.util.GenerateHash -Dexec.args=\"<senha>\"");
            return;
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(args[0]);

        System.out.println("Hash gerado: " + hash);
    }
}