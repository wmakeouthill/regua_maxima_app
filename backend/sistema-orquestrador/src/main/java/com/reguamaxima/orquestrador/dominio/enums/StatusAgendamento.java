package com.reguamaxima.orquestrador.dominio.enums;

/**
 * Status possíveis de um agendamento.
 */
public enum StatusAgendamento {

    /**
     * Agendamento criado, aguardando confirmação do barbeiro/barbearia.
     */
    PENDENTE("Pendente"),

    /**
     * Agendamento confirmado pelo barbeiro/barbearia.
     */
    CONFIRMADO("Confirmado"),

    /**
     * Cliente está sendo atendido.
     */
    EM_ANDAMENTO("Em Andamento"),

    /**
     * Serviço concluído com sucesso.
     */
    CONCLUIDO("Concluído"),

    /**
     * Cancelado pelo cliente.
     */
    CANCELADO_CLIENTE("Cancelado pelo Cliente"),

    /**
     * Cancelado pelo barbeiro.
     */
    CANCELADO_BARBEIRO("Cancelado pelo Barbeiro"),

    /**
     * Cancelado pela barbearia.
     */
    CANCELADO_BARBEARIA("Cancelado pela Barbearia"),

    /**
     * Cliente não compareceu.
     */
    NAO_COMPARECEU("Não Compareceu");

    private final String descricao;

    StatusAgendamento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Verifica se o agendamento está em um status cancelado.
     */
    public boolean isCancelado() {
        return this == CANCELADO_CLIENTE || this == CANCELADO_BARBEIRO || this == CANCELADO_BARBEARIA;
    }

    /**
     * Verifica se o agendamento está finalizado (não pode mais ser alterado).
     */
    public boolean isFinalizado() {
        return this == CONCLUIDO || this == NAO_COMPARECEU || isCancelado();
    }

    /**
     * Verifica se o agendamento pode ser cancelado.
     */
    public boolean podeCancelar() {
        return this == PENDENTE || this == CONFIRMADO;
    }

    /**
     * Verifica se o agendamento pode ser confirmado.
     */
    public boolean podeConfirmar() {
        return this == PENDENTE;
    }

    /**
     * Verifica se o agendamento pode ser iniciado.
     */
    public boolean podeIniciar() {
        return this == CONFIRMADO;
    }

    /**
     * Verifica se o agendamento pode ser finalizado.
     */
    public boolean podeFinalizar() {
        return this == EM_ANDAMENTO;
    }
}
