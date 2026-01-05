package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Favorito;
import com.reguamaxima.orquestrador.dominio.enums.TipoFavorito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para a entidade Favorito.
 */
@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    // ========== Consultas por Usuário ==========

    /**
     * Lista todos os favoritos de um usuário (cliente).
     */
    @Query("""
            SELECT f FROM Favorito f
            LEFT JOIN FETCH f.barbearia
            LEFT JOIN FETCH f.barbeiro b
            LEFT JOIN FETCH b.usuario
            WHERE f.usuario.id = :usuarioId
            ORDER BY f.dataCriacao DESC
            """)
    List<Favorito> findByUsuarioId(@Param("usuarioId") Long usuarioId);

    /**
     * Lista favoritos de um usuário por tipo (paginado).
     */
    @Query("""
            SELECT f FROM Favorito f
            LEFT JOIN FETCH f.barbearia
            LEFT JOIN FETCH f.barbeiro b
            LEFT JOIN FETCH b.usuario
            WHERE f.usuario.id = :usuarioId AND f.tipo = :tipo
            ORDER BY f.dataCriacao DESC
            """)
    Page<Favorito> findByUsuarioIdAndTipo(
            @Param("usuarioId") Long usuarioId,
            @Param("tipo") TipoFavorito tipo,
            Pageable pageable);

    /**
     * Lista apenas barbearias favoritadas pelo usuário.
     */
    @Query("""
            SELECT f FROM Favorito f
            JOIN FETCH f.barbearia
            WHERE f.usuario.id = :usuarioId AND f.tipo = 'BARBEARIA'
            ORDER BY f.dataCriacao DESC
            """)
    List<Favorito> findBarbeariasById(@Param("usuarioId") Long usuarioId);

    /**
     * Lista apenas barbeiros favoritados pelo usuário.
     */
    @Query("""
            SELECT f FROM Favorito f
            JOIN FETCH f.barbeiro b
            JOIN FETCH b.usuario
            WHERE f.usuario.id = :usuarioId AND f.tipo = 'BARBEIRO'
            ORDER BY f.dataCriacao DESC
            """)
    List<Favorito> findBarbeirosById(@Param("usuarioId") Long usuarioId);

    // ========== Verificações de Existência ==========

    /**
     * Verifica se usuário já favoritou uma barbearia.
     */
    boolean existsByUsuarioIdAndBarbeariaId(Long usuarioId, Long barbeariaId);

    /**
     * Verifica se usuário já favoritou um barbeiro.
     */
    boolean existsByUsuarioIdAndBarbeiroId(Long usuarioId, Long barbeiroId);

    // ========== Busca Específica ==========

    /**
     * Busca favorito de barbearia do usuário.
     */
    Optional<Favorito> findByUsuarioIdAndBarbeariaId(Long usuarioId, Long barbeariaId);

    /**
     * Busca favorito de barbeiro do usuário.
     */
    Optional<Favorito> findByUsuarioIdAndBarbeiroId(Long usuarioId, Long barbeiroId);

    // ========== Contagens ==========

    /**
     * Conta quantos usuários favoritaram uma barbearia.
     */
    long countByBarbeariaId(Long barbeariaId);

    /**
     * Conta quantos usuários favoritaram um barbeiro.
     */
    long countByBarbeiroId(Long barbeiroId);

    /**
     * Conta total de favoritos de um usuário.
     */
    long countByUsuarioId(Long usuarioId);

    /**
     * Conta favoritos de um usuário por tipo.
     */
    long countByUsuarioIdAndTipo(Long usuarioId, TipoFavorito tipo);

    // ========== Deleção ==========

    /**
     * Remove favorito de barbearia.
     */
    void deleteByUsuarioIdAndBarbeariaId(Long usuarioId, Long barbeariaId);

    /**
     * Remove favorito de barbeiro.
     */
    void deleteByUsuarioIdAndBarbeiroId(Long usuarioId, Long barbeiroId);

    // ========== IDs dos Favoritos (para verificação rápida no frontend) ==========

    /**
     * Lista IDs das barbearias favoritadas pelo usuário.
     */
    @Query("SELECT f.barbearia.id FROM Favorito f WHERE f.usuario.id = :usuarioId AND f.tipo = 'BARBEARIA'")
    List<Long> findBarbeariasIdsByUsuarioId(@Param("usuarioId") Long usuarioId);

    /**
     * Lista IDs dos barbeiros favoritados pelo usuário.
     */
    @Query("SELECT f.barbeiro.id FROM Favorito f WHERE f.usuario.id = :usuarioId AND f.tipo = 'BARBEIRO'")
    List<Long> findBarbeirosIdsByUsuarioId(@Param("usuarioId") Long usuarioId);
}
