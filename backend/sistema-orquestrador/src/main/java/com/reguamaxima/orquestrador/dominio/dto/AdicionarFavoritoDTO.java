package com.reguamaxima.orquestrador.dominio.dto;

import com.reguamaxima.orquestrador.dominio.enums.TipoFavorito;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para adicionar um item aos favoritos.
 */
public record AdicionarFavoritoDTO(

        @NotNull(message = "O tipo do favorito é obrigatório") TipoFavorito tipo,

        /**
         * ID da barbearia (obrigatório se tipo = BARBEARIA).
         */
        Long barbeariaId,

        /**
         * ID do barbeiro (obrigatório se tipo = BARBEIRO).
         */
        Long barbeiroId) {

    /**
     * Valida se os dados estão consistentes.
     */
    public boolean isValido() {
        if (tipo == TipoFavorito.BARBEARIA) {
            return barbeariaId != null && barbeiroId == null;
        } else if (tipo == TipoFavorito.BARBEIRO) {
            return barbeiroId != null && barbeariaId == null;
        }
        return false;
    }

    /**
     * Retorna mensagem de erro de validação, se houver.
     */
    public String getMensagemErro() {
        if (tipo == TipoFavorito.BARBEARIA && barbeariaId == null) {
            return "O ID da barbearia é obrigatório para favoritos do tipo BARBEARIA";
        }
        if (tipo == TipoFavorito.BARBEIRO && barbeiroId == null) {
            return "O ID do barbeiro é obrigatório para favoritos do tipo BARBEIRO";
        }
        if (tipo == TipoFavorito.BARBEARIA && barbeiroId != null) {
            return "Não informe barbeiro para favoritos do tipo BARBEARIA";
        }
        if (tipo == TipoFavorito.BARBEIRO && barbeariaId != null) {
            return "Não informe barbearia para favoritos do tipo BARBEIRO";
        }
        return null;
    }
}
