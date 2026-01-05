package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para requisição de troca de role.
 */
public record TrocarRoleRequestDTO(
        @NotBlank(message = "Role é obrigatória") String role) {
}
