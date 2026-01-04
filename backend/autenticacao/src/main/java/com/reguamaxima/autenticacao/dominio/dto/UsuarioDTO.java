package com.reguamaxima.autenticacao.dominio.dto;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para dados públicos do usuário.
 */
public record UsuarioDTO(
    Long id,
    String nome,
    String email,
    String telefone,
    List<String> roles,
    boolean emailVerificado,
    LocalDateTime dataCriacao
) {
    /**
     * Cria DTO a partir da entidade.
     */
    public static UsuarioDTO fromEntity(Usuario usuario) {
        return new UsuarioDTO(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getTelefone(),
            List.of("ROLE_" + usuario.getRole().name()),
            usuario.isEmailVerificado(),
            usuario.getDataCriacao()
        );
    }
}
