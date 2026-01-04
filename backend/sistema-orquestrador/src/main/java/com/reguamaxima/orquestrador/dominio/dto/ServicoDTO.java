package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Servico;

import java.math.BigDecimal;

/**
 * DTO de serviço para exibição.
 */
public record ServicoDTO(
        Long id,
        String nome,
        String descricao,
        Integer duracaoMinutos,
        String duracaoFormatada,
        BigDecimal preco,
        String precoFormatado,
        String icone,
        Integer ordemExibicao,
        Long barbeariaId,
        String barbeariaNome) {
    /**
     * Cria DTO a partir da entidade.
     */
    public static ServicoDTO fromEntity(Servico s) {
        return new ServicoDTO(
                s.getId(),
                s.getNome(),
                s.getDescricao(),
                s.getDuracaoMinutos(),
                s.getDuracaoFormatada(),
                s.getPreco(),
                s.getPrecoFormatado(),
                s.getIcone(),
                s.getOrdemExibicao(),
                s.getBarbearia() != null ? s.getBarbearia().getId() : null,
                s.getBarbearia() != null ? s.getBarbearia().getNome() : null);
    }
}
