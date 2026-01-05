package com.reguamaxima.orquestrador.dominio.enums;

/**
 * Enum que representa o tipo de entidade que foi favoritada.
 */
public enum TipoFavorito {

    /**
     * Cliente favoritou uma barbearia.
     */
    BARBEARIA("Barbearia"),

    /**
     * Cliente favoritou um barbeiro.
     */
    BARBEIRO("Barbeiro");

    private final String descricao;

    TipoFavorito(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
