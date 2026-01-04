package com.reguamaxima.autenticacao.interfaces.rest;

import com.reguamaxima.autenticacao.aplicacao.AuthService;
import com.reguamaxima.autenticacao.dominio.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST para autenticação.
 * Endpoints públicos (não requerem autenticação).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Endpoints de autenticação")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Realiza login", description = "Autentica usuário e retorna tokens JWT")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/login/google")
    @Operation(summary = "Login com Google", description = "Autentica usuário via Google OAuth e retorna tokens JWT")
    public ResponseEntity<AuthResponseDTO> loginGoogle(@Valid @RequestBody GoogleLoginRequestDTO request) {
        return ResponseEntity.ok(authService.loginGoogle(request));
    }

    @PostMapping("/registrar")
    @Operation(summary = "Registra novo usuário", description = "Cria conta e retorna tokens JWT")
    public ResponseEntity<AuthResponseDTO> registrar(@Valid @RequestBody RegistroRequestDTO request) {
        return ResponseEntity.ok(authService.registrar(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renova access token", description = "Usa refresh token para obter novo access token")
    public ResponseEntity<AuthResponseDTO> refresh(@RequestBody RefreshRequestDTO request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }
}
