package com.reguamaxima.orquestrador.dominio.enums;

/**
 * Status possíveis de uma sessão de trabalho/caixa.
 */
public enum StatusSessao {

    /**
     * Sessão ativa, caixa aberto.
     */
    ABERTA("Aberta"),

    /**
     * Sessão pausada temporariamente.
     */
    PAUSADA("Pausada"),

    /**
     * Sessão finalizada, caixa fechado.
     */
    FECHADA("Fechada");

    private final String descricao;

    StatusSessao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Verifica se a sessão está ativa (pode receber atendimentos).
     */
    public boolean estaAtiva() {
        return this == ABERTA;
    }

    /**
     * Verifica se a sessão pode ser pausada.
     */
    public boolean podeSerPausada() {
        return this == ABERTA;
    }

    /**
     * Verifica se a sessão pode ser retomada.
     */
    public boolean podeSerRetomada() {
        return this == PAUSADA;
    }

    /**
     * Verifica se a sessão pode ser finalizada.
     */
    public boolean podeSerFinalizada() {
        return this == ABERTA || this == PAUSADA;
    }
}
