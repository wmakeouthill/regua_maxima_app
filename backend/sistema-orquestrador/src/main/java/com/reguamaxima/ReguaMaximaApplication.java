package com.reguamaxima;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principal da aplicação Régua Máxima.
 * <p>
 * Inicia o Spring Boot com Virtual Threads habilitado (configurado via application.yml).
 */
@SpringBootApplication
public class ReguaMaximaApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReguaMaximaApplication.class, args);
    }
}
