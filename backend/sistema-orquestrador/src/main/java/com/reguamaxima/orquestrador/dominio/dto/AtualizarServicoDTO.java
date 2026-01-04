package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.math.BigDecimal;

/**
 * DTO para atualização de serviço.
 * Todos os campos são opcionais.
 */
public record AtualizarServicoDTO(
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres") String nome,

        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres") String descricao,

        @Min(value = 5, message = "Duração mínima é 5 minutos") @Max(value = 480, message = "Duração máxima é 480 minutos (8 horas)") Integer duracaoMinutos,

        @Positive(message = "Preço deve ser positivo") BigDecimal preco,

        @Size(max = 50, message = "Ícone deve ter no máximo 50 caracteres") String icone,

        Integer ordemExibicao,

        Boolean ativo) {
}
