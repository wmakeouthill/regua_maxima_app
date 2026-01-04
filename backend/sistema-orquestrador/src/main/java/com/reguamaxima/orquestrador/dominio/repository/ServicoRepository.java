package com.reguamaxima.orquestrador.dominio.repository;

import com.reguamaxima.orquestrador.dominio.entidade.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositório para operações com Servico.
 */
@Repository
public interface ServicoRepository extends JpaRepository<Servico, Long> {

    /**
     * Lista serviços ativos de uma barbearia ordenados por ordem de exibição.
     */
    List<Servico> findByBarbeariaIdAndAtivoTrueOrderByOrdemExibicaoAsc(Long barbeariaId);

    /**
     * Lista todos os serviços de uma barbearia (ativos e inativos).
     */
    List<Servico> findByBarbeariaIdOrderByOrdemExibicaoAsc(Long barbeariaId);

    /**
     * Conta serviços ativos de uma barbearia.
     */
    long countByBarbeariaIdAndAtivoTrue(Long barbeariaId);

    /**
     * Verifica se existe serviço com mesmo nome na barbearia.
     */
    boolean existsByBarbeariaIdAndNomeIgnoreCase(Long barbeariaId, String nome);
}
