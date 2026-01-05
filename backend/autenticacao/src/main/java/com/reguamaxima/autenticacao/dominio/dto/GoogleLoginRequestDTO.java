package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para requisição de login com Google OAuth.
 * Suporta seleção de role para usuários com múltiplas roles.
 * 
 * @param idToken                   Token JWT retornado pelo Google Sign-In
 * @param roleAtiva                 Role desejada para esta sessão (opcional)
 * @param adicionarRoleSeNaoExistir Se true, adiciona automaticamente a role se
 *                                  não existir
 */
public record GoogleLoginRequestDTO(
        @NotBlank(message = "Token do Google é obrigatório") String idToken,

        String roleAtiva,

        Boolean adicionarRoleSeNaoExistir) {
}
