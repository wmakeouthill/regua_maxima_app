package com.reguamaxima.kernel.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UserDetails customizado que inclui ID do usuário.
 * Usado para disponibilizar informações do usuário autenticado nos controllers.
 */
public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final List<String> roles;
    private final boolean enabled;

    public CustomUserDetails(Long id, String email, String password, List<String> roles, boolean enabled) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.roles = roles != null ? roles : List.of();
        this.enabled = enabled;
    }

    /**
     * Cria CustomUserDetails a partir de dados do token JWT.
     */
    public static CustomUserDetails fromJwt(Long id, String email, List<String> roles) {
        return new CustomUserDetails(id, email, null, roles, true);
    }

    /**
     * Retorna o ID do usuário.
     */
    public Long getId() {
        return id;
    }

    /**
     * Retorna o email do usuário.
     */
    public String getEmail() {
        return email;
    }

    /**
     * Retorna as roles do usuário como lista de strings.
     */
    public List<String> getRoles() {
        return roles;
    }

    /**
     * Verifica se o usuário tem uma role específica.
     */
    public boolean hasRole(String role) {
        String normalizedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return roles.contains(normalizedRole) || roles.contains(role);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return password;
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
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public String toString() {
        return "CustomUserDetails{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", roles=" + roles +
                ", enabled=" + enabled +
                '}';
    }
}
