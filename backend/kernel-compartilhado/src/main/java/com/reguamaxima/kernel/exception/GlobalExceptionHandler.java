package com.reguamaxima.kernel.exception;

import com.reguamaxima.kernel.dto.ErrorResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Handler global de exceções para toda a API.
 * Converte exceções em respostas padronizadas.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(RecursoNaoEncontradoException.class)
        public ResponseEntity<ErrorResponseDTO> handleRecursoNaoEncontrado(
                        RecursoNaoEncontradoException ex,
                        HttpServletRequest request) {

                log.warn("Recurso não encontrado: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.NOT_FOUND.value(),
                                                "Not Found",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(EntityNotFoundException.class)
        public ResponseEntity<ErrorResponseDTO> handleEntityNotFound(
                        EntityNotFoundException ex,
                        HttpServletRequest request) {

                log.warn("Entidade não encontrada: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.NOT_FOUND.value(),
                                                "Not Found",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponseDTO> handleIllegalArgument(
                        IllegalArgumentException ex,
                        HttpServletRequest request) {

                log.warn("Argumento inválido: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.BAD_REQUEST.value(),
                                                "Bad Request",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ErrorResponseDTO> handleIllegalState(
                        IllegalStateException ex,
                        HttpServletRequest request) {

                log.warn("Estado inválido: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.CONFLICT.value(),
                                                "Conflict",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(RegraNegocioException.class)
        public ResponseEntity<ErrorResponseDTO> handleRegraNegocio(
                        RegraNegocioException ex,
                        HttpServletRequest request) {

                log.warn("Regra de negócio violada: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.BAD_REQUEST.value(),
                                                "Bad Request",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(AcessoNegadoException.class)
        public ResponseEntity<ErrorResponseDTO> handleAcessoNegado(
                        AcessoNegadoException ex,
                        HttpServletRequest request) {

                log.warn("Acesso negado: {} - Path: {}", ex.getMessage(), request.getRequestURI());

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.FORBIDDEN.value(),
                                                "Forbidden",
                                                ex.getMessage(),
                                                request.getRequestURI()));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponseDTO> handleAccessDenied(
                        AccessDeniedException ex,
                        HttpServletRequest request) {

                log.warn("Spring Security - Acesso negado: {}", request.getRequestURI());

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.FORBIDDEN.value(),
                                                "Forbidden",
                                                "Você não tem permissão para acessar este recurso",
                                                request.getRequestURI()));
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ErrorResponseDTO> handleBadCredentials(
                        BadCredentialsException ex,
                        HttpServletRequest request) {

                log.warn("Credenciais inválidas: {}", request.getRequestURI());

                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.UNAUTHORIZED.value(),
                                                "Unauthorized",
                                                "Credenciais inválidas",
                                                request.getRequestURI()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponseDTO> handleValidation(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {

                String errors = ex.getBindingResult().getFieldErrors().stream()
                                .map(FieldError::getDefaultMessage)
                                .collect(Collectors.joining("; "));

                log.warn("Erro de validação: {}", errors);

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.BAD_REQUEST.value(),
                                                "Validation Error",
                                                errors,
                                                request.getRequestURI()));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponseDTO> handleGeneric(
                        Exception ex,
                        HttpServletRequest request) {

                log.error("Erro interno: {}", ex.getMessage(), ex);

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ErrorResponseDTO(
                                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                                "Internal Server Error",
                                                "Ocorreu um erro interno. Tente novamente mais tarde.",
                                                request.getRequestURI()));
        }
}
