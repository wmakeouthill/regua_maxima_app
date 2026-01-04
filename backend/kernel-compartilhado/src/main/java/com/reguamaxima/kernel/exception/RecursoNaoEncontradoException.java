package com.reguamaxima.kernel.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exceção base para recursos não encontrados.
 * Retorna HTTP 404.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }

    public RecursoNaoEncontradoException(String recurso, Object id) {
        super(String.format("%s não encontrado com ID: %s", recurso, id));
    }
}
