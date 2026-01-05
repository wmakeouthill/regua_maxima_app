package com.reguamaxima.orquestrador.dominio.dto;

/**
 * DTO para cancelamento de agendamento.
 */
public record CancelarAgendamentoDTO(
        /**
         * Motivo do cancelamento (opcional, mas recomendado).
         */
        String motivo) {
}
