package com.reguamaxima.orquestrador.dominio.dto;

import java.time.LocalTime;

/**
 * DTO para representar um horário disponível para agendamento.
 */
public record HorarioDisponivelDTO(
        LocalTime horario,
        String horarioFormatado,
        boolean disponivel) {
    /**
     * Cria um horário disponível.
     */
    public static HorarioDisponivelDTO disponivel(LocalTime horario) {
        return new HorarioDisponivelDTO(
                horario,
                formatarHorario(horario),
                true);
    }

    /**
     * Cria um horário indisponível.
     */
    public static HorarioDisponivelDTO indisponivel(LocalTime horario) {
        return new HorarioDisponivelDTO(
                horario,
                formatarHorario(horario),
                false);
    }

    private static String formatarHorario(LocalTime horario) {
        return String.format("%02d:%02d", horario.getHour(), horario.getMinute());
    }
}
