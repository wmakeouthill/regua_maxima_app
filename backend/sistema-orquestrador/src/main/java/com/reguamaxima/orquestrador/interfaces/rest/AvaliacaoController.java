package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.kernel.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoAvaliacao;
import com.reguamaxima.orquestrador.dominio.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST para gerenciamento de avaliações.
 */
@RestController
@RequestMapping("/api/v1/avaliacoes")
@RequiredArgsConstructor
@Slf4j
public class AvaliacaoController {

    private final ServicoAvaliacao servicoAvaliacao;

    // ========== Criar Avaliação ==========

    /**
     * Cria uma nova avaliação.
     * POST /api/v1/avaliacoes
     */
    @PostMapping
    public ResponseEntity<AvaliacaoDTO> criarAvaliacao(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CriarAvaliacaoDTO dto) {

        Long clienteId = userDetails.getId();
        log.info("POST /api/v1/avaliacoes - cliente: {}, tipo: {}", clienteId, dto.tipo());

        AvaliacaoDTO avaliacao = servicoAvaliacao.criarAvaliacao(clienteId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacao);
    }

    // ========== Responder Avaliação ==========

    /**
     * Responde a uma avaliação (admin/barbeiro).
     * POST /api/v1/avaliacoes/{id}/responder
     */
    @PostMapping("/{id}/responder")
    public ResponseEntity<AvaliacaoDTO> responderAvaliacao(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ResponderAvaliacaoDTO dto) {

        Long respondedorId = userDetails.getId();
        log.info("POST /api/v1/avaliacoes/{}/responder - respondedor: {}", id, respondedorId);

        AvaliacaoDTO avaliacao = servicoAvaliacao.responderAvaliacao(id, respondedorId, dto);
        return ResponseEntity.ok(avaliacao);
    }

    // ========== Listar Avaliações - Públicas ==========

    /**
     * Lista avaliações de uma barbearia.
     * GET /api/v1/avaliacoes/barbearias/{barbeariaId}
     */
    @GetMapping("/barbearias/{barbeariaId}")
    public ResponseEntity<Page<AvaliacaoDTO>> listarAvaliacoesBarbearia(
            @PathVariable Long barbeariaId,
            @PageableDefault(size = 10) Pageable pageable) {

        log.info("GET /api/v1/avaliacoes/barbearias/{}", barbeariaId);
        return ResponseEntity.ok(servicoAvaliacao.listarAvaliacoesBarbearia(barbeariaId, pageable));
    }

    /**
     * Lista avaliações de um barbeiro.
     * GET /api/v1/avaliacoes/barbeiros/{barbeiroId}
     */
    @GetMapping("/barbeiros/{barbeiroId}")
    public ResponseEntity<Page<AvaliacaoDTO>> listarAvaliacoesBarbeiro(
            @PathVariable Long barbeiroId,
            @PageableDefault(size = 10) Pageable pageable) {

        log.info("GET /api/v1/avaliacoes/barbeiros/{}", barbeiroId);
        return ResponseEntity.ok(servicoAvaliacao.listarAvaliacoesBarbeiro(barbeiroId, pageable));
    }

    /**
     * Últimas avaliações de uma barbearia (resumo).
     * GET /api/v1/avaliacoes/barbearias/{barbeariaId}/ultimas
     */
    @GetMapping("/barbearias/{barbeariaId}/ultimas")
    public ResponseEntity<List<AvaliacaoDTO>> ultimasAvaliacoesBarbearia(
            @PathVariable Long barbeariaId) {

        return ResponseEntity.ok(servicoAvaliacao.listarUltimasAvaliacoesBarbearia(barbeariaId));
    }

    // ========== Resumo de Avaliações ==========

    /**
     * Resumo das avaliações de uma barbearia.
     * GET /api/v1/avaliacoes/barbearias/{barbeariaId}/resumo
     */
    @GetMapping("/barbearias/{barbeariaId}/resumo")
    public ResponseEntity<ResumoAvaliacoesDTO> resumoBarbearia(@PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoAvaliacao.obterResumoBarbearia(barbeariaId));
    }

    /**
     * Resumo das avaliações de um barbeiro.
     * GET /api/v1/avaliacoes/barbeiros/{barbeiroId}/resumo
     */
    @GetMapping("/barbeiros/{barbeiroId}/resumo")
    public ResponseEntity<ResumoAvaliacoesDTO> resumoBarbeiro(@PathVariable Long barbeiroId) {
        return ResponseEntity.ok(servicoAvaliacao.obterResumoBarbeiro(barbeiroId));
    }

    // ========== Minhas Avaliações (Cliente) ==========

    /**
     * Lista avaliações feitas pelo cliente logado.
     * GET /api/v1/avaliacoes/minhas
     */
    @GetMapping("/minhas")
    public ResponseEntity<List<AvaliacaoDTO>> minhasAvaliacoes(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long clienteId = userDetails.getId();
        log.info("GET /api/v1/avaliacoes/minhas - cliente: {}", clienteId);

        return ResponseEntity.ok(servicoAvaliacao.listarMinhasAvaliacoes(clienteId));
    }

    // ========== Avaliações Pendentes (Admin) ==========

    /**
     * Lista avaliações pendentes de resposta da barbearia do admin.
     * GET /api/v1/avaliacoes/pendentes/{barbeariaId}
     */
    @GetMapping("/pendentes/{barbeariaId}")
    public ResponseEntity<List<AvaliacaoDTO>> pendentesResposta(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeariaId) {

        log.info("GET /api/v1/avaliacoes/pendentes/{}", barbeariaId);
        return ResponseEntity.ok(servicoAvaliacao.listarPendentesResposta(barbeariaId));
    }

    // ========== Verificações ==========

    /**
     * Verifica se agendamento já foi avaliado.
     * GET /api/v1/avaliacoes/agendamentos/{agendamentoId}/avaliado
     */
    @GetMapping("/agendamentos/{agendamentoId}/avaliado")
    public ResponseEntity<Map<String, Object>> verificarAgendamentoAvaliado(
            @PathVariable Long agendamentoId) {

        boolean avaliado = servicoAvaliacao.agendamentoFoiAvaliado(agendamentoId);
        AvaliacaoDTO avaliacao = avaliado ? servicoAvaliacao.buscarAvaliacaoAgendamento(agendamentoId) : null;

        return ResponseEntity.ok(Map.of(
                "avaliado", avaliado,
                "avaliacao", avaliacao != null ? avaliacao : Map.of()));
    }
}
