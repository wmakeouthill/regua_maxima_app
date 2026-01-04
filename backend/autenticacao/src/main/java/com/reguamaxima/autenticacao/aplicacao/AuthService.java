package com.reguamaxima.autenticacao.aplicacao;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.reguamaxima.autenticacao.dominio.dto.*;
import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.repository.UsuarioRepository;
import com.reguamaxima.kernel.exception.RegraNegocioException;
import com.reguamaxima.kernel.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Serviço de autenticação - orquestra login, registro e refresh de tokens.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${jwt.expiration:86400}")
    private long jwtExpiration;

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

    /**
     * Realiza login do usuário.
     */
    @Transactional
    public AuthResponseDTO login(LoginRequestDTO request) {
        log.info("Tentativa de login: {}", request.email());

        // Buscar usuário
        Usuario usuario = usuarioRepository.findByEmailAndAtivoTrue(request.email())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));

        // Validar senha
        if (!passwordEncoder.matches(request.senha(), usuario.getSenha())) {
            log.warn("Senha incorreta para: {}", request.email());
            throw new BadCredentialsException("Credenciais inválidas");
        }

        // Atualizar último login
        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioRepository.save(usuario);

        // Gerar tokens
        List<String> roles = List.of("ROLE_" + usuario.getRole().name());
        String accessToken = jwtService.generateAccessToken(usuario.getEmail(), roles);
        String refreshToken = jwtService.generateRefreshToken(usuario.getEmail());

        log.info("Login realizado com sucesso: {}", request.email());

        return new AuthResponseDTO(
                accessToken,
                refreshToken,
                jwtExpiration,
                UsuarioDTO.fromEntity(usuario));
    }

    /**
     * Registra novo usuário.
     */
    @Transactional
    public AuthResponseDTO registrar(RegistroRequestDTO request) {
        log.info("Tentativa de registro: {}", request.email());

        // Verificar se email já existe
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RegraNegocioException("Email já cadastrado");
        }

        // Criar usuário
        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .telefone(request.telefone())
                .role(Usuario.Role.USER)
                .ativo(true)
                .build();

        usuario = usuarioRepository.save(usuario);

        // Gerar tokens
        List<String> roles = List.of("ROLE_" + usuario.getRole().name());
        String accessToken = jwtService.generateAccessToken(usuario.getEmail(), roles);
        String refreshToken = jwtService.generateRefreshToken(usuario.getEmail());

        log.info("Registro realizado com sucesso: {}", request.email());

        return new AuthResponseDTO(
                accessToken,
                refreshToken,
                jwtExpiration,
                UsuarioDTO.fromEntity(usuario));
    }

    /**
     * Renova access token usando refresh token.
     */
    @Transactional(readOnly = true)
    public AuthResponseDTO refresh(String refreshToken) {
        // Extrair email do refresh token
        String email = jwtService.extractUsername(refreshToken);

        // Validar refresh token
        if (!jwtService.isTokenValid(refreshToken, email)) {
            throw new BadCredentialsException("Refresh token inválido ou expirado");
        }

        // Buscar usuário
        Usuario usuario = usuarioRepository.findByEmailAndAtivoTrue(email)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado"));

        // Gerar novo access token
        List<String> roles = List.of("ROLE_" + usuario.getRole().name());
        String newAccessToken = jwtService.generateAccessToken(usuario.getEmail(), roles);

        return new AuthResponseDTO(
                newAccessToken,
                refreshToken, // Mantém o mesmo refresh token
                jwtExpiration,
                UsuarioDTO.fromEntity(usuario));
    }

    /**
     * Realiza login com Google OAuth.
     * Valida o token do Google e cria ou atualiza o usuário.
     */
    @Transactional
    public AuthResponseDTO loginGoogle(GoogleLoginRequestDTO request) {
        log.info("Tentativa de login com Google");

        // Validar token do Google
        GoogleIdToken.Payload payload = validarTokenGoogle(request.idToken());

        String email = payload.getEmail();
        String nome = (String) payload.get("name");
        boolean emailVerificado = payload.getEmailVerified();

        log.info("Token Google válido para: {}", email);

        // Buscar ou criar usuário
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseGet(() -> criarUsuarioGoogle(email, nome, emailVerificado));

        // Verificar se usuário está ativo
        if (!usuario.isAtivo()) {
            throw new RegraNegocioException("Conta desativada. Entre em contato com o suporte.");
        }

        // Atualizar último login
        usuario.setUltimoLogin(LocalDateTime.now());
        if (!usuario.isEmailVerificado() && emailVerificado) {
            usuario.setEmailVerificado(true);
        }
        usuarioRepository.save(usuario);

        // Gerar tokens
        List<String> roles = List.of("ROLE_" + usuario.getRole().name());
        String accessToken = jwtService.generateAccessToken(usuario.getEmail(), roles);
        String refreshToken = jwtService.generateRefreshToken(usuario.getEmail());

        log.info("Login com Google realizado com sucesso: {}", email);

        return new AuthResponseDTO(
                accessToken,
                refreshToken,
                jwtExpiration,
                UsuarioDTO.fromEntity(usuario));
    }

    /**
     * Valida o token JWT do Google.
     */
    private GoogleIdToken.Payload validarTokenGoogle(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new BadCredentialsException("Token do Google inválido");
            }

            return idToken.getPayload();
        } catch (Exception e) {
            log.error("Erro ao validar token do Google: {}", e.getMessage());
            throw new BadCredentialsException("Falha ao validar token do Google: " + e.getMessage());
        }
    }

    /**
     * Cria novo usuário a partir dos dados do Google.
     */
    private Usuario criarUsuarioGoogle(String email, String nome, boolean emailVerificado) {
        log.info("Criando novo usuário via Google: {}", email);

        Usuario usuario = Usuario.builder()
                .nome(nome != null ? nome : email.split("@")[0])
                .email(email)
                .senha(passwordEncoder.encode(UUID.randomUUID().toString())) // Senha aleatória
                .role(Usuario.Role.USER)
                .ativo(true)
                .emailVerificado(emailVerificado)
                .build();

        return usuarioRepository.save(usuario);
    }
}
