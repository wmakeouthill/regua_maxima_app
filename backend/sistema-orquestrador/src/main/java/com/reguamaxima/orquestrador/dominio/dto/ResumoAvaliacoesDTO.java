package com.reguamaxima.orquestrador.dominio.dto;

import java.util.Map;

/**
 * DTO com resumo das avaliações (média, total, distribuição).
 */
public record ResumoAvaliacoesDTO(
        Double mediaNotas,
        Long totalAvaliacoes,
        Map<Integer, Long> distribuicaoNotas // Ex: {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}
) {

    /**
     * Cria resumo vazio (sem avaliações).
     */
    public static ResumoAvaliacoesDTO vazio() {
        return new ResumoAvaliacoesDTO(
                0.0,
                0L,
                Map.of(5, 0L, 4, 0L, 3, 0L, 2, 0L, 1, 0L));
    }
}
