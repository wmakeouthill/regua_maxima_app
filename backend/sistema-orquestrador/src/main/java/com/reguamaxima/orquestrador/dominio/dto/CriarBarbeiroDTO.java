package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO para criação de perfil de barbeiro.
 */
public record CriarBarbeiroDTO(
        @Size(max = 100, message = "Nome profissional deve ter no máximo 100 caracteres") String nomeProfissional,

        @Size(max = 1000, message = "Bio deve ter no máximo 1000 caracteres") String bio,

        @Size(max = 500, message = "Especialidades deve ter no máximo 500 caracteres") String especialidades,

        Integer anosExperiencia,

        String fotoUrl,

        Double latitude,

        Double longitude,

        Boolean visivelMapa,

        @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres") String telefone,

        @Size(max = 20, message = "WhatsApp deve ter no máximo 20 caracteres") String whatsapp,

        @Size(max = 200, message = "Instagram deve ter no máximo 200 caracteres") String instagram) {
}
