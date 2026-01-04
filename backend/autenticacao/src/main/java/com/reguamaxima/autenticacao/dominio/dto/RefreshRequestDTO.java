package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para requisição de refresh token.
 */
public record RefreshRequestDTO(
    @NotBlank(message = "Refresh token é obrigatório")
    String refreshToken
) {}
