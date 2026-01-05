package com.reguamaxima.orquestrador.interfaces.rest;

import com.reguamaxima.kernel.security.CustomUserDetails;
import com.reguamaxima.orquestrador.aplicacao.ServicoFavorito;
import com.reguamaxima.orquestrador.dominio.dto.AdicionarFavoritoDTO;
import com.reguamaxima.orquestrador.dominio.dto.FavoritoDTO;
import com.reguamaxima.orquestrador.dominio.dto.FavoritosIdsDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST para gerenciamento de favoritos do cliente.
 */
@RestController
@RequestMapping("/api/v1/favoritos")
@RequiredArgsConstructor
@Slf4j
public class FavoritoController {

    private final ServicoFavorito servicoFavorito;

    // ========== Adicionar Favorito ==========

    /**
     * Adiciona um item (barbearia ou barbeiro) aos favoritos.
     * POST /api/v1/favoritos
     */
    @PostMapping
    public ResponseEntity<FavoritoDTO> adicionarFavorito(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdicionarFavoritoDTO dto) {

        Long usuarioId = userDetails.getId();
        log.info("POST /api/v1/favoritos - usuário: {}, tipo: {}", usuarioId, dto.tipo());

        FavoritoDTO favorito = servicoFavorito.adicionarFavorito(usuarioId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(favorito);
    }

    // ========== Toggle Favoritos ==========

    /**
     * Alterna favorito de barbearia (adiciona/remove).
     * POST /api/v1/favoritos/barbearias/{barbeariaId}/toggle
     */
    @PostMapping("/barbearias/{barbeariaId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleBarbeariaFavorita(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeariaId) {

        Long usuarioId = userDetails.getId();
        log.info("POST /api/v1/favoritos/barbearias/{}/toggle - usuário: {}", barbeariaId, usuarioId);

        boolean adicionado = servicoFavorito.toggleBarbeariaFavorita(usuarioId, barbeariaId);

        return ResponseEntity.ok(Map.of(
                "favoritado", adicionado,
                "mensagem", adicionado ? "Barbearia adicionada aos favoritos" : "Barbearia removida dos favoritos"));
    }

    /**
     * Alterna favorito de barbeiro (adiciona/remove).
     * POST /api/v1/favoritos/barbeiros/{barbeiroId}/toggle
     */
    @PostMapping("/barbeiros/{barbeiroId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleBarbeiroFavorito(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeiroId) {

        Long usuarioId = userDetails.getId();
        log.info("POST /api/v1/favoritos/barbeiros/{}/toggle - usuário: {}", barbeiroId, usuarioId);

        boolean adicionado = servicoFavorito.toggleBarbeiroFavorito(usuarioId, barbeiroId);

        return ResponseEntity.ok(Map.of(
                "favoritado", adicionado,
                "mensagem", adicionado ? "Barbeiro adicionado aos favoritos" : "Barbeiro removido dos favoritos"));
    }

    // ========== Remover Favoritos ==========

    /**
     * Remove barbearia dos favoritos.
     * DELETE /api/v1/favoritos/barbearias/{barbeariaId}
     */
    @DeleteMapping("/barbearias/{barbeariaId}")
    public ResponseEntity<Void> removerBarbeariaFavorita(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeariaId) {

        Long usuarioId = userDetails.getId();
        log.info("DELETE /api/v1/favoritos/barbearias/{} - usuário: {}", barbeariaId, usuarioId);

        servicoFavorito.removerBarbeariaFavorita(usuarioId, barbeariaId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Remove barbeiro dos favoritos.
     * DELETE /api/v1/favoritos/barbeiros/{barbeiroId}
     */
    @DeleteMapping("/barbeiros/{barbeiroId}")
    public ResponseEntity<Void> removerBarbeiroFavorito(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeiroId) {

        Long usuarioId = userDetails.getId();
        log.info("DELETE /api/v1/favoritos/barbeiros/{} - usuário: {}", barbeiroId, usuarioId);

        servicoFavorito.removerBarbeiroFavorito(usuarioId, barbeiroId);
        return ResponseEntity.noContent().build();
    }

    // ========== Listar Favoritos ==========

    /**
     * Lista todos os favoritos do usuário.
     * GET /api/v1/favoritos
     */
    @GetMapping
    public ResponseEntity<List<FavoritoDTO>> listarFavoritos(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long usuarioId = userDetails.getId();
        log.info("GET /api/v1/favoritos - usuário: {}", usuarioId);

        List<FavoritoDTO> favoritos = servicoFavorito.listarFavoritos(usuarioId);
        return ResponseEntity.ok(favoritos);
    }

    /**
     * Lista barbearias favoritas.
     * GET /api/v1/favoritos/barbearias
     */
    @GetMapping("/barbearias")
    public ResponseEntity<List<FavoritoDTO>> listarBarbeariasFavoritas(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long usuarioId = userDetails.getId();
        log.info("GET /api/v1/favoritos/barbearias - usuário: {}", usuarioId);

        List<FavoritoDTO> favoritos = servicoFavorito.listarBarbeariasFavoritas(usuarioId);
        return ResponseEntity.ok(favoritos);
    }

    /**
     * Lista barbeiros favoritos.
     * GET /api/v1/favoritos/barbeiros
     */
    @GetMapping("/barbeiros")
    public ResponseEntity<List<FavoritoDTO>> listarBarbeirosFavoritos(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long usuarioId = userDetails.getId();
        log.info("GET /api/v1/favoritos/barbeiros - usuário: {}", usuarioId);

        List<FavoritoDTO> favoritos = servicoFavorito.listarBarbeirosFavoritos(usuarioId);
        return ResponseEntity.ok(favoritos);
    }

    // ========== IDs dos Favoritos ==========

    /**
     * Retorna os IDs de todos os itens favoritados.
     * Útil para marcar corações nos cards do frontend.
     * GET /api/v1/favoritos/ids
     */
    @GetMapping("/ids")
    public ResponseEntity<FavoritosIdsDTO> obterIdsFavoritos(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long usuarioId = userDetails.getId();
        log.info("GET /api/v1/favoritos/ids - usuário: {}", usuarioId);

        FavoritosIdsDTO ids = servicoFavorito.obterIdsFavoritos(usuarioId);
        return ResponseEntity.ok(ids);
    }

    // ========== Verificações ==========

    /**
     * Verifica se barbearia está nos favoritos.
     * GET /api/v1/favoritos/barbearias/{barbeariaId}/check
     */
    @GetMapping("/barbearias/{barbeariaId}/check")
    public ResponseEntity<Map<String, Boolean>> verificarBarbeariaFavorita(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeariaId) {

        Long usuarioId = userDetails.getId();
        boolean favoritada = servicoFavorito.isBarbeariaFavoritada(usuarioId, barbeariaId);

        return ResponseEntity.ok(Map.of("favoritada", favoritada));
    }

    /**
     * Verifica se barbeiro está nos favoritos.
     * GET /api/v1/favoritos/barbeiros/{barbeiroId}/check
     */
    @GetMapping("/barbeiros/{barbeiroId}/check")
    public ResponseEntity<Map<String, Boolean>> verificarBarbeiroFavorito(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long barbeiroId) {

        Long usuarioId = userDetails.getId();
        boolean favoritado = servicoFavorito.isBarbeiroFavoritado(usuarioId, barbeiroId);

        return ResponseEntity.ok(Map.of("favoritado", favoritado));
    }
}
