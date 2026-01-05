package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Agendamento;
import com.reguamaxima.orquestrador.dominio.enums.StatusAgendamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositório para operações com Agendamentos.
 */
@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // ========== Busca por Cliente ==========

    /**
     * Busca agendamentos do cliente ordenados por data/hora.
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.barbeiro b
            JOIN FETCH a.barbearia bar
            JOIN FETCH a.servico s
            WHERE a.cliente.id = :clienteId
            ORDER BY a.data DESC, a.horaInicio DESC
            """)
    List<Agendamento> findByClienteIdOrderByDataDesc(@Param("clienteId") Long clienteId);

    /**
     * Busca agendamentos futuros do cliente.
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.barbeiro b
            JOIN FETCH a.barbearia bar
            JOIN FETCH a.servico s
            WHERE a.cliente.id = :clienteId
            AND (a.data > :hoje OR (a.data = :hoje AND a.horaInicio > :agora))
            AND a.status NOT IN :statusFinalizados
            ORDER BY a.data ASC, a.horaInicio ASC
            """)
    List<Agendamento> findAgendamentosFuturosCliente(
            @Param("clienteId") Long clienteId,
            @Param("hoje") LocalDate hoje,
            @Param("agora") LocalTime agora,
            @Param("statusFinalizados") List<StatusAgendamento> statusFinalizados);

    /**
     * Busca histórico de agendamentos do cliente (concluídos ou cancelados).
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.barbeiro b
            JOIN FETCH a.barbearia bar
            JOIN FETCH a.servico s
            WHERE a.cliente.id = :clienteId
            AND a.status IN :statusFinalizados
            ORDER BY a.data DESC, a.horaInicio DESC
            """)
    Page<Agendamento> findHistoricoCliente(
            @Param("clienteId") Long clienteId,
            @Param("statusFinalizados") List<StatusAgendamento> statusFinalizados,
            Pageable pageable);

    // ========== Busca por Barbeiro ==========

    /**
     * Busca agendamentos do barbeiro para uma data específica.
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.cliente c
            JOIN FETCH a.servico s
            WHERE a.barbeiro.id = :barbeiroId
            AND a.data = :data
            AND a.status NOT IN :statusCancelados
            ORDER BY a.horaInicio ASC
            """)
    List<Agendamento> findByBarbeiroIdAndData(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data,
            @Param("statusCancelados") List<StatusAgendamento> statusCancelados);

    /**
     * Busca agenda do barbeiro (próximos agendamentos).
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.cliente c
            JOIN FETCH a.servico s
            WHERE a.barbeiro.id = :barbeiroId
            AND (a.data > :hoje OR (a.data = :hoje AND a.horaInicio >= :agora))
            AND a.status IN :statusAtivos
            ORDER BY a.data ASC, a.horaInicio ASC
            """)
    List<Agendamento> findAgendaFuturaBarbeiro(
            @Param("barbeiroId") Long barbeiroId,
            @Param("hoje") LocalDate hoje,
            @Param("agora") LocalTime agora,
            @Param("statusAtivos") List<StatusAgendamento> statusAtivos);

    /**
     * Busca próximo agendamento do barbeiro.
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.cliente c
            JOIN FETCH a.servico s
            WHERE a.barbeiro.id = :barbeiroId
            AND a.data = :hoje
            AND a.horaInicio >= :agora
            AND a.status = :status
            ORDER BY a.horaInicio ASC
            LIMIT 1
            """)
    Optional<Agendamento> findProximoAgendamentoBarbeiro(
            @Param("barbeiroId") Long barbeiroId,
            @Param("hoje") LocalDate hoje,
            @Param("agora") LocalTime agora,
            @Param("status") StatusAgendamento status);

    // ========== Busca por Barbearia ==========

    /**
     * Busca agendamentos da barbearia para uma data específica.
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.cliente c
            JOIN FETCH a.barbeiro b
            JOIN FETCH a.servico s
            WHERE a.barbearia.id = :barbeariaId
            AND a.data = :data
            AND a.status NOT IN :statusCancelados
            ORDER BY a.horaInicio ASC, b.usuario.nome ASC
            """)
    List<Agendamento> findByBarbeariaIdAndData(
            @Param("barbeariaId") Long barbeariaId,
            @Param("data") LocalDate data,
            @Param("statusCancelados") List<StatusAgendamento> statusCancelados);

    /**
     * Busca agendamentos pendentes da barbearia (para confirmação).
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.cliente c
            JOIN FETCH a.barbeiro b
            JOIN FETCH a.servico s
            WHERE a.barbearia.id = :barbeariaId
            AND a.status = :status
            ORDER BY a.dataCriacao ASC
            """)
    List<Agendamento> findPendentesBarbearia(
            @Param("barbeariaId") Long barbeariaId,
            @Param("status") StatusAgendamento status);

    // ========== Verificação de Conflitos ==========

    /**
     * Verifica se existe conflito de horário para o barbeiro.
     */
    @Query("""
            SELECT COUNT(a) > 0 FROM Agendamento a
            WHERE a.barbeiro.id = :barbeiroId
            AND a.data = :data
            AND a.status NOT IN :statusCancelados
            AND (
                (a.horaInicio < :horaFim AND a.horaFim > :horaInicio)
            )
            """)
    boolean existeConflitoHorario(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFim") LocalTime horaFim,
            @Param("statusCancelados") List<StatusAgendamento> statusCancelados);

    /**
     * Busca horários ocupados do barbeiro em uma data.
     */
    @Query("""
            SELECT a.horaInicio, a.horaFim FROM Agendamento a
            WHERE a.barbeiro.id = :barbeiroId
            AND a.data = :data
            AND a.status NOT IN :statusCancelados
            ORDER BY a.horaInicio ASC
            """)
    List<Object[]> findHorariosOcupados(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data,
            @Param("statusCancelados") List<StatusAgendamento> statusCancelados);

    // ========== Estatísticas ==========

    /**
     * Conta agendamentos por status do barbeiro.
     */
    @Query("""
            SELECT a.status, COUNT(a) FROM Agendamento a
            WHERE a.barbeiro.id = :barbeiroId
            GROUP BY a.status
            """)
    List<Object[]> countByStatusBarbeiro(@Param("barbeiroId") Long barbeiroId);

    /**
     * Conta agendamentos concluídos hoje do barbeiro.
     */
    @Query("""
            SELECT COUNT(a) FROM Agendamento a
            WHERE a.barbeiro.id = :barbeiroId
            AND a.data = :hoje
            AND a.status = :status
            """)
    long countConcluidosHojeBarbeiro(
            @Param("barbeiroId") Long barbeiroId,
            @Param("hoje") LocalDate hoje,
            @Param("status") StatusAgendamento status);

    /**
     * Conta agendamentos do dia para o barbeiro.
     */
    @Query("""
            SELECT COUNT(a) FROM Agendamento a
            WHERE a.barbeiro.id = :barbeiroId
            AND a.data = :data
            AND a.status NOT IN :statusCancelados
            """)
    long countAgendamentosDia(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data,
            @Param("statusCancelados") List<StatusAgendamento> statusCancelados);

    // ========== Busca com Fetch ==========

    /**
     * Busca agendamento por ID com todos os relacionamentos.
     */
    @Query("""
            SELECT a FROM Agendamento a
            JOIN FETCH a.cliente c
            JOIN FETCH a.barbeiro b
            JOIN FETCH b.usuario bu
            JOIN FETCH a.barbearia bar
            JOIN FETCH a.servico s
            WHERE a.id = :id
            """)
    Optional<Agendamento> findByIdComDetalhes(@Param("id") Long id);
}
