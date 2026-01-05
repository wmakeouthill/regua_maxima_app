package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Entidade Atendimento - representa um atendimento na fila do barbeiro.
 * Gerencia o fluxo: AGUARDANDO -> EM_ATENDIMENTO -> CONCLUIDO
 */
@Entity
@Table(name = "atendimentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Atendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== Relacionamentos ==========

    /**
     * Barbeiro que realiza o atendimento.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbeiro_id", nullable = false)
    private Barbeiro barbeiro;

    /**
     * Cliente sendo atendido.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    /**
     * Serviço sendo realizado.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    /**
     * Barbearia onde ocorre o atendimento (opcional se barbeiro autônomo).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id")
    private Barbearia barbearia;

    // ========== Status ==========

    /**
     * Status atual do atendimento.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusAtendimento status = StatusAtendimento.AGUARDANDO;

    // ========== Datas e Horários ==========

    /**
     * Data do atendimento.
     */
    @Column(name = "data_atendimento", nullable = false)
    private LocalDate dataAtendimento;

    /**
     * Hora que o cliente chegou/entrou na fila.
     */
    @Column(name = "hora_chegada", nullable = false)
    private LocalDateTime horaChegada;

    /**
     * Hora que o atendimento efetivamente começou.
     */
    @Column(name = "hora_inicio_atendimento")
    private LocalDateTime horaInicioAtendimento;

    /**
     * Hora que o atendimento foi concluído.
     */
    @Column(name = "hora_fim_atendimento")
    private LocalDateTime horaFimAtendimento;

    // ========== Fila ==========

    /**
     * Posição na fila de espera.
     */
    @Column(name = "posicao_fila")
    private Integer posicaoFila;

    // ========== Observações ==========

    @Column(length = 500)
    private String observacoes;

    @Column(name = "motivo_cancelamento", length = 300)
    private String motivoCancelamento;

    // ========== Auditoria ==========

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
     * Inicia o atendimento.
     */
    public void iniciar() {
        if (this.status != StatusAtendimento.AGUARDANDO) {
            throw new IllegalStateException("Atendimento só pode ser iniciado se estiver aguardando");
        }
        this.status = StatusAtendimento.EM_ATENDIMENTO;
        this.horaInicioAtendimento = LocalDateTime.now();
        this.posicaoFila = null;
    }

    /**
     * Finaliza o atendimento com sucesso.
     */
    public void finalizar() {
        if (this.status != StatusAtendimento.EM_ATENDIMENTO) {
            throw new IllegalStateException("Atendimento só pode ser finalizado se estiver em andamento");
        }
        this.status = StatusAtendimento.CONCLUIDO;
        this.horaFimAtendimento = LocalDateTime.now();
    }

    /**
     * Cancela o atendimento.
     */
    public void cancelar(String motivo) {
        if (this.status == StatusAtendimento.CONCLUIDO) {
            throw new IllegalStateException("Atendimento já concluído não pode ser cancelado");
        }
        this.status = StatusAtendimento.CANCELADO;
        this.motivoCancelamento = motivo;
        this.posicaoFila = null;
    }

    /**
     * Marca como não compareceu.
     */
    public void marcarNaoCompareceu() {
        if (this.status != StatusAtendimento.AGUARDANDO) {
            throw new IllegalStateException("Só pode marcar como não compareceu se estiver aguardando");
        }
        this.status = StatusAtendimento.NAO_COMPARECEU;
        this.posicaoFila = null;
    }

    /**
     * Calcula o tempo de espera em minutos.
     */
    public long getTempoEsperaMinutos() {
        if (horaChegada == null)
            return 0;

        LocalDateTime fimEspera = horaInicioAtendimento != null
                ? horaInicioAtendimento
                : LocalDateTime.now();

        return ChronoUnit.MINUTES.between(horaChegada, fimEspera);
    }

    /**
     * Calcula a duração do atendimento em minutos.
     */
    public long getDuracaoAtendimentoMinutos() {
        if (horaInicioAtendimento == null)
            return 0;

        LocalDateTime fim = horaFimAtendimento != null
                ? horaFimAtendimento
                : LocalDateTime.now();

        return ChronoUnit.MINUTES.between(horaInicioAtendimento, fim);
    }

    /**
     * Verifica se está aguardando.
     */
    public boolean isAguardando() {
        return this.status == StatusAtendimento.AGUARDANDO;
    }

    /**
     * Verifica se está em atendimento.
     */
    public boolean isEmAtendimento() {
        return this.status == StatusAtendimento.EM_ATENDIMENTO;
    }

    /**
     * Verifica se está concluído.
     */
    public boolean isConcluido() {
        return this.status == StatusAtendimento.CONCLUIDO;
    }

    // ========== Enum de Status ==========

    public enum StatusAtendimento {
        AGUARDANDO,
        EM_ATENDIMENTO,
        CONCLUIDO,
        CANCELADO,
        NAO_COMPARECEU
    }
}
