package com.reguamaxima.config;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller para expor configurações públicas ao frontend.
 * Endpoint público, não requer autenticação.
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@Tag(name = "Configuração", description = "Configurações públicas da aplicação")
public class PublicConfigController {

    private final GoogleOAuthProperties googleOAuthProperties;

    /**
     * Retorna configurações públicas necessárias para o frontend.
     * Inclui Google Client ID para OAuth.
     */
    @GetMapping("/public")
    @Operation(summary = "Obter configurações públicas", description = "Retorna configurações públicas como Google Client ID")
    public ResponseEntity<PublicConfigResponse> getPublicConfig() {
        return ResponseEntity.ok(new PublicConfigResponse(
                googleOAuthProperties.getClientId()));
    }

    /**
     * DTO de resposta com configurações públicas.
     */
    public record PublicConfigResponse(
            String googleClientId) {
    }
}
