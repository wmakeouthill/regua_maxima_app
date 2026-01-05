package com.reguamaxima.orquestrador.dominio.dto;

import java.util.List;

/**
 * DTO que contém os IDs dos itens favoritados pelo usuário.
 * Usado para verificação rápida no frontend (highlight de corações).
 */
public record FavoritosIdsDTO(
        List<Long> barbeariasIds,
        List<Long> barbeirosIds) {

    /**
     * Verifica se uma barbearia está nos favoritos.
     */
    public boolean isBarbeariaFavoritada(Long barbeariaId) {
        return barbeariasIds != null && barbeariasIds.contains(barbeariaId);
    }

    /**
     * Verifica se um barbeiro está nos favoritos.
     */
    public boolean isBarbeiroFavoritado(Long barbeiroId) {
        return barbeirosIds != null && barbeirosIds.contains(barbeiroId);
    }
}
