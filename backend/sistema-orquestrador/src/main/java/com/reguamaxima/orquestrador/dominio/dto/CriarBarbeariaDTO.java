package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;

/**
 * DTO para criação de nova barbearia.
 */
public record CriarBarbeariaDTO(
        @NotBlank(message = "Nome é obrigatório") @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres") String nome,

        @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres") String descricao,

        @NotBlank(message = "Endereço é obrigatório") @Size(max = 255, message = "Endereço deve ter no máximo 255 caracteres") String endereco,

        @NotBlank(message = "Cidade é obrigatória") @Size(max = 100, message = "Cidade deve ter no máximo 100 caracteres") String cidade,

        @NotBlank(message = "Estado é obrigatório") @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres") String estado,

        @Size(max = 10, message = "CEP deve ter no máximo 10 caracteres") String cep,

        Double latitude,

        Double longitude,

        @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres") String telefone,

        @Size(max = 20, message = "WhatsApp deve ter no máximo 20 caracteres") String whatsapp,

        @Email(message = "E-mail inválido") @Size(max = 100, message = "E-mail deve ter no máximo 100 caracteres") String email,

        @Size(max = 100, message = "Instagram deve ter no máximo 100 caracteres") String instagram) {
}
