package com.reguamaxima.autenticacao.dominio.dto;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO para dados públicos do usuário.
 * Inclui todas as roles e role ativa do usuário.
 */
public record UsuarioDTO(
        Long id,
        String nome,
        String email,
        String telefone,
        String fotoBase64,
        List<String> roles,
        String tipoUsuario,
        String tipoUsuarioDescricao,
        boolean emailVerificado,
        LocalDateTime dataCriacao) {
    /**
     * Cria DTO a partir da entidade.
     */
    public static UsuarioDTO fromEntity(Usuario usuario) {
        // Todas as roles do usuário
        List<String> todasRoles = usuario.getRoles().stream()
                .map(r -> "ROLE_" + r.name())
                .collect(Collectors.toList());

        // Role ativa (ou primeira disponível)
        Usuario.Role roleAtiva = usuario.getRoleAtiva();
        if (roleAtiva == null && !usuario.getRoles().isEmpty()) {
            roleAtiva = usuario.getRoles().iterator().next();
        }

        String tipoUsuario = roleAtiva != null ? roleAtiva.name() : "CLIENTE";
        String tipoDescricao = roleAtiva != null ? roleAtiva.getDescricao() : "Cliente";

        return new UsuarioDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getFotoBase64(),
                todasRoles,
                tipoUsuario,
                tipoDescricao,
                usuario.isEmailVerificado(),
                usuario.getDataCriacao());
    }
}
