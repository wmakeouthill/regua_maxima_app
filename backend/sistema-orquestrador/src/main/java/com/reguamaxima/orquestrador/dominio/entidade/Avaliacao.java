package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import com.reguamaxima.orquestrador.dominio.enums.TipoAvaliacao;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entidade Avaliacao - representa uma avaliação feita pelo cliente.
 * Pode ser de uma barbearia, barbeiro ou atendimento específico.
 */
@Entity
@Table(name = "avaliacoes", indexes = {
        @Index(name = "idx_avaliacoes_cliente", columnList = "cliente_id"),
        @Index(name = "idx_avaliacoes_barbearia", columnList = "barbearia_id"),
        @Index(name = "idx_avaliacoes_barbeiro", columnList = "barbeiro_id"),
        @Index(name = "idx_avaliacoes_agendamento", columnList = "agendamento_id"),
        @Index(name = "idx_avaliacoes_nota", columnList = "nota")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Cliente que fez a avaliação.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    /**
     * Tipo de avaliação.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoAvaliacao tipo;

    /**
     * Barbearia avaliada (quando tipo = BARBEARIA ou ATENDIMENTO).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id")
    private Barbearia barbearia;

    /**
     * Barbeiro avaliado (quando tipo = BARBEIRO ou ATENDIMENTO).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbeiro_id")
    private Barbeiro barbeiro;

    /**
     * Agendamento relacionado (quando tipo = ATENDIMENTO).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agendamento_id")
    private Agendamento agendamento;

    /**
     * Nota de 1 a 5 estrelas.
     */
    @Column(nullable = false)
    private Integer nota;

    /**
     * Comentário opcional do cliente.
     */
    @Column(length = 1000)
    private String comentario;

    /**
     * Resposta do barbeiro/barbearia à avaliação.
     */
    @Column(length = 500)
    private String resposta;

    /**
     * Data/hora da resposta.
     */
    @Column(name = "data_resposta")
    private LocalDateTime dataResposta;

    /**
     * Se a avaliação é anônima (não mostra nome do cliente).
     */
    @Column(nullable = false)
    private Boolean anonima = false;

    /**
     * Se a avaliação está visível publicamente.
     */
    @Column(nullable = false)
    private Boolean visivel = true;

    /**
     * Data/hora da criação.
     */
    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    /**
     * Data/hora da última atualização.
     */
    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    // ========== Métodos de Ciclo de Vida ==========

    @PrePersist
    protected void onCreate() {
        this.dataCriacao = LocalDateTime.now();
        this.dataAtualizacao = LocalDateTime.now();
        if (this.anonima == null)
            this.anonima = false;
        if (this.visivel == null)
            this.visivel = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ========== Métodos de Domínio ==========

    /**
     * Valida se a avaliação está consistente.
     */
    public boolean isValida() {
        if (nota == null || nota < 1 || nota > 5) {
            return false;
        }

        switch (tipo) {
            case BARBEARIA:
                return barbearia != null;
            case BARBEIRO:
                return barbeiro != null;
            case ATENDIMENTO:
                return agendamento != null;
            default:
                return false;
        }
    }

    /**
     * Adiciona resposta à avaliação.
     */
    public void responder(String resposta) {
        if (resposta == null || resposta.isBlank()) {
            throw new IllegalArgumentException("Resposta não pode ser vazia");
        }
        this.resposta = resposta.trim();
        this.dataResposta = LocalDateTime.now();
    }

    /**
     * Verifica se já foi respondida.
     */
    public boolean isRespondida() {
        return this.resposta != null && !this.resposta.isBlank();
    }

    /**
     * Oculta a avaliação (moderação).
     */
    public void ocultar() {
        this.visivel = false;
    }

    /**
     * Torna a avaliação visível novamente.
     */
    public void tornarVisivel() {
        this.visivel = true;
    }

    /**
     * Retorna o nome do cliente (ou "Anônimo").
     */
    public String getNomeCliente() {
        if (Boolean.TRUE.equals(anonima) || cliente == null) {
            return "Anônimo";
        }
        return cliente.getNome();
    }

    /**
     * Retorna o nome da entidade avaliada.
     */
    public String getNomeAvaliado() {
        return switch (tipo) {
            case BARBEARIA -> barbearia != null ? barbearia.getNome() : null;
            case BARBEIRO -> barbeiro != null
                    ? (barbeiro.getNomeProfissional() != null ? barbeiro.getNomeProfissional()
                            : barbeiro.getUsuario().getNome())
                    : null;
            case ATENDIMENTO -> {
                if (agendamento != null) {
                    String servico = agendamento.getServico() != null ? agendamento.getServico().getNome() : "Serviço";
                    String barbeiroNome = agendamento.getBarbeiro() != null
                            ? agendamento.getBarbeiro().getNomeProfissional()
                            : "";
                    yield servico + " com " + barbeiroNome;
                }
                yield null;
            }
        };
    }
}
