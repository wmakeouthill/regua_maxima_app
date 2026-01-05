package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.enums.TipoAvaliacao;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO para criar uma nova avaliação.
 */
public record CriarAvaliacaoDTO(

        @NotNull(message = "O tipo da avaliação é obrigatório") TipoAvaliacao tipo,

        @NotNull(message = "A nota é obrigatória") @Min(value = 1, message = "A nota mínima é 1") @Max(value = 5, message = "A nota máxima é 5") Integer nota,

        @Size(max = 1000, message = "O comentário pode ter no máximo 1000 caracteres") String comentario,

        /**
         * ID da barbearia (obrigatório para tipo BARBEARIA).
         */
        Long barbeariaId,

        /**
         * ID do barbeiro (obrigatório para tipo BARBEIRO).
         */
        Long barbeiroId,

        /**
         * ID do agendamento (obrigatório para tipo ATENDIMENTO).
         */
        Long agendamentoId,

        /**
         * Se a avaliação deve ser anônima.
         */
        Boolean anonima) {

    /**
     * Valida se os dados estão consistentes.
     */
    public boolean isValido() {
        return switch (tipo) {
            case BARBEARIA -> barbeariaId != null;
            case BARBEIRO -> barbeiroId != null;
            case ATENDIMENTO -> agendamentoId != null;
        };
    }

    /**
     * Retorna mensagem de erro se inválido.
     */
    public String getMensagemErro() {
        return switch (tipo) {
            case BARBEARIA -> barbeariaId == null ? "ID da barbearia é obrigatório" : null;
            case BARBEIRO -> barbeiroId == null ? "ID do barbeiro é obrigatório" : null;
            case ATENDIMENTO -> agendamentoId == null ? "ID do agendamento é obrigatório" : null;
        };
    }
}
