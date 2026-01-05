package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * DTO para abrir uma nova sessão de trabalho.
 */
public record AbrirSessaoDTO(
        @NotNull(message = "Barbearia é obrigatória") Long barbeariaId,

        @NotNull(message = "Valor de abertura é obrigatório") @PositiveOrZero(message = "Valor de abertura não pode ser negativo") BigDecimal valorAbertura,

        String observacoes) {
}
