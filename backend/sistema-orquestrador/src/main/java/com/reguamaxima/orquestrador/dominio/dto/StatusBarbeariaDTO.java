package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.enums.StatusSessao;

/**
 * DTO público para status da barbearia (sem dados sensíveis).
 */
public record StatusBarbeariaDTO(
        Long barbeariaId,
        String barbeariaNome,
        StatusSessao status,
        boolean aberta,
        String mensagem) {

    /**
     * Cria DTO para barbearia aberta.
     */
    public static StatusBarbeariaDTO aberta(Long id, String nome) {
        return new StatusBarbeariaDTO(id, nome, StatusSessao.ABERTA, true, "Aberto para atendimento");
    }

    /**
     * Cria DTO para barbearia pausada.
     */
    public static StatusBarbeariaDTO pausada(Long id, String nome) {
        return new StatusBarbeariaDTO(id, nome, StatusSessao.PAUSADA, false, "Temporariamente fechado");
    }

    /**
     * Cria DTO para barbearia fechada.
     */
    public static StatusBarbeariaDTO fechada(Long id, String nome) {
        return new StatusBarbeariaDTO(id, nome, StatusSessao.FECHADA, false, "Fechado");
    }
}
