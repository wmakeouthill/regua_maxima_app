package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.SessaoTrabalho;
import com.reguamaxima.orquestrador.dominio.enums.StatusSessao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO de SessaoTrabalho para visualização.
 */
public record SessaoTrabalhoDTO(
        Long id,
        Integer numeroSessao,
        Long barbeariaId,
        String barbeariaNome,
        Long usuarioId,
        String usuarioNome,
        StatusSessao status,
        LocalDate dataSessao,
        LocalDateTime dataAbertura,
        LocalDateTime dataFechamento,
        BigDecimal valorAbertura,
        BigDecimal valorFechamento,
        BigDecimal valorTotalVendas,
        Integer quantidadeAtendimentos,
        BigDecimal valorEsperado,
        BigDecimal diferencaCaixa,
        String observacoes) {

    /**
     * Converte entidade para DTO.
     */
    public static SessaoTrabalhoDTO fromEntity(SessaoTrabalho sessao) {
        return new SessaoTrabalhoDTO(
                sessao.getId(),
                sessao.getNumeroSessao(),
                sessao.getBarbearia().getId(),
                sessao.getBarbearia().getNome(),
                sessao.getUsuario().getId(),
                sessao.getUsuario().getNome(),
                sessao.getStatus(),
                sessao.getDataSessao(),
                sessao.getDataAbertura(),
                sessao.getDataFechamento(),
                sessao.getValorAbertura(),
                sessao.getValorFechamento(),
                sessao.getValorTotalVendas(),
                sessao.getQuantidadeAtendimentos(),
                sessao.getValorEsperado(),
                sessao.getDiferencaCaixa(),
                sessao.getObservacoes());
    }
}
