package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.NotNull;

/**
 * DTO para adicionar cliente na fila de atendimento.
 */
public record CriarAtendimentoDTO(
        @NotNull(message = "ID do cliente é obrigatório") Long clienteId,

        @NotNull(message = "ID do serviço é obrigatório") Long servicoId,

        Long barbeariaId,

        String observacoes) {
}
