package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para requisição de login.
 * Suporta seleção de role ativa para usuários com múltiplas roles.
 */
public record LoginRequestDTO(
        @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "Senha é obrigatória") @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres") String senha,

        /**
         * Role desejada para esta sessão (opcional).
         * Se não informada e usuário tiver múltiplas roles, será solicitada seleção.
         */
        String roleAtiva) {
}
