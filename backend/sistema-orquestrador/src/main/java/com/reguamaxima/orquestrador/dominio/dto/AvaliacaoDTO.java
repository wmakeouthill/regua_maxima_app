package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Avaliacao;
import com.reguamaxima.orquestrador.dominio.enums.TipoAvaliacao;

import java.time.LocalDateTime;

/**
 * DTO para exibição de uma avaliação.
 */
public record AvaliacaoDTO(
        Long id,
        TipoAvaliacao tipo,
        Integer nota,
        String comentario,
        String resposta,
        LocalDateTime dataResposta,
        Boolean anonima,
        LocalDateTime dataCriacao,
        // Dados do cliente
        String nomeCliente,
        String fotoCliente,
        // Dados do avaliado
        Long idAvaliado,
        String nomeAvaliado) {

    /**
     * Converte entidade para DTO.
     */
    public static AvaliacaoDTO fromEntity(Avaliacao avaliacao) {
        String fotoCliente = null;
        if (!Boolean.TRUE.equals(avaliacao.getAnonima()) && avaliacao.getCliente() != null) {
            // Se tiver foto no futuro
            fotoCliente = null;
        }

        Long idAvaliado = null;
        if (avaliacao.getTipo() == TipoAvaliacao.BARBEARIA && avaliacao.getBarbearia() != null) {
            idAvaliado = avaliacao.getBarbearia().getId();
        } else if (avaliacao.getTipo() == TipoAvaliacao.BARBEIRO && avaliacao.getBarbeiro() != null) {
            idAvaliado = avaliacao.getBarbeiro().getId();
        } else if (avaliacao.getTipo() == TipoAvaliacao.ATENDIMENTO && avaliacao.getAgendamento() != null) {
            idAvaliado = avaliacao.getAgendamento().getId();
        }

        return new AvaliacaoDTO(
                avaliacao.getId(),
                avaliacao.getTipo(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getResposta(),
                avaliacao.getDataResposta(),
                avaliacao.getAnonima(),
                avaliacao.getDataCriacao(),
                avaliacao.getNomeCliente(),
                fotoCliente,
                idAvaliado,
                avaliacao.getNomeAvaliado());
    }
}
