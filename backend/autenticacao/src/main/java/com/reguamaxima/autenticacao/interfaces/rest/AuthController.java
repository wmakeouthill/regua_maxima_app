package com.reguamaxima.autenticacao.interfaces.rest;

import com.reguamaxima.autenticacao.aplicacao.AuthService;
import com.reguamaxima.autenticacao.dominio.dto.*;
import com.reguamaxima.kernel.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST para autenticação.
 * Suporta múltiplas roles por usuário.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de autenticação")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Realiza login", description = "Autentica usuário e retorna tokens JWT. Se usuário tiver múltiplas roles e não informar roleAtiva, retorna requerSelecaoPerfil=true.")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/login/google")
    @Operation(summary = "Login com Google", description = "Autentica usuário via Google OAuth e retorna tokens JWT")
    public ResponseEntity<AuthResponseDTO> loginGoogle(@Valid @RequestBody GoogleLoginRequestDTO request) {
        return ResponseEntity.ok(authService.loginGoogle(request));
    }

    @PostMapping("/registrar")
    @Operation(summary = "Registra novo usuário", description = "Cria conta ou adiciona nova role se email já existe")
    public ResponseEntity<AuthResponseDTO> registrar(@Valid @RequestBody RegistroRequestDTO request) {
        return ResponseEntity.ok(authService.registrar(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renova access token", description = "Usa refresh token para obter novo access token")
    public ResponseEntity<AuthResponseDTO> refresh(@RequestBody RefreshRequestDTO request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/trocar-role")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Troca role ativa", description = "Troca a role/perfil ativo da sessão atual")
    public ResponseEntity<AuthResponseDTO> trocarRole(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody TrocarRoleRequestDTO request) {
        return ResponseEntity.ok(authService.trocarRole(userDetails.getId(), request.role()));
    }

    @PostMapping("/adicionar-role")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Adiciona nova role", description = "Adiciona um novo perfil ao usuário atual")
    public ResponseEntity<AuthResponseDTO> adicionarRole(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody TrocarRoleRequestDTO request) {
        return ResponseEntity.ok(authService.adicionarRole(userDetails.getId(), request.role()));
    }
}
