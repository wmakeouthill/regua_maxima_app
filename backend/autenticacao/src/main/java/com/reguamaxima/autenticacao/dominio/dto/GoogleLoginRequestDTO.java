package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para requisição de login com Google OAuth.
 * 
 * @param idToken Token JWT retornado pelo Google Sign-In
 */
public record GoogleLoginRequestDTO(
        @NotBlank(message = "Token do Google é obrigatório") String idToken) {
}
