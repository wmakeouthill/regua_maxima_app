package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.enums.StatusAgendamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO para retorno de dados de Agendamento.
 */
public record AgendamentoDTO(
        Long id,

        // Cliente
        Long clienteId,
        String clienteNome,
        String clienteTelefone,
        String clienteFotoUrl,

        // Barbeiro
        Long barbeiroId,
        String barbeiroNome,
        String barbeiroFotoUrl,

        // Barbearia
        Long barbeariaId,
        String barbeariaNome,
        String barbeariaEndereco,

        // Serviço
        Long servicoId,
        String servicoNome,
        String servicoIcone,
        Integer duracaoMinutos,
        BigDecimal preco,

        // Data/Hora
        LocalDate data,
        LocalTime horaInicio,
        LocalTime horaFim,

        // Status
        StatusAgendamento status,
        String statusDescricao,

        // Observações
        String observacoesCliente,
        String observacoesBarbeiro,
        String motivoCancelamento,

        // Timestamps
        LocalDateTime dataCriacao,
        LocalDateTime dataConfirmacao,
        LocalDateTime dataInicioAtendimento,
        LocalDateTime dataConclusao,
        LocalDateTime dataCancelamento,

        // Flags computadas
        boolean isHoje,
        boolean isFuturo,
        boolean podeCancelar,
        boolean podeConfirmar,
        boolean podeIniciar,
        boolean podeFinalizar) {
    /**
     * Cria DTO a partir da entidade.
     */
    public static AgendamentoDTO fromEntity(com.reguamaxima.orquestrador.dominio.entidade.Agendamento agendamento) {
        var cliente = agendamento.getCliente();
        var barbeiro = agendamento.getBarbeiro();
        var barbearia = agendamento.getBarbearia();
        var servico = agendamento.getServico();

        return new AgendamentoDTO(
                agendamento.getId(),

                // Cliente
                cliente.getId(),
                cliente.getNome(),
                cliente.getTelefone(),
                null, // Usuario não tem fotoUrl por enquanto

                // Barbeiro
                barbeiro.getId(),
                barbeiro.getUsuario() != null ? barbeiro.getUsuario().getNome() : "Barbeiro",
                barbeiro.getFotoUrl(),

                // Barbearia
                barbearia.getId(),
                barbearia.getNome(),
                barbearia.getEnderecoCompleto(),

                // Serviço
                servico.getId(),
                servico.getNome(),
                servico.getIcone(),
                agendamento.getDuracaoMinutos(),
                agendamento.getPreco(),

                // Data/Hora
                agendamento.getData(),
                agendamento.getHoraInicio(),
                agendamento.getHoraFim(),

                // Status
                agendamento.getStatus(),
                agendamento.getStatus().getDescricao(),

                // Observações
                agendamento.getObservacoesCliente(),
                agendamento.getObservacoesBarbeiro(),
                agendamento.getMotivoCancelamento(),

                // Timestamps
                agendamento.getDataCriacao(),
                agendamento.getDataConfirmacao(),
                agendamento.getDataInicioAtendimento(),
                agendamento.getDataConclusao(),
                agendamento.getDataCancelamento(),

                // Flags
                agendamento.isHoje(),
                agendamento.isFuturo(),
                agendamento.getStatus().podeCancelar(),
                agendamento.getStatus().podeConfirmar(),
                agendamento.getStatus().podeIniciar(),
                agendamento.getStatus().podeFinalizar());
    }
}
