package com.reguamaxima.kernel.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Configuração de timezone para a aplicação.
 * Garante que todos os horários sejam tratados no fuso de São Paulo.
 */
@Configuration
public class TimeZoneConfig {

    private static final String TIMEZONE_SAO_PAULO = "America/Sao_Paulo";

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(TIMEZONE_SAO_PAULO));
    }
}
