package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.kernel.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoSessaoTrabalho;
import com.reguamaxima.orquestrador.dominio.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller REST para gestão de sessões de trabalho/caixa.
 */
@RestController
@RequestMapping("/api/v1/sessoes-trabalho")
@RequiredArgsConstructor
@Tag(name = "Sessões de Trabalho", description = "Gestão de caixa/sessão da barbearia")
public class SessaoTrabalhoController {

    private final ServicoSessaoTrabalho servicoSessaoTrabalho;

    // ========== Endpoints do Admin ==========

    @PostMapping("/abrir")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Abrir nova sessão de trabalho/caixa")
    public ResponseEntity<SessaoTrabalhoDTO> abrirSessao(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AbrirSessaoDTO dto) {
        SessaoTrabalhoDTO sessao = servicoSessaoTrabalho.abrirSessao(userDetails.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(sessao);
    }

    @PostMapping("/{barbeariaId}/pausar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Pausar sessão ativa (indica temporariamente fechado)")
    public ResponseEntity<SessaoTrabalhoDTO> pausarSessao(@PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoSessaoTrabalho.pausarSessao(barbeariaId));
    }

    @PostMapping("/{barbeariaId}/retomar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Retomar sessão pausada")
    public ResponseEntity<SessaoTrabalhoDTO> retomarSessao(@PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoSessaoTrabalho.retomarSessao(barbeariaId));
    }

    @PostMapping("/{barbeariaId}/fechar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Fechar sessão de trabalho/caixa")
    public ResponseEntity<SessaoTrabalhoDTO> fecharSessao(
            @PathVariable Long barbeariaId,
            @Valid @RequestBody FecharSessaoDTO dto) {
        return ResponseEntity.ok(servicoSessaoTrabalho.fecharSessao(barbeariaId, dto));
    }

    @GetMapping("/{barbeariaId}/ativa")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar sessão ativa da barbearia")
    public ResponseEntity<SessaoTrabalhoDTO> sessaoAtiva(@PathVariable Long barbeariaId) {
        return servicoSessaoTrabalho.buscarSessaoAtiva(barbeariaId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{barbeariaId}/historico")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar histórico de sessões")
    public ResponseEntity<List<SessaoTrabalhoDTO>> historico(
            @PathVariable Long barbeariaId,
            @RequestParam(defaultValue = "10") int limite) {
        return ResponseEntity.ok(servicoSessaoTrabalho.buscarHistorico(barbeariaId, limite));
    }

    @GetMapping("/{barbeariaId}/por-data")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar sessões por data")
    public ResponseEntity<List<SessaoTrabalhoDTO>> porData(
            @PathVariable Long barbeariaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(servicoSessaoTrabalho.buscarPorData(barbeariaId, data));
    }

    // ========== Endpoint Público para Status da Barbearia ==========

    @GetMapping("/status/{barbeariaId}")
    @Operation(summary = "Verificar se barbearia está aberta (endpoint público)")
    public ResponseEntity<StatusBarbeariaDTO> statusBarbearia(@PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoSessaoTrabalho.verificarStatusBarbearia(barbeariaId));
    }

    @GetMapping("/aberta/{barbeariaId}")
    @Operation(summary = "Verificar se barbearia está aberta (retorno simples)")
    public ResponseEntity<Boolean> isBarbeariaAberta(@PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoSessaoTrabalho.isBarbeariaAberta(barbeariaId));
    }
}
