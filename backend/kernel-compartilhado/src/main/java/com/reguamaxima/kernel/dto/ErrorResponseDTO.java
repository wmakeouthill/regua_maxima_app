package com.reguamaxima.kernel.dto;

import java.time.LocalDateTime;

/**
 * DTO padrão para respostas de erro da API.
 * Usa Record para imutabilidade (Java 25).
 */
public record ErrorResponseDTO(
    int status,
    String error,
    String message,
    String path,
    LocalDateTime timestamp
) {
    /**
     * Construtor com timestamp automático.
     */
    public ErrorResponseDTO(int status, String error, String message, String path) {
        this(status, error, message, path, LocalDateTime.now());
    }
}
