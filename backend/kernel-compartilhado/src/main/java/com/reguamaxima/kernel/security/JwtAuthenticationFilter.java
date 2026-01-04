package com.reguamaxima.kernel.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filtro JWT que intercepta requisições e valida tokens.
 * Executa uma vez por requisição (OncePerRequestFilter).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Extrair header Authorization
        String authHeader = request.getHeader("Authorization");

        // Se não tem header ou não é Bearer, continua sem autenticação
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Extrair token (remover "Bearer ")
            String token = authHeader.substring(7);

            // Extrair username do token
            String username = jwtService.extractUsername(token);

            // Se tem username e não está autenticado ainda
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Validar token
                if (jwtService.isTokenValid(token, username)) {

                    // Extrair roles e ID do usuário
                    List<String> roles = jwtService.extractRoles(token);
                    Long userId = jwtService.extractUserId(token);

                    // Converter para authorities
                    var authorities = roles != null
                            ? roles.stream().map(SimpleGrantedAuthority::new).toList()
                            : List.<SimpleGrantedAuthority>of();

                    // Criar CustomUserDetails com ID do usuário
                    CustomUserDetails userDetails = CustomUserDetails.fromJwt(userId, username, roles);

                    // Criar authentication token com CustomUserDetails como principal
                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities);

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Setar no contexto de segurança
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("Usuário autenticado: {} com roles: {}", username, roles);
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao processar token JWT: {}", e.getMessage());
            // Não lança exceção, apenas não autentica
        }

        filterChain.doFilter(request, response);
    }
}
