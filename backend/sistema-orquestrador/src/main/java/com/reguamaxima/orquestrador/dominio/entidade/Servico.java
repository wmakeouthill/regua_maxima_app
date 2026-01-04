package com.reguamaxima.orquestrador.dominio.entidade;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidade Servico - representa um serviço oferecido por uma barbearia.
 * Ex: Corte, Barba, Corte + Barba, Degradê, etc.
 */
@Entity
@Table(name = "servicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 300)
    private String descricao;

    /**
     * Duração do serviço em minutos.
     */
    @Column(name = "duracao_minutos", nullable = false)
    private Integer duracaoMinutos;

    /**
     * Preço do serviço.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    /**
     * Ícone do serviço (nome do ícone Ionicons).
     */
    @Column(length = 50)
    @Builder.Default
    private String icone = "cut-outline";

    /**
     * Ordem de exibição na lista.
     */
    @Column(name = "ordem_exibicao")
    @Builder.Default
    private Integer ordemExibicao = 0;

    // ========== Relacionamentos ==========

    /**
     * Barbearia que oferece este serviço.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id", nullable = false)
    private Barbearia barbearia;

    // ========== Status e Auditoria ==========

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    // ========== Lifecycle Callbacks ==========

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ========== Métodos de Domínio ==========

    /**
     * Retorna a duração formatada (ex: "30 min", "1h 30min").
     */
    public String getDuracaoFormatada() {
        if (duracaoMinutos == null)
            return "";

        int horas = duracaoMinutos / 60;
        int minutos = duracaoMinutos % 60;

        if (horas > 0 && minutos > 0) {
            return horas + "h " + minutos + "min";
        } else if (horas > 0) {
            return horas + "h";
        } else {
            return minutos + " min";
        }
    }

    /**
     * Retorna o preço formatado em BRL.
     */
    public String getPrecoFormatado() {
        if (preco == null)
            return "R$ 0,00";
        return String.format("R$ %,.2f", preco);
    }
}
