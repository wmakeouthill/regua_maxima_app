package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO para atualização de perfil do usuário.
 */
public record AtualizarPerfilRequestDTO(
        @Size(max = 50, message = "Apelido deve ter no máximo 50 caracteres") String apelido,

        @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres") String telefone) {
}
