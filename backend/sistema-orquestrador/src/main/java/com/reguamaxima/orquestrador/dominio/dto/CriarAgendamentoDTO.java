package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO para criação de um novo Agendamento.
 */
public record CriarAgendamentoDTO(
        @NotNull(message = "Barbeiro é obrigatório") Long barbeiroId,

        @NotNull(message = "Serviço é obrigatório") Long servicoId,

        @NotNull(message = "Data é obrigatória") @Future(message = "Data deve ser futura") LocalDate data,

        @NotNull(message = "Horário é obrigatório") LocalTime horaInicio,

        /**
         * Observações do cliente (opcional).
         */
        String observacoes) {
}
