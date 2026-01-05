package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para responder uma avaliação.
 */
public record ResponderAvaliacaoDTO(

        @NotBlank(message = "A resposta é obrigatória") @Size(max = 500, message = "A resposta pode ter no máximo 500 caracteres") String resposta) {
}
