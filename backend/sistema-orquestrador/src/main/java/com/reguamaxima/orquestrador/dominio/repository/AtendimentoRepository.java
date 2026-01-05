package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Atendimento;
import com.reguamaxima.orquestrador.dominio.entidade.Atendimento.StatusAtendimento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositório para Atendimento.
 */
@Repository
public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {

    // ========== Consultas do Barbeiro ==========

    /**
     * Busca a fila de espera do barbeiro para uma data específica.
     */
    @Query("SELECT a FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.dataAtendimento = :data " +
            "AND a.status = 'AGUARDANDO' " +
            "ORDER BY a.horaChegada ASC")
    List<Atendimento> findFilaEspera(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);

    /**
     * Busca o atendimento atual (em andamento) do barbeiro.
     */
    @Query("SELECT a FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.dataAtendimento = :data " +
            "AND a.status = 'EM_ATENDIMENTO'")
    Optional<Atendimento> findAtendimentoAtual(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);

    /**
     * Conta atendimentos concluídos hoje pelo barbeiro.
     */
    @Query("SELECT COUNT(a) FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.dataAtendimento = :data " +
            "AND a.status = 'CONCLUIDO'")
    Integer countAtendidosHoje(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);

    /**
     * Busca todos os atendimentos do barbeiro em uma data.
     */
    @Query("SELECT a FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.dataAtendimento = :data " +
            "ORDER BY a.horaChegada ASC")
    List<Atendimento> findAllByBarbeiroAndData(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);

    /**
     * Calcula tempo médio de espera do barbeiro na data.
     */
    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, a.horaChegada, a.horaInicioAtendimento)) " +
            "FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.dataAtendimento = :data " +
            "AND a.horaInicioAtendimento IS NOT NULL")
    Double calcularTempoMedioEspera(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);

    /**
     * Calcula tempo médio de atendimento do barbeiro na data.
     */
    @Query("SELECT AVG(TIMESTAMPDIFF(MINUTE, a.horaInicioAtendimento, a.horaFimAtendimento)) " +
            "FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.dataAtendimento = :data " +
            "AND a.horaFimAtendimento IS NOT NULL")
    Double calcularTempoMedioAtendimento(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);

    // ========== Consultas do Cliente ==========

    /**
     * Busca atendimentos do cliente.
     */
    @Query("SELECT a FROM Atendimento a " +
            "WHERE a.cliente.id = :clienteId " +
            "ORDER BY a.dataAtendimento DESC, a.horaChegada DESC")
    Page<Atendimento> findByClienteId(
            @Param("clienteId") Long clienteId,
            Pageable pageable);

    /**
     * Busca atendimento atual do cliente (aguardando ou em atendimento).
     */
    @Query("SELECT a FROM Atendimento a " +
            "WHERE a.cliente.id = :clienteId " +
            "AND a.status IN ('AGUARDANDO', 'EM_ATENDIMENTO') " +
            "ORDER BY a.horaChegada DESC")
    Optional<Atendimento> findAtendimentoAtivoCliente(@Param("clienteId") Long clienteId);

    // ========== Consultas da Barbearia ==========

    /**
     * Busca atendimentos de uma barbearia em uma data.
     */
    @Query("SELECT a FROM Atendimento a " +
            "WHERE a.barbearia.id = :barbeariaId " +
            "AND a.dataAtendimento = :data " +
            "ORDER BY a.horaChegada ASC")
    List<Atendimento> findByBarbeariaAndData(
            @Param("barbeariaId") Long barbeariaId,
            @Param("data") LocalDate data);

    // ========== Verificações ==========

    /**
     * Verifica se barbeiro tem atendimento em andamento.
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM Atendimento a " +
            "WHERE a.barbeiro.id = :barbeiroId " +
            "AND a.status = 'EM_ATENDIMENTO'")
    boolean barbeiroTemAtendimentoEmAndamento(@Param("barbeiroId") Long barbeiroId);

    /**
     * Verifica se cliente está na fila de algum barbeiro.
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM Atendimento a " +
            "WHERE a.cliente.id = :clienteId " +
            "AND a.status IN ('AGUARDANDO', 'EM_ATENDIMENTO')")
    boolean clienteEstaEmFila(@Param("clienteId") Long clienteId);

    // ========== Atualização em Lote ==========

    /**
     * Atualiza posição na fila para todos os atendimentos aguardando.
     */
    @Modifying
    @Query(value = """
            UPDATE atendimentos a
            SET posicao_fila = (
                SELECT COUNT(*) + 1
                FROM atendimentos a2
                WHERE a2.barbeiro_id = a.barbeiro_id
                AND a2.data_atendimento = a.data_atendimento
                AND a2.status = 'AGUARDANDO'
                AND a2.hora_chegada < a.hora_chegada
            )
            WHERE a.barbeiro_id = :barbeiroId
            AND a.data_atendimento = :data
            AND a.status = 'AGUARDANDO'
            """, nativeQuery = true)
    void recalcularPosicoesFila(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data);
}
