package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.kernel.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoAtendimento;
import com.reguamaxima.orquestrador.dominio.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller REST para gestão de atendimentos/fila.
 */
@RestController
@RequestMapping("/api/v1/atendimentos")
@RequiredArgsConstructor
@Tag(name = "Atendimentos", description = "Gestão de fila e atendimentos")
public class AtendimentoController {

    private final ServicoAtendimento servicoAtendimento;

    // ========== Endpoints do Barbeiro ==========

    @GetMapping("/minha-fila")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Buscar minha fila de atendimentos de hoje")
    public ResponseEntity<FilaBarbeiroDTO> minhaFila(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoAtendimento.buscarMinhaFila(userDetails.getId()));
    }

    @GetMapping("/fila/{barbeiroId}")
    @Operation(summary = "Buscar fila de um barbeiro específico")
    public ResponseEntity<FilaBarbeiroDTO> filaDoBarbeiro(@PathVariable Long barbeiroId) {
        return ResponseEntity.ok(servicoAtendimento.buscarFilaDoBarbeiro(barbeiroId));
    }

    @PostMapping("/adicionar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Adicionar cliente na fila")
    public ResponseEntity<AtendimentoDTO> adicionarNaFila(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CriarAtendimentoDTO dto) {
        AtendimentoDTO atendimento = servicoAtendimento.adicionarNaFila(userDetails.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(atendimento);
    }

    @PostMapping("/iniciar-proximo")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Iniciar atendimento do próximo cliente da fila")
    public ResponseEntity<AtendimentoDTO> iniciarProximo(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoAtendimento.iniciarProximoAtendimento(userDetails.getId()));
    }

    @PostMapping("/{id}/iniciar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Iniciar atendimento de um cliente específico")
    public ResponseEntity<AtendimentoDTO> iniciarAtendimento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(servicoAtendimento.iniciarAtendimento(userDetails.getId(), id));
    }

    @PostMapping("/finalizar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Finalizar atendimento atual")
    public ResponseEntity<AtendimentoDTO> finalizarAtendimento(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoAtendimento.finalizarAtendimento(userDetails.getId()));
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Cancelar atendimento")
    public ResponseEntity<AtendimentoDTO> cancelarAtendimento(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String motivo = body.getOrDefault("motivo", "Cancelado pelo barbeiro");
        return ResponseEntity.ok(servicoAtendimento.cancelarAtendimento(userDetails.getId(), id, motivo));
    }

    @PostMapping("/{id}/nao-compareceu")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Marcar cliente como não compareceu")
    public ResponseEntity<AtendimentoDTO> marcarNaoCompareceu(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(servicoAtendimento.marcarNaoCompareceu(userDetails.getId(), id));
    }

    // ========== Endpoints do Cliente ==========

    @GetMapping("/meu-atendimento")
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Buscar meu atendimento ativo (se estiver em fila)")
    public ResponseEntity<AtendimentoDTO> meuAtendimentoAtivo(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return servicoAtendimento.buscarMeuAtendimentoAtivo(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/meu-historico")
    @PreAuthorize("hasRole('CLIENTE')")
    @Operation(summary = "Buscar meu histórico de atendimentos")
    public ResponseEntity<Page<AtendimentoDTO>> meuHistorico(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(servicoAtendimento.buscarHistoricoCliente(userDetails.getId(), pageable));
    }

    // ========== Endpoints da Barbearia ==========

    @GetMapping("/barbearia/{barbeariaId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar atendimentos da barbearia por data")
    public ResponseEntity<List<AtendimentoDTO>> atendimentosDaBarbearia(
            @PathVariable Long barbeariaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        LocalDate dataConsulta = data != null ? data : LocalDate.now();
        return ResponseEntity.ok(servicoAtendimento.buscarAtendimentosDaBarbearia(barbeariaId, dataConsulta));
    }
}
