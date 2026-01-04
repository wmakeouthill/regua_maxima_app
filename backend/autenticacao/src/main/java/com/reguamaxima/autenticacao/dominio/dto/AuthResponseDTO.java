package com.reguamaxima.autenticacao.dominio.dto;

/**
 * DTO para resposta de autenticação com tokens.
 */
public record AuthResponseDTO(
    String accessToken,
    String refreshToken,
    long expiresIn,
    UsuarioDTO usuario
) {}
