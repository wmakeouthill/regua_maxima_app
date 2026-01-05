package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.orquestrador.dominio.enums.TipoFavorito;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entidade Favorito - representa um item favoritado pelo cliente.
 * O cliente pode favoritar barbearias ou barbeiros.
 */
@Entity
@Table(name = "favoritos", uniqueConstraints = {
        @UniqueConstraint(name = "uk_favorito_usuario_barbearia", columnNames = { "usuario_id", "barbearia_id" }),
        @UniqueConstraint(name = "uk_favorito_usuario_barbeiro", columnNames = { "usuario_id", "barbeiro_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Usuário (cliente) que favoritou.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /**
     * Tipo do favorito (BARBEARIA ou BARBEIRO).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoFavorito tipo;

    /**
     * Barbearia favoritada (quando tipo = BARBEARIA).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id")
    private Barbearia barbearia;

    /**
     * Barbeiro favoritado (quando tipo = BARBEIRO).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbeiro_id")
    private Barbeiro barbeiro;

    /**
     * Data/hora que o item foi favoritado.
     */
    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    // ========== Métodos de Domínio ==========

    @PrePersist
    protected void onCreate() {
        this.dataCriacao = LocalDateTime.now();
    }

    /**
     * Valida se o favorito está consistente (tem barbearia OU barbeiro, conforme
     * tipo).
     */
    public boolean isValido() {
        if (tipo == TipoFavorito.BARBEARIA) {
            return barbearia != null && barbeiro == null;
        } else if (tipo == TipoFavorito.BARBEIRO) {
            return barbeiro != null && barbearia == null;
        }
        return false;
    }

    /**
     * Retorna o nome do item favoritado.
     */
    public String getNomeFavoritado() {
        if (tipo == TipoFavorito.BARBEARIA && barbearia != null) {
            return barbearia.getNome();
        } else if (tipo == TipoFavorito.BARBEIRO && barbeiro != null) {
            return barbeiro.getNomeProfissional() != null
                    ? barbeiro.getNomeProfissional()
                    : barbeiro.getUsuario().getNome();
        }
        return null;
    }

    /**
     * Retorna a foto do item favoritado.
     */
    public String getFotoFavoritado() {
        if (tipo == TipoFavorito.BARBEARIA && barbearia != null) {
            return barbearia.getFotoUrl();
        } else if (tipo == TipoFavorito.BARBEIRO && barbeiro != null) {
            return barbeiro.getFotoUrl();
        }
        return null;
    }

    /**
     * Retorna o ID da entidade favoritada.
     */
    public Long getIdFavoritado() {
        if (tipo == TipoFavorito.BARBEARIA && barbearia != null) {
            return barbearia.getId();
        } else if (tipo == TipoFavorito.BARBEIRO && barbeiro != null) {
            return barbeiro.getId();
        }
        return null;
    }
}
