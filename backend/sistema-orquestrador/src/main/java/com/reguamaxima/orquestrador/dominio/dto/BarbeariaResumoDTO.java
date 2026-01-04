package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;

/**
 * DTO resumido de barbearia para listagens.
 */
public record BarbeariaResumoDTO(
        Long id,
        String slug,
        String nome,
        String descricao,
        String cidade,
        String estado,
        String fotoUrl,
        String logoUrl,
        Double avaliacaoMedia,
        Integer totalAvaliacoes,
        Double distanciaKm) {
    /**
     * Cria DTO a partir da entidade.
     */
    public static BarbeariaResumoDTO fromEntity(Barbearia b) {
        return fromEntity(b, null);
    }

    /**
     * Cria DTO a partir da entidade com distância calculada.
     */
    public static BarbeariaResumoDTO fromEntity(Barbearia b, Double distanciaKm) {
        return new BarbeariaResumoDTO(
                b.getId(),
                b.getSlug(),
                b.getNome(),
                b.getDescricao() != null && b.getDescricao().length() > 100
                        ? b.getDescricao().substring(0, 100) + "..."
                        : b.getDescricao(),
                b.getCidade(),
                b.getEstado(),
                b.getFotoUrl(),
                b.getLogoUrl(),
                b.getAvaliacaoMedia(),
                b.getTotalAvaliacoes(),
                distanciaKm != null ? Math.round(distanciaKm * 100.0) / 100.0 : null);
    }
}
