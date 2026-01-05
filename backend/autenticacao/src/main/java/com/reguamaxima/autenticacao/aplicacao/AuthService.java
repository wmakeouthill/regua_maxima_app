package com.reguamaxima.autenticacao.aplicacao;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.reguamaxima.autenticacao.dominio.dto.*;
import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.autenticacao.dominio.entidade.Usuario.Role;
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
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de autenticação - orquestra login, registro e refresh de tokens.
 * Suporta múltiplas roles por usuário com seleção de perfil ativo.
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
     * Se roleAtiva não for especificada e usuário tiver múltiplas roles,
     * retorna resposta com flag indicando necessidade de seleção.
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

        // Verificar se precisa selecionar role
        Role roleDesejada = parseRole(request.roleAtiva());

        if (roleDesejada != null) {
            // Validar se usuário possui a role desejada
            if (!usuario.possuiRole(roleDesejada)) {
                // Se flag adicionarRoleSeNaoExistir estiver true, adiciona a role
                if (Boolean.TRUE.equals(request.adicionarRoleSeNaoExistir())) {
                    usuario.adicionarRole(roleDesejada);
                    log.info("Role {} adicionada automaticamente ao usuário: {}", roleDesejada, request.email());
                } else {
                    throw new BadCredentialsException("Você não possui acesso como " + roleDesejada.getDescricao());
                }
            }
            usuario.setRoleAtiva(roleDesejada);
        } else if (usuario.possuiMultiplasRoles()) {
            // Usuário tem múltiplas roles e não especificou qual usar
            // Retorna resposta especial para seleção de perfil
            return criarRespostaSelecionarPerfil(usuario);
        } else {
            // Única role, usa ela como ativa
            if (!usuario.getRoles().isEmpty()) {
                usuario.setRoleAtiva(usuario.getRoles().iterator().next());
            }
        }

        // Atualizar último login e salvar
        usuario.setUltimoLogin(LocalDateTime.now());
        usuarioRepository.save(usuario);

        return gerarTokens(usuario);
    }

    /**
     * Troca a role ativa do usuário (sem precisar relogar).
     */
    @Transactional
    public AuthResponseDTO trocarRole(Long usuarioId, String roleNome) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado"));

        Role novaRole = parseRole(roleNome);
        if (novaRole == null) {
            throw new RegraNegocioException("Role inválida: " + roleNome);
        }

        usuario.trocarRoleAtiva(novaRole);
        usuarioRepository.save(usuario);

        log.info("Role trocada para {} - usuário: {}", novaRole, usuario.getEmail());

        return gerarTokens(usuario);
    }

    /**
     * Adiciona uma nova role ao usuário existente.
     */
    @Transactional
    public AuthResponseDTO adicionarRole(Long usuarioId, String roleNome) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado"));

        Role novaRole = parseRole(roleNome);
        if (novaRole == null) {
            throw new RegraNegocioException("Role inválida: " + roleNome);
        }

        if (usuario.possuiRole(novaRole)) {
            throw new RegraNegocioException("Você já possui o perfil de " + novaRole.getDescricao());
        }

        usuario.adicionarRole(novaRole);
        usuario.setRoleAtiva(novaRole); // Ativa a nova role
        usuarioRepository.save(usuario);

        log.info("Role {} adicionada ao usuário: {}", novaRole, usuario.getEmail());

        return gerarTokens(usuario);
    }

    /**
     * Registra novo usuário com tipo especificado.
     * Ou adiciona nova role se usuário já existe.
     */
    @Transactional
    public AuthResponseDTO registrar(RegistroRequestDTO request) {
        log.info("Tentativa de registro: {} como {}", request.email(), request.tipoUsuario());

        Role roleDesejada = request.tipoUsuario() != null ? request.tipoUsuario() : Role.CLIENTE;

        // Verificar se email já existe
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmail(request.email());

        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();

            // Se já tem a role, erro
            if (usuario.possuiRole(roleDesejada)) {
                throw new RegraNegocioException("Você já possui cadastro como " + roleDesejada.getDescricao());
            }

            // Adiciona a nova role ao usuário existente
            usuario.adicionarRole(roleDesejada);
            usuario.setRoleAtiva(roleDesejada);
            usuarioRepository.save(usuario);

            log.info("Role {} adicionada ao usuário existente: {}", roleDesejada, request.email());

            return gerarTokens(usuario);
        }

        // Criar novo usuário
        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .telefone(request.telefone())
                .roles(new HashSet<>(Set.of(roleDesejada)))
                .roleAtiva(roleDesejada)
                .ativo(true)
                .build();

        usuario = usuarioRepository.save(usuario);

        log.info("Registro realizado com sucesso: {} como {}", request.email(), roleDesejada);

        return gerarTokens(usuario);
    }

    /**
     * Renova access token usando refresh token.
     */
    @Transactional(readOnly = true)
    public AuthResponseDTO refresh(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);

        if (!jwtService.isTokenValid(refreshToken, email)) {
            throw new BadCredentialsException("Refresh token inválido ou expirado");
        }

        Usuario usuario = usuarioRepository.findByEmailAndAtivoTrue(email)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado"));

        return gerarTokens(usuario);
    }

    /**
     * Realiza login com Google OAuth.
     */
    @Transactional
    public AuthResponseDTO loginGoogle(GoogleLoginRequestDTO request) {
        log.info("Tentativa de login com Google");

        GoogleIdToken.Payload payload = validarTokenGoogle(request.idToken());

        String email = payload.getEmail();
        String nome = (String) payload.get("name");
        boolean emailVerificado = payload.getEmailVerified();

        log.info("Token Google válido para: {}", email);

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseGet(() -> criarUsuarioGoogle(email, nome, emailVerificado));

        if (!usuario.isAtivo()) {
            throw new RegraNegocioException("Conta desativada. Entre em contato com o suporte.");
        }

        // Verificar se precisa selecionar role
        Role roleDesejada = parseRole(request.roleAtiva());

        if (roleDesejada != null) {
            if (!usuario.possuiRole(roleDesejada)) {
                // Se flag adicionarRoleSeNaoExistir estiver true, adiciona a role
                if (Boolean.TRUE.equals(request.adicionarRoleSeNaoExistir())) {
                    usuario.adicionarRole(roleDesejada);
                    log.info("Role {} adicionada automaticamente ao usuário Google: {}", roleDesejada, email);
                } else {
                    throw new BadCredentialsException("Você não possui acesso como " + roleDesejada.getDescricao());
                }
            }
            usuario.setRoleAtiva(roleDesejada);
        } else if (usuario.possuiMultiplasRoles()) {
            return criarRespostaSelecionarPerfil(usuario);
        }

        usuario.setUltimoLogin(LocalDateTime.now());
        if (!usuario.isEmailVerificado() && emailVerificado) {
            usuario.setEmailVerificado(true);
        }
        usuarioRepository.save(usuario);

        log.info("Login com Google realizado com sucesso: {}", email);

        return gerarTokens(usuario);
    }

    /**
     * Atualiza foto de perfil do usuário.
     */
    @Transactional
    public void atualizarFoto(Long usuarioId, String fotoBase64) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado"));

        usuario.setFotoBase64(fotoBase64);
        usuarioRepository.save(usuario);

        log.info("Foto atualizada para usuário: {}", usuario.getEmail());
    }

    /**
     * Busca dados do usuário.
     */
    @Transactional(readOnly = true)
    public UsuarioDTO buscarUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RegraNegocioException("Usuário não encontrado"));

        return UsuarioDTO.fromEntity(usuario);
    }

    // ========== Métodos Auxiliares ==========

    private AuthResponseDTO gerarTokens(Usuario usuario) {
        List<String> todasRoles = usuario.getRoles().stream()
                .map(r -> "ROLE_" + r.name())
                .collect(Collectors.toList());

        String roleAtiva = usuario.getRoleAtiva() != null
                ? "ROLE_" + usuario.getRoleAtiva().name()
                : (todasRoles.isEmpty() ? "ROLE_CLIENTE" : todasRoles.get(0));

        // Token contém apenas a role ativa para autorização
        String accessToken = jwtService.generateAccessToken(
                usuario.getId(),
                usuario.getEmail(),
                List.of(roleAtiva));
        String refreshToken = jwtService.generateRefreshToken(usuario.getId(), usuario.getEmail());

        return new AuthResponseDTO(
                accessToken,
                refreshToken,
                jwtExpiration,
                UsuarioDTO.fromEntity(usuario),
                false); // requerSelecaoPerfil = false
    }

    private AuthResponseDTO criarRespostaSelecionarPerfil(Usuario usuario) {
        return new AuthResponseDTO(
                null, // Sem token ainda
                null,
                jwtExpiration,
                UsuarioDTO.fromEntity(usuario),
                true); // requerSelecaoPerfil = true
    }

    private Role parseRole(String roleNome) {
        if (roleNome == null || roleNome.isBlank()) {
            return null;
        }
        try {
            return Role.valueOf(roleNome.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

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

    private Usuario criarUsuarioGoogle(String email, String nome, boolean emailVerificado) {
        log.info("Criando novo usuário via Google: {}", email);

        Usuario usuario = Usuario.builder()
                .nome(nome != null ? nome : email.split("@")[0])
                .email(email)
                .senha(passwordEncoder.encode(UUID.randomUUID().toString()))
                .roles(new HashSet<>(Set.of(Role.CLIENTE)))
                .roleAtiva(Role.CLIENTE)
                .ativo(true)
                .emailVerificado(emailVerificado)
                .build();

        return usuarioRepository.save(usuario);
    }
}
