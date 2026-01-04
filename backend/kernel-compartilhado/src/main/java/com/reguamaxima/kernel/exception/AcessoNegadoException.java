package com.reguamaxima.kernel.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exceção para acesso negado/proibido.
 * Retorna HTTP 403.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }

    public AcessoNegadoException() {
        super("Acesso negado a este recurso");
    }
}
