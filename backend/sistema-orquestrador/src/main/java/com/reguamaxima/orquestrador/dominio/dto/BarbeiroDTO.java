package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro;
import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro.StatusVinculo;

import java.time.LocalDateTime;

/**
 * DTO completo de Barbeiro.
 */
public record BarbeiroDTO(
        Long id,
        Long usuarioId,
        String nomeUsuario,
        String emailUsuario,
        String nomeProfissional,
        String nomeExibicao,
        String bio,
        String especialidades,
        Integer anosExperiencia,
        String fotoUrl,
        String portfolioUrls,
        Double latitude,
        Double longitude,
        Boolean visivelMapa,
        String telefone,
        String whatsapp,
        String instagram,
        Long barbeariaId,
        String barbeariaNome,
        StatusVinculo statusVinculo,
        LocalDateTime dataSolicitacaoVinculo,
        Double avaliacaoMedia,
        Integer totalAvaliacoes,
        Integer totalAtendimentos,
        Boolean ativo,
        Boolean perfilCompleto,
        LocalDateTime dataCriacao,
        LocalDateTime dataAtualizacao) {

    /**
     * Converte entidade para DTO.
     */
    public static BarbeiroDTO fromEntity(Barbeiro barbeiro) {
        return new BarbeiroDTO(
                barbeiro.getId(),
                barbeiro.getUsuario() != null ? barbeiro.getUsuario().getId() : null,
                barbeiro.getUsuario() != null ? barbeiro.getUsuario().getNome() : null,
                barbeiro.getUsuario() != null ? barbeiro.getUsuario().getEmail() : null,
                barbeiro.getNomeProfissional(),
                barbeiro.getNomeExibicao(),
                barbeiro.getBio(),
                barbeiro.getEspecialidades(),
                barbeiro.getAnosExperiencia(),
                barbeiro.getFotoUrl(),
                barbeiro.getPortfolioUrls(),
                barbeiro.getLatitude(),
                barbeiro.getLongitude(),
                barbeiro.getVisivelMapa(),
                barbeiro.getTelefone(),
                barbeiro.getWhatsapp(),
                barbeiro.getInstagram(),
                barbeiro.getBarbearia() != null ? barbeiro.getBarbearia().getId() : null,
                barbeiro.getBarbearia() != null ? barbeiro.getBarbearia().getNome() : null,
                barbeiro.getStatusVinculo(),
                barbeiro.getDataSolicitacaoVinculo(),
                barbeiro.getAvaliacaoMedia(),
                barbeiro.getTotalAvaliacoes(),
                barbeiro.getTotalAtendimentos(),
                barbeiro.getAtivo(),
                barbeiro.getPerfilCompleto(),
                barbeiro.getDataCriacao(),
                barbeiro.getDataAtualizacao());
    }
}
