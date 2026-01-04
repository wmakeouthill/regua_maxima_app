package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro;
import com.reguamaxima.orquestrador.dominio.entidade.Barbeiro.StatusVinculo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositório para Barbeiro.
 */
@Repository
public interface BarbeiroRepository extends JpaRepository<Barbeiro, Long> {

    /**
     * Busca barbeiro pelo ID do usuário.
     */
    Optional<Barbeiro> findByUsuarioId(Long usuarioId);

    /**
     * Verifica se já existe barbeiro para o usuário.
     */
    boolean existsByUsuarioId(Long usuarioId);

    /**
     * Busca barbeiros de uma barbearia.
     */
    List<Barbeiro> findByBarbeariaIdAndStatusVinculo(Long barbeariaId, StatusVinculo statusVinculo);

    /**
     * Busca barbeiros ativos de uma barbearia (vinculados e aprovados).
     */
    @Query("SELECT b FROM Barbeiro b WHERE b.barbearia.id = :barbeariaId " +
            "AND b.statusVinculo = 'APROVADO' AND b.ativo = true")
    List<Barbeiro> findBarbeirosDaBarbearia(@Param("barbeariaId") Long barbeariaId);

    /**
     * Busca solicitações pendentes de uma barbearia.
     */
    @Query("SELECT b FROM Barbeiro b WHERE b.barbearia.id = :barbeariaId " +
            "AND b.statusVinculo = 'PENDENTE' ORDER BY b.dataSolicitacaoVinculo DESC")
    List<Barbeiro> findSolicitacoesPendentes(@Param("barbeariaId") Long barbeariaId);

    /**
     * Busca barbeiros visíveis no mapa (ativos e com geolocalização).
     */
    @Query("SELECT b FROM Barbeiro b WHERE b.ativo = true AND b.visivelMapa = true " +
            "AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL")
    List<Barbeiro> findBarbeirosVisivelMapa();

    /**
     * Busca barbeiros próximos usando fórmula de Haversine.
     * Retorna barbeiros dentro do raio especificado (em km).
     */
    @Query(value = """
            SELECT b.* FROM barbeiros b
            WHERE b.ativo = true
            AND b.visivel_mapa = true
            AND b.latitude IS NOT NULL
            AND b.longitude IS NOT NULL
            AND (
                6371 * acos(
                    cos(radians(:lat)) * cos(radians(b.latitude)) *
                    cos(radians(b.longitude) - radians(:lng)) +
                    sin(radians(:lat)) * sin(radians(b.latitude))
                )
            ) <= :raioKm
            ORDER BY (
                6371 * acos(
                    cos(radians(:lat)) * cos(radians(b.latitude)) *
                    cos(radians(b.longitude) - radians(:lng)) +
                    sin(radians(:lat)) * sin(radians(b.latitude))
                )
            ) ASC
            """, nativeQuery = true)
    List<Barbeiro> findBarbeirosProximos(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("raioKm") Double raioKm);

    /**
     * Busca barbeiros autônomos (sem vínculo) ativos.
     */
    @Query("SELECT b FROM Barbeiro b WHERE b.ativo = true " +
            "AND (b.statusVinculo = 'SEM_VINCULO' OR b.barbearia IS NULL)")
    List<Barbeiro> findBarbeirosAutonomos();

    /**
     * Busca barbeiros por nome ou especialidade (busca texto).
     */
    @Query("SELECT b FROM Barbeiro b WHERE b.ativo = true " +
            "AND (LOWER(b.nomeProfissional) LIKE LOWER(CONCAT('%', :termo, '%')) " +
            "OR LOWER(b.usuario.nome) LIKE LOWER(CONCAT('%', :termo, '%')) " +
            "OR LOWER(b.especialidades) LIKE LOWER(CONCAT('%', :termo, '%')))")
    Page<Barbeiro> buscarPorTermo(@Param("termo") String termo, Pageable pageable);

    /**
     * Conta barbeiros ativos de uma barbearia.
     */
    @Query("SELECT COUNT(b) FROM Barbeiro b WHERE b.barbearia.id = :barbeariaId " +
            "AND b.statusVinculo = 'APROVADO' AND b.ativo = true")
    long countBarbeirosDaBarbearia(@Param("barbeariaId") Long barbeariaId);

    /**
     * Busca top barbeiros por avaliação.
     */
    @Query("SELECT b FROM Barbeiro b WHERE b.ativo = true AND b.perfilCompleto = true " +
            "AND b.totalAvaliacoes >= :minAvaliacoes ORDER BY b.avaliacaoMedia DESC")
    List<Barbeiro> findTopBarbeiros(@Param("minAvaliacoes") Integer minAvaliacoes, Pageable pageable);
}
