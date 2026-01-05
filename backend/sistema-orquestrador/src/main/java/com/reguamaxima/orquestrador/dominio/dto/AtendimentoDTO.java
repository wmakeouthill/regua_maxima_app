package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Atendimento;
import com.reguamaxima.orquestrador.dominio.entidade.Atendimento.StatusAtendimento;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO completo de Atendimento para visualização na fila.
 */
public record AtendimentoDTO(
        Long id,
        ClienteResumoDTO cliente,
        ServicoResumoDTO servico,
        Long barbeariaId,
        String barbeariaNome,
        StatusAtendimento status,
        LocalDate dataAtendimento,
        LocalDateTime horaChegada,
        LocalDateTime horaInicioAtendimento,
        LocalDateTime horaFimAtendimento,
        Integer posicaoFila,
        Long tempoEsperaMinutos,
        Long duracaoAtendimentoMinutos,
        String observacoes) {
    /**
     * Converte entidade para DTO.
     */
    public static AtendimentoDTO fromEntity(Atendimento atendimento) {
        return new AtendimentoDTO(
                atendimento.getId(),
                new ClienteResumoDTO(
                        atendimento.getCliente().getId(),
                        atendimento.getCliente().getNome()),
                new ServicoResumoDTO(
                        atendimento.getServico().getId(),
                        atendimento.getServico().getNome(),
                        atendimento.getServico().getDuracaoMinutos()),
                atendimento.getBarbearia() != null ? atendimento.getBarbearia().getId() : null,
                atendimento.getBarbearia() != null ? atendimento.getBarbearia().getNome() : null,
                atendimento.getStatus(),
                atendimento.getDataAtendimento(),
                atendimento.getHoraChegada(),
                atendimento.getHoraInicioAtendimento(),
                atendimento.getHoraFimAtendimento(),
                atendimento.getPosicaoFila(),
                atendimento.getTempoEsperaMinutos(),
                atendimento.getDuracaoAtendimentoMinutos(),
                atendimento.getObservacoes());
    }

    /**
     * DTO resumido de cliente.
     */
    public record ClienteResumoDTO(Long id, String nome) {
    }

    /**
     * DTO resumido de serviço.
     */
    public record ServicoResumoDTO(Long id, String nome, Integer duracaoMinutos) {
    }
}
