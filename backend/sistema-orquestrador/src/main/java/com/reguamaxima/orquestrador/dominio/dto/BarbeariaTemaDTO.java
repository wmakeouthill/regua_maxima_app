package com.reguamaxima.orquestrador.dominio.dto;

import jakarta.validation.constraints.Pattern;

/**
 * DTO para configuração de tema da barbearia.
 */
public record BarbeariaTemaDTO(
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor primária deve ser um hex válido (ex: #FF5733)") String corPrimaria,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor secundária deve ser um hex válido") String corSecundaria,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de fundo deve ser um hex válido") String corFundo,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor do texto deve ser um hex válido") String corTexto,

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor de destaque deve ser um hex válido") String corDestaque,

        String fonteFamilia,

        Boolean modoEscuro) {
    /**
     * Retorna tema padrão.
     */
    public static BarbeariaTemaDTO padrao() {
        return new BarbeariaTemaDTO(
                "#1E3A5F", // Azul escuro
                "#2E5077", // Azul médio
                "#FFFFFF", // Branco
                "#333333", // Cinza escuro
                "#D4AF37", // Dourado
                "Roboto",
                false);
    }

    /**
     * Converte para JSON string.
     */
    public String toJson() {
        return String.format(
                "{\"corPrimaria\":\"%s\",\"corSecundaria\":\"%s\",\"corFundo\":\"%s\"," +
                        "\"corTexto\":\"%s\",\"corDestaque\":\"%s\",\"fonteFamilia\":\"%s\",\"modoEscuro\":%s}",
                corPrimaria != null ? corPrimaria : "#1E3A5F",
                corSecundaria != null ? corSecundaria : "#2E5077",
                corFundo != null ? corFundo : "#FFFFFF",
                corTexto != null ? corTexto : "#333333",
                corDestaque != null ? corDestaque : "#D4AF37",
                fonteFamilia != null ? fonteFamilia : "Roboto",
                modoEscuro != null ? modoEscuro : false);
    }
}
