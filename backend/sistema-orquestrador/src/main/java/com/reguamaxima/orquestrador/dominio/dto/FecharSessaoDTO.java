package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * DTO para fechar uma sessão de trabalho.
 */
public record FecharSessaoDTO(
        @NotNull(message = "Valor de fechamento é obrigatório") @PositiveOrZero(message = "Valor de fechamento não pode ser negativo") BigDecimal valorFechamento,

        String observacoes) {
}
