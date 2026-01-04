package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO completo de Barbearia com todos os dados.
 */
public record BarbeariaDTO(
        Long id,
        String slug,
        String nome,
        String descricao,
        String endereco,
        String cidade,
        String estado,
        String cep,
        Double latitude,
        Double longitude,
        String telefone,
        String whatsapp,
        String email,
        String instagram,
        String fotoUrl,
        String bannerUrl,
        String logoUrl,
        String temaConfig,
        Long adminId,
        String adminNome,
        Boolean ativo,
        Double avaliacaoMedia,
        Integer totalAvaliacoes,
        LocalDateTime dataCriacao,
        List<ServicoDTO> servicos) {
    /**
     * Cria DTO a partir da entidade (sem serviços).
     */
    public static BarbeariaDTO fromEntity(Barbearia b) {
        return fromEntity(b, null);
    }

    /**
     * Cria DTO a partir da entidade com serviços.
     */
    public static BarbeariaDTO fromEntity(Barbearia b, List<ServicoDTO> servicos) {
        return new BarbeariaDTO(
                b.getId(),
                b.getSlug(),
                b.getNome(),
                b.getDescricao(),
                b.getEndereco(),
                b.getCidade(),
                b.getEstado(),
                b.getCep(),
                b.getLatitude(),
                b.getLongitude(),
                b.getTelefone(),
                b.getWhatsapp(),
                b.getEmail(),
                b.getInstagram(),
                b.getFotoUrl(),
                b.getBannerUrl(),
                b.getLogoUrl(),
                b.getTemaConfig(),
                b.getAdmin() != null ? b.getAdmin().getId() : null,
                b.getAdmin() != null ? b.getAdmin().getNome() : null,
                b.getAtivo(),
                b.getAvaliacaoMedia(),
                b.getTotalAvaliacoes(),
                b.getDataCriacao(),
                servicos);
    }
}
