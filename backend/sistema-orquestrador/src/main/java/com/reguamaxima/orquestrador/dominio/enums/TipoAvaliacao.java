package com.reguamaxima.orquestrador.dominio.enums;

/**
 * Enum que representa o tipo de avaliação.
 */
public enum TipoAvaliacao {

    /**
     * Avaliação de uma barbearia.
     */
    BARBEARIA("Barbearia"),

    /**
     * Avaliação de um barbeiro.
     */
    BARBEIRO("Barbeiro"),

    /**
     * Avaliação de um atendimento específico.
     */
    ATENDIMENTO("Atendimento");

    private final String descricao;

    TipoAvaliacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
