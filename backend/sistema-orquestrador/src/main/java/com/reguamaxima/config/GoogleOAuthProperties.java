package com.reguamaxima.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configurações do Google OAuth.
 * Carrega valores do application.yml prefixados com 'google.oauth'.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "google.oauth")
public class GoogleOAuthProperties {

    /**
     * Google Client ID para OAuth.
     * Obtido do Google Cloud Console.
     */
    private String clientId;
}
