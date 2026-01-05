package com.reguamaxima.autenticacao.dominio.dto;

/**
 * DTO para resposta de autenticação com tokens.
 * Suporta flag de seleção de perfil para múltiplas roles.
 */
public record AuthResponseDTO(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UsuarioDTO usuario,

        /**
         * Indica se o usuário precisa selecionar um perfil antes de continuar.
         * True quando usuário tem múltiplas roles e não especificou qual usar.
         */
        boolean requerSelecaoPerfil) {
    /**
     * Construtor de compatibilidade (sem requerSelecaoPerfil).
     */
    public AuthResponseDTO(String accessToken, String refreshToken, long expiresIn, UsuarioDTO usuario) {
        this(accessToken, refreshToken, expiresIn, usuario, false);
    }
}
