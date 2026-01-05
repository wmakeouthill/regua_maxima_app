package com.reguamaxima.autenticacao.dominio.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para atualização de foto de perfil.
 */
public record AtualizarFotoRequestDTO(
        @NotBlank(message = "Foto em base64 é obrigatória") String fotoBase64) {
}
