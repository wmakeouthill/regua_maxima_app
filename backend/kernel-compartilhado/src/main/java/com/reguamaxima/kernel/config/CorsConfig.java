package com.reguamaxima.kernel.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuração CORS para permitir requisições do frontend híbrido.
 * Suporta Capacitor (Android/iOS) e desenvolvimento local.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Origens permitidas (Capacitor + desenvolvimento)
        configuration.setAllowedOrigins(List.of(
                "http://localhost", // Dev local
                "http://localhost:4200", // Angular dev server
                "http://localhost:8100", // Ionic dev server
                "https://localhost", // Capacitor Android
                "capacitor://localhost", // Capacitor universal
                "ionic://localhost", // Capacitor iOS
                "http://192.168.0.0/16" // Rede local para testes
        ));

        // Métodos HTTP permitidos
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Headers permitidos
        configuration.setAllowedHeaders(List.of("*"));

        // Headers expostos
        configuration.setExposedHeaders(List.of(
                "Authorization",
                "X-Request-Id",
                "Content-Disposition"));

        // Permite cookies/credentials
        configuration.setAllowCredentials(true);

        // Cache de preflight
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
