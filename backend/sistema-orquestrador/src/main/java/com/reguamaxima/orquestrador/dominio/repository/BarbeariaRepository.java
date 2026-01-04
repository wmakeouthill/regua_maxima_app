package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Barbearia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositório para operações com Barbearia.
 */
@Repository
public interface BarbeariaRepository extends JpaRepository<Barbearia, Long> {

    /**
     * Busca barbearia por slug.
     */
    Optional<Barbearia> findBySlugAndAtivoTrue(String slug);

    /**
     * Busca barbearia por ID do admin (apenas ativas).
     */
    Optional<Barbearia> findByAdminIdAndAtivoTrue(Long adminId);

    /**
     * Busca barbearia por ID do admin (incluindo inativas).
     */
    Optional<Barbearia> findByAdminId(Long adminId);

    /**
     * Verifica se admin já possui barbearia.
     */
    boolean existsByAdminId(Long adminId);

    /**
     * Lista barbearias ativas (simples).
     */
    Page<Barbearia> findByAtivoTrue(Pageable pageable);

    /**
     * Verifica se slug já existe.
     */
    boolean existsBySlug(String slug);

    /**
     * Lista barbearias ativas com paginação.
     */
    Page<Barbearia> findByAtivoTrueOrderByAvaliacaoMediaDesc(Pageable pageable);

    /**
     * Busca barbearias por nome (like).
     */
    @Query("SELECT b FROM Barbearia b WHERE b.ativo = true AND LOWER(b.nome) LIKE LOWER(CONCAT('%', :termo, '%'))")
    Page<Barbearia> buscarPorNome(@Param("termo") String termo, Pageable pageable);

    /**
     * Busca barbearias por cidade.
     */
    @Query("SELECT b FROM Barbearia b WHERE b.ativo = true AND LOWER(b.cidade) = LOWER(:cidade)")
    Page<Barbearia> findByCidade(@Param("cidade") String cidade, Pageable pageable);

    /**
     * Busca barbearias próximas usando fórmula de Haversine.
     * Retorna barbearias dentro do raio especificado (em km).
     * Retorna Object[] onde [0] = Barbearia e [1] = distância em km.
     */
    @Query(value = """
            SELECT b,
                (6371 * acos(cos(radians(:latitude)) * cos(radians(b.latitude))
                * cos(radians(b.longitude) - radians(:longitude))
                + sin(radians(:latitude)) * sin(radians(b.latitude)))) AS distancia
            FROM Barbearia b
            WHERE b.ativo = true
                AND b.latitude IS NOT NULL
                AND b.longitude IS NOT NULL
                AND (6371 * acos(cos(radians(:latitude)) * cos(radians(b.latitude))
                    * cos(radians(b.longitude) - radians(:longitude))
                    + sin(radians(:latitude)) * sin(radians(b.latitude)))) <= :raioKm
            ORDER BY distancia
            """)
    List<Object[]> findProximas(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("raioKm") Double raioKm);

    /**
     * Conta total de barbearias ativas.
     */
    long countByAtivoTrue();
}
