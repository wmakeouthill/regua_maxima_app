package com.reguamaxima.autenticacao.dominio.entidade;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Entidade Usuario - implementa UserDetails para integração com Spring
 * Security.
 * Suporta múltiplas roles por usuário.
 */
@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(name = "telefone", length = 20)
    private String telefone;

    /**
     * Roles do usuário (múltiplas permitidas).
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_roles", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /**
     * Role atualmente ativa na sessão.
     * Usada para determinar qual perfil o usuário está usando.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role_ativa", length = 20)
    private Role roleAtiva;

    @Column(name = "ativo", nullable = false)
    @Builder.Default
    private boolean ativo = true;

    @Column(name = "email_verificado", nullable = false)
    @Builder.Default
    private boolean emailVerificado = false;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    /**
     * Foto de perfil em base64 (redimensionada para 200x200).
     */
    @Column(name = "foto_base64", columnDefinition = "TEXT")
    private String fotoBase64;

    /**
     * Apelido/nickname do usuário (opcional).
     * Usado na exibição no lugar do nome completo.
     */
    @Column(name = "apelido", length = 50)
    private String apelido;

    // ========== Métodos de Role ==========

    /**
     * Adiciona uma role ao usuário.
     */
    public void adicionarRole(Role role) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        this.roles.add(role);

        // Se não tem role ativa, define esta como ativa
        if (this.roleAtiva == null) {
            this.roleAtiva = role;
        }
    }

    /**
     * Remove uma role do usuário.
     */
    public void removerRole(Role role) {
        if (this.roles != null) {
            this.roles.remove(role);

            // Se removeu a role ativa, define outra como ativa
            if (role == this.roleAtiva && !this.roles.isEmpty()) {
                this.roleAtiva = this.roles.iterator().next();
            }
        }
    }

    /**
     * Verifica se usuário possui uma role específica.
     */
    public boolean possuiRole(Role role) {
        return this.roles != null && this.roles.contains(role);
    }

    /**
     * Verifica se usuário possui múltiplas roles.
     */
    public boolean possuiMultiplasRoles() {
        return this.roles != null && this.roles.size() > 1;
    }

    /**
     * Define a role ativa (para trocar de perfil).
     */
    public void trocarRoleAtiva(Role role) {
        if (possuiRole(role)) {
            this.roleAtiva = role;
        } else {
            throw new IllegalArgumentException("Usuário não possui a role: " + role);
        }
    }

    // ========== UserDetails Implementation ==========

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Retorna apenas a role ativa como authority principal
        if (roleAtiva != null) {
            return List.of(new SimpleGrantedAuthority("ROLE_" + roleAtiva.name()));
        }

        // Fallback: retorna todas as roles
        if (roles != null && !roles.isEmpty()) {
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return ativo;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return ativo;
    }

    // ========== Lifecycle Callbacks ==========

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ========== Enum Role ==========

    /**
     * Roles disponíveis no sistema.
     * - ADMIN: Dono de barbearia (gestão completa)
     * - CLIENTE: Cliente final (agenda serviços)
     * - BARBEIRO: Profissional barbeiro
     */
    public enum Role {
        ADMIN("Dono de Barbearia"),
        CLIENTE("Cliente"),
        BARBEIRO("Barbeiro");

        private final String descricao;

        Role(String descricao) {
            this.descricao = descricao;
        }

        public String getDescricao() {
            return descricao;
        }
    }
}
