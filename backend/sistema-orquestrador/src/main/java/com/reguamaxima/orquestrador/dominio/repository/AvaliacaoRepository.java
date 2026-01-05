package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Avaliacao;
import com.reguamaxima.orquestrador.dominio.enums.TipoAvaliacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para a entidade Avaliacao.
 */
@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    // ========== Consultas por Barbearia ==========

    /**
     * Lista avaliações visíveis de uma barbearia (paginado).
     */
    @Query("""
            SELECT a FROM Avaliacao a
            JOIN FETCH a.cliente
            WHERE a.barbearia.id = :barbeariaId AND a.visivel = true
            ORDER BY a.dataCriacao DESC
            """)
    Page<Avaliacao> findByBarbeariaIdAndVisivelTrue(
            @Param("barbeariaId") Long barbeariaId,
            Pageable pageable);

    /**
     * Calcula média de notas de uma barbearia.
     */
    @Query("SELECT AVG(a.nota) FROM Avaliacao a WHERE a.barbearia.id = :barbeariaId AND a.visivel = true")
    Double calcularMediaBarbearia(@Param("barbeariaId") Long barbeariaId);

    /**
     * Conta total de avaliações de uma barbearia.
     */
    long countByBarbeariaIdAndVisivelTrue(Long barbeariaId);

    /**
     * Distribução de notas por estrela para uma barbearia.
     */
    @Query("""
            SELECT a.nota, COUNT(a) FROM Avaliacao a
            WHERE a.barbearia.id = :barbeariaId AND a.visivel = true
            GROUP BY a.nota ORDER BY a.nota DESC
            """)
    List<Object[]> distribuicaoNotasBarbearia(@Param("barbeariaId") Long barbeariaId);

    // ========== Consultas por Barbeiro ==========

    /**
     * Lista avaliações visíveis de um barbeiro (paginado).
     */
    @Query("""
            SELECT a FROM Avaliacao a
            JOIN FETCH a.cliente
            WHERE a.barbeiro.id = :barbeiroId AND a.visivel = true
            ORDER BY a.dataCriacao DESC
            """)
    Page<Avaliacao> findByBarbeiroIdAndVisivelTrue(
            @Param("barbeiroId") Long barbeiroId,
            Pageable pageable);

    /**
     * Calcula média de notas de um barbeiro.
     */
    @Query("SELECT AVG(a.nota) FROM Avaliacao a WHERE a.barbeiro.id = :barbeiroId AND a.visivel = true")
    Double calcularMediaBarbeiro(@Param("barbeiroId") Long barbeiroId);

    /**
     * Conta total de avaliações de um barbeiro.
     */
    long countByBarbeiroIdAndVisivelTrue(Long barbeiroId);

    // ========== Consultas por Cliente ==========

    /**
     * Lista avaliações feitas por um cliente.
     */
    @Query("""
            SELECT a FROM Avaliacao a
            LEFT JOIN FETCH a.barbearia
            LEFT JOIN FETCH a.barbeiro b
            LEFT JOIN FETCH b.usuario
            WHERE a.cliente.id = :clienteId
            ORDER BY a.dataCriacao DESC
            """)
    List<Avaliacao> findByClienteId(@Param("clienteId") Long clienteId);

    // ========== Consultas por Agendamento ==========

    /**
     * Busca avaliação de um agendamento.
     */
    Optional<Avaliacao> findByAgendamentoId(Long agendamentoId);

    /**
     * Verifica se já existe avaliação para um agendamento.
     */
    boolean existsByAgendamentoId(Long agendamentoId);

    // ========== Verificações ==========

    /**
     * Verifica se cliente já avaliou barbearia diretamente (não via agendamento).
     */
    boolean existsByClienteIdAndBarbeariaIdAndTipo(Long clienteId, Long barbeariaId, TipoAvaliacao tipo);

    /**
     * Verifica se cliente já avaliou barbeiro diretamente (não via agendamento).
     */
    boolean existsByClienteIdAndBarbeiroIdAndTipo(Long clienteId, Long barbeiroId, TipoAvaliacao tipo);

    // ========== Últimas Avaliações ==========

    /**
     * Últimas avaliações de uma barbearia (para exibição resumida).
     */
    @Query("""
            SELECT a FROM Avaliacao a
            JOIN FETCH a.cliente
            WHERE a.barbearia.id = :barbeariaId AND a.visivel = true
            ORDER BY a.dataCriacao DESC
            LIMIT 5
            """)
    List<Avaliacao> findUltimasAvaliacoesBarbearia(@Param("barbeariaId") Long barbeariaId);

    /**
     * Últimas avaliações de um barbeiro (para exibição resumida).
     */
    @Query("""
            SELECT a FROM Avaliacao a
            JOIN FETCH a.cliente
            WHERE a.barbeiro.id = :barbeiroId AND a.visivel = true
            ORDER BY a.dataCriacao DESC
            LIMIT 5
            """)
    List<Avaliacao> findUltimasAvaliacoesBarbeiro(@Param("barbeiroId") Long barbeiroId);

    // ========== Avaliações Pendentes de Resposta ==========

    /**
     * Avaliações sem resposta de uma barbearia.
     */
    @Query("""
            SELECT a FROM Avaliacao a
            JOIN FETCH a.cliente
            WHERE a.barbearia.id = :barbeariaId AND a.resposta IS NULL AND a.visivel = true
            ORDER BY a.dataCriacao DESC
            """)
    List<Avaliacao> findPendentesRespostaBarbearia(@Param("barbeariaId") Long barbeariaId);
}
