package com.devtec.sai;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SaiApplication {

	public static void main(String[] args) {

        // Carrega o .env da raiz do projeto (um nivel acima de backend/) para
        // permitir rodar via `mvnw spring-boot:run` sem Docker. Se as variaveis
        // ja vierem do ambiente (ex.: containers), elas nao sao sobrescritas.
        Dotenv dotenv = Dotenv.configure()
                .directory("../")
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(SaiApplication.class, args);
	}

}
