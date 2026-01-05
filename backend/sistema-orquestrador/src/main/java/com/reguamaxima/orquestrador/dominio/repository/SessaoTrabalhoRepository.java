package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.SessaoTrabalho;
import com.reguamaxima.orquestrador.dominio.enums.StatusSessao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositório para SessaoTrabalho.
 */
@Repository
public interface SessaoTrabalhoRepository extends JpaRepository<SessaoTrabalho, Long> {

    // ========== Consultas de Sessão Ativa ==========

    /**
     * Busca a sessão ativa (ABERTA ou PAUSADA) de uma barbearia.
     */
    @Query("SELECT s FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "AND s.status IN :statusAtivos " +
            "ORDER BY s.dataAbertura DESC")
    Optional<SessaoTrabalho> findSessaoAtiva(
            @Param("barbeariaId") Long barbeariaId,
            @Param("statusAtivos") List<StatusSessao> statusAtivos);

    /**
     * Busca sessão ativa (ABERTA ou PAUSADA) - versão simplificada.
     */
    default Optional<SessaoTrabalho> findSessaoAtiva(Long barbeariaId) {
        return findSessaoAtiva(barbeariaId, List.of(StatusSessao.ABERTA, StatusSessao.PAUSADA));
    }

    /**
     * Verifica se barbearia tem sessão ativa.
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "AND s.status IN ('ABERTA', 'PAUSADA')")
    boolean existsSessaoAtiva(@Param("barbeariaId") Long barbeariaId);

    /**
     * Verifica se barbearia está aberta (status ABERTA).
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "AND s.status = 'ABERTA'")
    boolean isBarbeariaAberta(@Param("barbeariaId") Long barbeariaId);

    // ========== Consultas por Status ==========

    /**
     * Busca sessões por status.
     */
    List<SessaoTrabalho> findByBarbeariaIdAndStatus(Long barbeariaId, StatusSessao status);

    /**
     * Busca sessões por barbearia e data.
     */
    @Query("SELECT s FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "AND s.dataSessao = :data " +
            "ORDER BY s.dataAbertura DESC")
    List<SessaoTrabalho> findByBarbeariaIdAndData(
            @Param("barbeariaId") Long barbeariaId,
            @Param("data") LocalDate data);

    // ========== Histórico ==========

    /**
     * Busca histórico de sessões da barbearia.
     */
    @Query("SELECT s FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "ORDER BY s.dataSessao DESC, s.dataAbertura DESC")
    List<SessaoTrabalho> findHistorico(@Param("barbeariaId") Long barbeariaId);

    /**
     * Busca histórico de sessões com paginação implícita (limit).
     */
    @Query("SELECT s FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "ORDER BY s.dataSessao DESC, s.dataAbertura DESC " +
            "LIMIT :limite")
    List<SessaoTrabalho> findHistoricoLimitado(
            @Param("barbeariaId") Long barbeariaId,
            @Param("limite") int limite);

    // ========== Próximo Número de Sessão ==========

    /**
     * Obtém o próximo número de sessão para a barbearia na data.
     */
    @Query("SELECT COALESCE(MAX(s.numeroSessao), 0) + 1 " +
            "FROM SessaoTrabalho s " +
            "WHERE s.barbearia.id = :barbeariaId " +
            "AND s.dataSessao = :data")
    Integer getProximoNumeroSessao(
            @Param("barbeariaId") Long barbeariaId,
            @Param("data") LocalDate data);
}
