package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.math.BigDecimal;

/**
 * DTO para criação de novo serviço.
 */
public record CriarServicoDTO(
        @NotBlank(message = "Nome do serviço é obrigatório") @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres") String nome,

        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres") String descricao,

        @NotNull(message = "Duração é obrigatória") @Min(value = 5, message = "Duração mínima é 5 minutos") @Max(value = 480, message = "Duração máxima é 480 minutos (8 horas)") Integer duracaoMinutos,

        @NotNull(message = "Preço é obrigatório") @Positive(message = "Preço deve ser positivo") BigDecimal preco,

        @Size(max = 50, message = "Ícone deve ter no máximo 50 caracteres") String icone,

        Integer ordemExibicao) {
}
