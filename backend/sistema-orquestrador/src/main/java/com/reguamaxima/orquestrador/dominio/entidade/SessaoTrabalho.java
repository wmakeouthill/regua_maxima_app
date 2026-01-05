package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.orquestrador.dominio.enums.StatusSessao;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidade SessaoTrabalho - representa uma sessão de trabalho/caixa da
 * barbearia.
 * Indica se a barbearia está aberta, pausada ou fechada para atendimentos.
 */
@Entity
@Table(name = "sessoes_trabalho")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessaoTrabalho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== Identificação ==========

    /**
     * Número sequencial da sessão (incrementado por dia).
     */
    @Column(name = "numero_sessao", nullable = false)
    private Integer numeroSessao;

    // ========== Relacionamentos ==========

    /**
     * Barbearia dona desta sessão.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id", nullable = false)
    private Barbearia barbearia;

    /**
     * Usuário que abriu a sessão.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // ========== Status ==========

    /**
     * Status atual da sessão.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatusSessao status = StatusSessao.ABERTA;

    // ========== Datas e Horários ==========

    /**
     * Data da sessão.
     */
    @Column(name = "data_sessao", nullable = false)
    private LocalDate dataSessao;

    /**
     * Data/hora de abertura da sessão.
     */
    @Column(name = "data_abertura", nullable = false)
    private LocalDateTime dataAbertura;

    /**
     * Data/hora de fechamento da sessão.
     */
    @Column(name = "data_fechamento")
    private LocalDateTime dataFechamento;

    // ========== Valores do Caixa ==========

    /**
     * Valor inicial no caixa ao abrir.
     */
    @Column(name = "valor_abertura", precision = 10, scale = 2)
    private BigDecimal valorAbertura;

    /**
     * Valor final no caixa ao fechar.
     */
    @Column(name = "valor_fechamento", precision = 10, scale = 2)
    private BigDecimal valorFechamento;

    /**
     * Total de vendas/atendimentos durante a sessão.
     */
    @Column(name = "valor_total_vendas", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorTotalVendas = BigDecimal.ZERO;

    /**
     * Quantidade de atendimentos realizados.
     */
    @Column(name = "quantidade_atendimentos")
    @Builder.Default
    private Integer quantidadeAtendimentos = 0;

    // ========== Observações ==========

    @Column(length = 500)
    private String observacoes;

    // ========== Auditoria ==========

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @Version
    private Long version;

    // ========== Lifecycle Callbacks ==========

    @PrePersist
    protected void onCreate() {
        this.dataCriacao = LocalDateTime.now();
        this.dataAbertura = LocalDateTime.now();
        this.dataSessao = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ========== Métodos de Domínio ==========

    /**
     * Pausa a sessão temporariamente.
     */
    public void pausar() {
        if (!this.status.podeSerPausada()) {
            throw new IllegalStateException(
                    "Não é possível pausar uma sessão com status " + this.status.getDescricao());
        }
        this.status = StatusSessao.PAUSADA;
    }

    /**
     * Retoma uma sessão pausada.
     */
    public void retomar() {
        if (!this.status.podeSerRetomada()) {
            throw new IllegalStateException(
                    "Não é possível retomar uma sessão com status " + this.status.getDescricao());
        }
        this.status = StatusSessao.ABERTA;
    }

    /**
     * Finaliza a sessão.
     */
    public void finalizar(BigDecimal valorFechamento) {
        if (!this.status.podeSerFinalizada()) {
            throw new IllegalStateException(
                    "Não é possível finalizar uma sessão com status " + this.status.getDescricao());
        }
        this.status = StatusSessao.FECHADA;
        this.dataFechamento = LocalDateTime.now();
        this.valorFechamento = valorFechamento;
    }

    /**
     * Registra um atendimento na sessão.
     */
    public void registrarAtendimento(BigDecimal valor) {
        if (!this.status.estaAtiva()) {
            throw new IllegalStateException("Sessão não está ativa para registrar atendimentos");
        }
        this.valorTotalVendas = this.valorTotalVendas.add(valor);
        this.quantidadeAtendimentos++;
    }

    /**
     * Calcula o valor esperado no fechamento.
     */
    public BigDecimal getValorEsperado() {
        return valorAbertura != null
                ? valorAbertura.add(valorTotalVendas)
                : valorTotalVendas;
    }

    /**
     * Calcula a diferença entre valor esperado e valor real.
     */
    public BigDecimal getDiferencaCaixa() {
        if (valorFechamento == null) {
            return BigDecimal.ZERO;
        }
        return valorFechamento.subtract(getValorEsperado());
    }

    /**
     * Verifica se a sessão está ativa.
     */
    public boolean isAtiva() {
        return this.status.estaAtiva();
    }

    /**
     * Verifica se a sessão está pausada.
     */
    public boolean isPausada() {
        return this.status == StatusSessao.PAUSADA;
    }

    /**
     * Verifica se a sessão está fechada.
     */
    public boolean isFechada() {
        return this.status == StatusSessao.FECHADA;
    }

    /**
     * Retorna o nome da sessão para exibição.
     */
    public String getNome() {
        return "Sessão " + numeroSessao + " - " + dataSessao;
    }
}
