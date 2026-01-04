package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro;

/**
 * DTO resumido de Barbeiro para listagens e mapa.
 */
public record BarbeiroResumoDTO(
        Long id,
        String nome,
        String fotoUrl,
        String especialidades,
        Double latitude,
        Double longitude,
        Double avaliacaoMedia,
        Integer totalAvaliacoes,
        Boolean vinculado,
        Long barbeariaId,
        String barbeariaNome) {

    /**
     * Converte entidade para DTO resumido.
     */
    public static BarbeiroResumoDTO fromEntity(Barbeiro barbeiro) {
        return new BarbeiroResumoDTO(
                barbeiro.getId(),
                barbeiro.getNomeExibicao(),
                barbeiro.getFotoUrl(),
                barbeiro.getEspecialidades(),
                barbeiro.getLatitude(),
                barbeiro.getLongitude(),
                barbeiro.getAvaliacaoMedia(),
                barbeiro.getTotalAvaliacoes(),
                barbeiro.isVinculado(),
                barbeiro.getBarbearia() != null ? barbeiro.getBarbearia().getId() : null,
                barbeiro.getBarbearia() != null ? barbeiro.getBarbearia().getNome() : null);
    }
}
