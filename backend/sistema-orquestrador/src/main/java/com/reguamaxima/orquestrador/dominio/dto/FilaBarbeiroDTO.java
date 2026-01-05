package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Atendimento.StatusAtendimento;

import java.util.List;

/**
 * DTO com resumo da fila do barbeiro.
 */
public record FilaBarbeiroDTO(
        Long barbeiroId,
        String barbeiroNome,
        AtendimentoDTO atendimentoAtual,
        List<AtendimentoDTO> filaEspera,
        Integer totalAguardando,
        Integer totalAtendidosHoje,
        Long tempoMedioEsperaMinutos,
        Long tempoMedioAtendimentoMinutos) {
    /**
     * Verifica se há atendimento em andamento.
     */
    public boolean isEmAtendimento() {
        return atendimentoAtual != null &&
                atendimentoAtual.status() == StatusAtendimento.EM_ATENDIMENTO;
    }
}
