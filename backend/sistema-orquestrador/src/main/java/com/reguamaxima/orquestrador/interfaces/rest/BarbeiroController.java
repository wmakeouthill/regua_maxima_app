package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.compartilhado.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoBarbeiro;
import com.reguamaxima.orquestrador.dominio.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para barbeiros.
 */
@RestController
@RequestMapping("/api/barbeiros")
@RequiredArgsConstructor
@Tag(name = "Barbeiros", description = "Gestão de barbeiros")
public class BarbeiroController {

    private final ServicoBarbeiro servicoBarbeiro;

    // ========== Endpoints Públicos ==========

    @GetMapping("/{id}")
    @Operation(summary = "Buscar barbeiro por ID")
    public ResponseEntity<BarbeiroDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(servicoBarbeiro.buscarPorId(id));
    }

    @GetMapping("/proximos")
    @Operation(summary = "Buscar barbeiros próximos por geolocalização")
    public ResponseEntity<List<BarbeiroResumoDTO>> buscarProximos(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Double raioKm) {
        return ResponseEntity.ok(servicoBarbeiro.buscarProximos(latitude, longitude, raioKm));
    }

    @GetMapping("/buscar")
    @Operation(summary = "Buscar barbeiros por nome ou especialidade")
    public ResponseEntity<Page<BarbeiroResumoDTO>> buscar(
            @RequestParam String termo,
            Pageable pageable) {
        return ResponseEntity.ok(servicoBarbeiro.buscarPorTermo(termo, pageable));
    }

    @GetMapping("/barbearia/{barbeariaId}")
    @Operation(summary = "Listar barbeiros de uma barbearia")
    public ResponseEntity<List<BarbeiroResumoDTO>> listarPorBarbearia(
            @PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoBarbeiro.listarBarbeirosDaBarbearia(barbeariaId, true));
    }

    // ========== Endpoints do Barbeiro ==========

    @GetMapping("/meu-perfil")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Buscar meu perfil de barbeiro")
    public ResponseEntity<BarbeiroDTO> meuPerfil(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoBarbeiro.buscarMeuPerfil(userDetails.getId()));
    }

    @GetMapping("/meu-perfil/existe")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Verificar se possui perfil de barbeiro")
    public ResponseEntity<Boolean> possuiPerfil(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoBarbeiro.possuiPerfil(userDetails.getId()));
    }

    @PostMapping("/meu-perfil")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Criar meu perfil de barbeiro")
    public ResponseEntity<BarbeiroDTO> criarPerfil(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CriarBarbeiroDTO dto) {
        BarbeiroDTO resultado = servicoBarbeiro.criarPerfil(userDetails.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }

    @PutMapping("/meu-perfil")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Atualizar meu perfil de barbeiro")
    public ResponseEntity<BarbeiroDTO> atualizarPerfil(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AtualizarBarbeiroDTO dto) {
        return ResponseEntity.ok(servicoBarbeiro.atualizarPerfil(userDetails.getId(), dto));
    }

    // ========== Vínculo com Barbearia ==========

    @PostMapping("/vinculo/solicitar/{barbeariaId}")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Solicitar vínculo com barbearia")
    public ResponseEntity<BarbeiroDTO> solicitarVinculo(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoBarbeiro.solicitarVinculo(userDetails.getId(), barbeariaId));
    }

    @DeleteMapping("/vinculo/cancelar")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Cancelar solicitação de vínculo pendente")
    public ResponseEntity<BarbeiroDTO> cancelarSolicitacao(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoBarbeiro.cancelarSolicitacao(userDetails.getId()));
    }

    @DeleteMapping("/vinculo")
    @PreAuthorize("hasRole('BARBEIRO')")
    @Operation(summary = "Desvincular-se da barbearia atual")
    public ResponseEntity<BarbeiroDTO> desvincular(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoBarbeiro.desvincular(userDetails.getId()));
    }

    // ========== Endpoints do Admin ==========

    @GetMapping("/admin/meus-barbeiros")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar barbeiros da minha barbearia")
    public ResponseEntity<List<BarbeiroResumoDTO>> meusBarbeiros(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoBarbeiro.listarBarbeirosDaBarbearia(userDetails.getId()));
    }

    @GetMapping("/admin/solicitacoes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar solicitações de vínculo pendentes")
    public ResponseEntity<List<BarbeiroResumoDTO>> solicitacoesPendentes(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(servicoBarbeiro.buscarSolicitacoesPendentes(userDetails.getId()));
    }

    @PostMapping("/admin/aprovar/{barbeiroId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Aprovar solicitação de vínculo")
    public ResponseEntity<BarbeiroDTO> aprovarVinculo(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeiroId) {
        return ResponseEntity.ok(servicoBarbeiro.aprovarVinculo(userDetails.getId(), barbeiroId));
    }

    @PostMapping("/admin/rejeitar/{barbeiroId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rejeitar solicitação de vínculo")
    public ResponseEntity<BarbeiroDTO> rejeitarVinculo(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeiroId) {
        return ResponseEntity.ok(servicoBarbeiro.rejeitarVinculo(userDetails.getId(), barbeiroId));
    }

    @DeleteMapping("/admin/desvincular/{barbeiroId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desvincular barbeiro da minha barbearia")
    public ResponseEntity<Void> desvincularBarbeiro(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeiroId) {
        servicoBarbeiro.desvincularBarbeiro(userDetails.getId(), barbeiroId);
        return ResponseEntity.noContent().build();
    }
}
