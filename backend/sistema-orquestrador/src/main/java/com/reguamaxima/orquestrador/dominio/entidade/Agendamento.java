package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.orquestrador.dominio.enums.StatusAgendamento;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

/**
 * Entidade Agendamento - representa um agendamento de serviço.
 * Vincula cliente, barbeiro, serviço e horário.
 */
@Entity
@Table(name = "agendamentos", indexes = {
        @Index(name = "idx_agendamento_cliente", columnList = "cliente_id"),
        @Index(name = "idx_agendamento_barbeiro", columnList = "barbeiro_id"),
        @Index(name = "idx_agendamento_barbearia", columnList = "barbearia_id"),
        @Index(name = "idx_agendamento_data", columnList = "data"),
        @Index(name = "idx_agendamento_status", columnList = "status"),
        @Index(name = "idx_agendamento_data_barbeiro", columnList = "data, barbeiro_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== Relacionamentos ==========

    /**
     * Cliente que fez o agendamento.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    /**
     * Barbeiro que irá realizar o serviço.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbeiro_id", nullable = false)
    private Barbeiro barbeiro;

    /**
     * Barbearia onde será realizado o serviço.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id", nullable = false)
    private Barbearia barbearia;

    /**
     * Serviço agendado.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    // ========== Data e Hora ==========

    /**
     * Data do agendamento.
     */
    @Column(nullable = false)
    private LocalDate data;

    /**
     * Hora de início do agendamento.
     */
    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    /**
     * Hora prevista de término (calculada com base na duração do serviço).
     */
    @Column(name = "hora_fim", nullable = false)
    private LocalTime horaFim;

    /**
     * Duração em minutos (copiado do serviço no momento do agendamento).
     */
    @Column(name = "duracao_minutos", nullable = false)
    private Integer duracaoMinutos;

    // ========== Valores ==========

    /**
     * Preço do serviço (copiado do serviço no momento do agendamento).
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    // ========== Status ==========

    /**
     * Status atual do agendamento.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusAgendamento status = StatusAgendamento.PENDENTE;

    // ========== Informações Adicionais ==========

    /**
     * Observações do cliente.
     */
    @Column(name = "observacoes_cliente", length = 500)
    private String observacoesCliente;

    /**
     * Observações do barbeiro/barbearia.
     */
    @Column(name = "observacoes_barbeiro", length = 500)
    private String observacoesBarbeiro;

    /**
     * Motivo do cancelamento (quando aplicável).
     */
    @Column(name = "motivo_cancelamento", length = 300)
    private String motivoCancelamento;

    // ========== Auditoria ==========

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @Column(name = "data_confirmacao")
    private LocalDateTime dataConfirmacao;

    @Column(name = "data_inicio_atendimento")
    private LocalDateTime dataInicioAtendimento;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "data_cancelamento")
    private LocalDateTime dataCancelamento;

    // ========== Lifecycle Callbacks ==========

    @PrePersist
    protected void onCreate() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
        calcularHoraFim();
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ========== Métodos de Domínio ==========

    /**
     * Calcula a hora de fim baseado na hora de início e duração.
     */
    public void calcularHoraFim() {
        if (horaInicio != null && duracaoMinutos != null) {
            this.horaFim = horaInicio.plusMinutes(duracaoMinutos);
        }
    }

    /**
     * Confirma o agendamento.
     */
    public void confirmar() {
        if (!status.podeConfirmar()) {
            throw new IllegalStateException("Agendamento não pode ser confirmado no status atual: " + status);
        }
        this.status = StatusAgendamento.CONFIRMADO;
        this.dataConfirmacao = LocalDateTime.now();
    }

    /**
     * Inicia o atendimento.
     */
    public void iniciarAtendimento() {
        if (!status.podeIniciar()) {
            throw new IllegalStateException("Agendamento não pode ser iniciado no status atual: " + status);
        }
        this.status = StatusAgendamento.EM_ANDAMENTO;
        this.dataInicioAtendimento = LocalDateTime.now();
    }

    /**
     * Finaliza o atendimento com sucesso.
     */
    public void concluir() {
        if (!status.podeFinalizar()) {
            throw new IllegalStateException("Agendamento não pode ser concluído no status atual: " + status);
        }
        this.status = StatusAgendamento.CONCLUIDO;
        this.dataConclusao = LocalDateTime.now();
    }

    /**
     * Marca como não compareceu.
     */
    public void marcarNaoCompareceu() {
        if (status != StatusAgendamento.CONFIRMADO && status != StatusAgendamento.PENDENTE) {
            throw new IllegalStateException("Não é possível marcar não compareceu no status atual: " + status);
        }
        this.status = StatusAgendamento.NAO_COMPARECEU;
        this.dataConclusao = LocalDateTime.now();
    }

    /**
     * Cancela o agendamento pelo cliente.
     */
    public void cancelarPeloCliente(String motivo) {
        if (!status.podeCancelar()) {
            throw new IllegalStateException("Agendamento não pode ser cancelado no status atual: " + status);
        }
        this.status = StatusAgendamento.CANCELADO_CLIENTE;
        this.motivoCancelamento = motivo;
        this.dataCancelamento = LocalDateTime.now();
    }

    /**
     * Cancela o agendamento pelo barbeiro.
     */
    public void cancelarPeloBarbeiro(String motivo) {
        if (!status.podeCancelar()) {
            throw new IllegalStateException("Agendamento não pode ser cancelado no status atual: " + status);
        }
        this.status = StatusAgendamento.CANCELADO_BARBEIRO;
        this.motivoCancelamento = motivo;
        this.dataCancelamento = LocalDateTime.now();
    }

    /**
     * Cancela o agendamento pela barbearia.
     */
    public void cancelarPelaBarbearia(String motivo) {
        if (!status.podeCancelar()) {
            throw new IllegalStateException("Agendamento não pode ser cancelado no status atual: " + status);
        }
        this.status = StatusAgendamento.CANCELADO_BARBEARIA;
        this.motivoCancelamento = motivo;
        this.dataCancelamento = LocalDateTime.now();
    }

    /**
     * Retorna o DateTime completo do agendamento.
     */
    public LocalDateTime getDataHoraInicio() {
        return LocalDateTime.of(data, horaInicio);
    }

    /**
     * Retorna o DateTime completo do fim previsto.
     */
    public LocalDateTime getDataHoraFim() {
        return LocalDateTime.of(data, horaFim);
    }

    /**
     * Verifica se o agendamento é para hoje.
     */
    public boolean isHoje() {
        return data.equals(LocalDate.now());
    }

    /**
     * Verifica se o agendamento já passou.
     */
    public boolean isPassado() {
        return getDataHoraFim().isBefore(LocalDateTime.now());
    }

    /**
     * Verifica se o agendamento é futuro.
     */
    public boolean isFuturo() {
        return getDataHoraInicio().isAfter(LocalDateTime.now());
    }

    /**
     * Retorna quantos minutos faltam para o agendamento (se futuro).
     */
    public long getMinutosParaInicio() {
        if (isPassado()) {
            return 0;
        }
        return ChronoUnit.MINUTES.between(LocalDateTime.now(), getDataHoraInicio());
    }

    /**
     * Verifica se há conflito de horário com outro agendamento.
     */
    public boolean temConflitoHorario(LocalTime outroInicio, LocalTime outroFim) {
        // Conflito existe se os intervalos se sobrepõem
        return !(horaFim.compareTo(outroInicio) <= 0 || horaInicio.compareTo(outroFim) >= 0);
    }
}
