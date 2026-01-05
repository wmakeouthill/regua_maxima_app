package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.entidade.Favorito;
import com.reguamaxima.orquestrador.dominio.enums.TipoFavorito;

import java.time.LocalDateTime;

/**
 * DTO para exibição de um favorito.
 */
public record FavoritoDTO(
        Long id,
        TipoFavorito tipo,
        Long idFavoritado,
        String nome,
        String foto,
        String descricao,
        LocalDateTime dataCriacao,
        // Campos específicos de barbearia
        String slug,
        String cidade,
        String estado,
        // Campos específicos de barbeiro
        String especialidades,
        Integer anosExperiencia) {

    /**
     * Converte entidade Favorito para DTO.
     */
    public static FavoritoDTO fromEntity(Favorito favorito) {
        if (favorito.getTipo() == TipoFavorito.BARBEARIA && favorito.getBarbearia() != null) {
            var barbearia = favorito.getBarbearia();
            return new FavoritoDTO(
                    favorito.getId(),
                    favorito.getTipo(),
                    barbearia.getId(),
                    barbearia.getNome(),
                    barbearia.getFotoUrl(),
                    barbearia.getDescricao(),
                    favorito.getDataCriacao(),
                    barbearia.getSlug(),
                    barbearia.getCidade(),
                    barbearia.getEstado(),
                    null,
                    null);
        } else if (favorito.getTipo() == TipoFavorito.BARBEIRO && favorito.getBarbeiro() != null) {
            var barbeiro = favorito.getBarbeiro();
            String nome = barbeiro.getNomeProfissional() != null
                    ? barbeiro.getNomeProfissional()
                    : barbeiro.getUsuario().getNome();
            return new FavoritoDTO(
                    favorito.getId(),
                    favorito.getTipo(),
                    barbeiro.getId(),
                    nome,
                    barbeiro.getFotoUrl(),
                    barbeiro.getBio(),
                    favorito.getDataCriacao(),
                    null,
                    null,
                    null,
                    barbeiro.getEspecialidades(),
                    barbeiro.getAnosExperiencia());
        }

        return new FavoritoDTO(
                favorito.getId(),
                favorito.getTipo(),
                null,
                null,
                null,
                null,
                favorito.getDataCriacao(),
                null,
                null,
                null,
                null,
                null);
    }
}
