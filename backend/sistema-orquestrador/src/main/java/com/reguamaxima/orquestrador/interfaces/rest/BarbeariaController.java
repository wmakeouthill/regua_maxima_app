package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.kernel.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoBarbearia;
import com.reguamaxima.orquestrador.dominio.dto.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * Controller REST para operações de Barbearia.
 */
@RestController
@RequestMapping("/api/v1/barbearias")
public class BarbeariaController {

    private final ServicoBarbearia servicoBarbearia;

    public BarbeariaController(ServicoBarbearia servicoBarbearia) {
        this.servicoBarbearia = servicoBarbearia;
    }

    // ==================== ENDPOINTS PÚBLICOS ====================

    /**
     * Lista barbearias com paginação.
     */
    @GetMapping
    public ResponseEntity<Page<BarbeariaResumoDTO>> listar(
            @PageableDefault(size = 20, sort = "avaliacaoMedia", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(servicoBarbearia.listar(pageable));
    }

    /**
     * Busca barbearia por slug.
     */
    @GetMapping("/{slug}")
    public ResponseEntity<BarbeariaDTO> buscarPorSlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(servicoBarbearia.buscarPorSlug(slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Busca barbearias por nome.
     */
    @GetMapping("/busca")
    public ResponseEntity<Page<BarbeariaResumoDTO>> buscarPorNome(
            @RequestParam String nome,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(servicoBarbearia.buscarPorNome(nome, pageable));
    }

    /**
     * Busca barbearias por cidade.
     */
    @GetMapping("/cidade/{cidade}")
    public ResponseEntity<Page<BarbeariaResumoDTO>> buscarPorCidade(
            @PathVariable String cidade,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(servicoBarbearia.buscarPorCidade(cidade, pageable));
    }

    /**
     * Busca barbearias próximas por geolocalização.
     */
    @GetMapping("/proximas")
    public ResponseEntity<List<BarbeariaResumoDTO>> buscarProximas(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Double raioKm) {
        return ResponseEntity.ok(servicoBarbearia.buscarProximas(latitude, longitude, raioKm));
    }

    /**
     * Lista serviços de uma barbearia.
     */
    @GetMapping("/{barbeariaId}/servicos")
    public ResponseEntity<List<ServicoDTO>> listarServicos(@PathVariable Long barbeariaId) {
        return ResponseEntity.ok(servicoBarbearia.listarServicosDaBarbearia(barbeariaId));
    }

    // ==================== ENDPOINTS DE ADMIN ====================

    /**
     * Cria nova barbearia (apenas admin).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> criar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CriarBarbeariaDTO dto) {
        try {
            Long adminId = userDetails.getId();
            BarbeariaDTO barbearia = servicoBarbearia.criar(adminId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(barbearia);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erro", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Busca minha barbearia (admin).
     */
    @GetMapping("/minha")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> buscarMinha(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long adminId = userDetails.getId();
            return ResponseEntity.ok(servicoBarbearia.buscarMinhaBarbearia(adminId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Atualiza minha barbearia (admin).
     */
    @PutMapping("/minha")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> atualizar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AtualizarBarbeariaDTO dto) {
        try {
            Long adminId = userDetails.getId();
            return ResponseEntity.ok(servicoBarbearia.atualizar(adminId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Atualiza tema da minha barbearia (admin).
     */
    @PutMapping("/minha/tema")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> atualizarTema(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BarbeariaTemaDTO tema) {
        try {
            Long adminId = userDetails.getId();
            return ResponseEntity.ok(servicoBarbearia.atualizarTema(adminId, tema));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Desativa minha barbearia (admin).
     */
    @DeleteMapping("/minha")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> desativar(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long adminId = userDetails.getId();
            servicoBarbearia.desativar(adminId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Ativa minha barbearia (admin).
     */
    @PostMapping("/minha/ativar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> ativar(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Long adminId = userDetails.getId();
            servicoBarbearia.ativar(adminId);
            return ResponseEntity.ok(Map.of("mensagem", "Barbearia ativada com sucesso"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ==================== ENDPOINTS DE SERVIÇOS (ADMIN) ====================

    /**
     * Lista meus serviços (admin).
     */
    @GetMapping("/minha/servicos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ServicoDTO>> listarMeusServicos(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long adminId = userDetails.getId();
        return ResponseEntity.ok(servicoBarbearia.listarMeusServicos(adminId));
    }

    /**
     * Adiciona serviço à minha barbearia (admin).
     */
    @PostMapping("/minha/servicos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adicionarServico(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CriarServicoDTO dto) {
        try {
            Long adminId = userDetails.getId();
            ServicoDTO servico = servicoBarbearia.adicionarServico(adminId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(servico);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erro", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Atualiza serviço da minha barbearia (admin).
     */
    @PutMapping("/minha/servicos/{servicoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> atualizarServico(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long servicoId,
            @Valid @RequestBody AtualizarServicoDTO dto) {
        try {
            Long adminId = userDetails.getId();
            return ResponseEntity.ok(servicoBarbearia.atualizarServico(adminId, servicoId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Remove serviço da minha barbearia (admin).
     */
    @DeleteMapping("/minha/servicos/{servicoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removerServico(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long servicoId) {
        try {
            Long adminId = userDetails.getId();
            servicoBarbearia.removerServico(adminId, servicoId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
