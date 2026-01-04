package com.reguamaxima.autenticacao.dominio.repository;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositório JPA para a entidade Usuario.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Busca usuário por email.
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Verifica se existe usuário com o email.
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuário por email e ativo.
     */
    Optional<Usuario> findByEmailAndAtivoTrue(String email);
}
