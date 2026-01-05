package com.reguamaxima.config;

import com.reguamaxima.kernel.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Configuração de segurança da aplicação.
 * Stateless (JWT), sem sessão, CORS habilitado.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * URLs públicas que não requerem autenticação.
     */
    private static final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/api/v1/auth/**",
            "/api/config/public",
            "/api/v1/config/public",
            "/api/barbearias/**",
            "/api/v1/barbearias/**",
            "/api/barbeiros/proximos",
            "/api/v1/barbeiros/proximos",
            "/api/barbeiros/buscar",
            "/api/v1/barbeiros/buscar",
            "/api/barbeiros/{id}",
            "/api/v1/barbeiros/{id}",
            "/api/atendimentos/fila/**",
            "/api/v1/atendimentos/fila/**",
            "/actuator/health",
            "/actuator/info",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/error"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Desabilitar CSRF (stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // Habilitar CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // Sem sessão (stateless)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Configurar autorização
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_URLS).permitAll()
                        .anyRequest().authenticated())

                // Adicionar filtro JWT antes do UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
