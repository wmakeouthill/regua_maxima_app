package com.reguamaxima.autenticacao.dominio.dto;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO para requisição de registro de novo usuário.
 * Inclui o tipo de usuário (ADMIN, CLIENTE, BARBEIRO).
 */
public record RegistroRequestDTO(
        @NotBlank(message = "Nome é obrigatório") @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres") String nome,

        @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "Senha é obrigatória") @Size(min = 6, max = 100, message = "Senha deve ter entre 6 e 100 caracteres") String senha,

        String telefone,

        @NotNull(message = "Tipo de usuário é obrigatório") Usuario.Role tipoUsuario) {
    /**
     * Construtor alternativo para manter compatibilidade (default CLIENTE).
     */
    public RegistroRequestDTO(String nome, String email, String senha, String telefone) {
        this(nome, email, senha, telefone, Usuario.Role.CLIENTE);
    }
}
