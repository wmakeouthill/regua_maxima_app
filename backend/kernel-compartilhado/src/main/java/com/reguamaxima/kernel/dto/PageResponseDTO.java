package com.reguamaxima.kernel.dto;

import java.util.List;

/**
 * DTO para respostas paginadas.
 * Usa Record para imutabilidade.
 *
 * @param <T> Tipo dos elementos da página
 */
public record PageResponseDTO<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    /**
     * Construtor simplificado calculando first/last automaticamente.
     */
    public PageResponseDTO(List<T> content, int page, int size, long totalElements) {
        this(
            content,
            page,
            size,
            totalElements,
            (int) Math.ceil((double) totalElements / size),
            page == 0,
            page >= (int) Math.ceil((double) totalElements / size) - 1
        );
    }
}
