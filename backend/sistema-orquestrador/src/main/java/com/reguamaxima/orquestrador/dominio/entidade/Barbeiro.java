package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade Barbeiro - representa um profissional barbeiro.
 * Pode ser autônomo ou vinculado a uma barbearia.
 */
@Entity
@Table(name = "barbeiros")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Barbeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Usuário associado ao barbeiro.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    /**
     * Nome artístico/profissional do barbeiro.
     */
    @Column(name = "nome_profissional", length = 100)
    private String nomeProfissional;

    /**
     * Biografia/descrição do barbeiro.
     */
    @Column(length = 1000)
    private String bio;

    /**
     * Especialidades do barbeiro (ex: "Degradê, Barba, Desenhos").
     */
    @Column(length = 500)
    private String especialidades;

    /**
     * Anos de experiência.
     */
    @Column(name = "anos_experiencia")
    private Integer anosExperiencia;

    // ========== Imagens ==========

    @Column(name = "foto_url", columnDefinition = "TEXT")
    private String fotoUrl;

    /**
     * URLs das fotos de trabalhos realizados (JSON array).
     */
    @Column(name = "portfolio_urls", length = 2000)
    private String portfolioUrls;

    // ========== Geolocalização ==========

    @Column(precision = 10)
    private Double latitude;

    @Column(precision = 10)
    private Double longitude;

    /**
     * Se o barbeiro quer aparecer no mapa.
     */
    @Column(name = "visivel_mapa", nullable = false)
    @Builder.Default
    private Boolean visivelMapa = true;

    // ========== Contato ==========

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String whatsapp;

    @Column(length = 200)
    private String instagram;

    // ========== Vínculo com Barbearia ==========

    /**
     * Barbearia onde o barbeiro está vinculado (pode ser null se autônomo).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbearia_id")
    private Barbearia barbearia;

    /**
     * Status do vínculo com a barbearia.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status_vinculo", length = 20)
    @Builder.Default
    private StatusVinculo statusVinculo = StatusVinculo.SEM_VINCULO;

    /**
     * Data da solicitação de vínculo.
     */
    @Column(name = "data_solicitacao_vinculo")
    private LocalDateTime dataSolicitacaoVinculo;

    // ========== Avaliações ==========

    @Column(name = "avaliacao_media")
    @Builder.Default
    private Double avaliacaoMedia = 0.0;

    @Column(name = "total_avaliacoes")
    @Builder.Default
    private Integer totalAvaliacoes = 0;

    @Column(name = "total_atendimentos")
    @Builder.Default
    private Integer totalAtendimentos = 0;

    // ========== Status e Auditoria ==========

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    /**
     * Se o perfil está completo (bio, foto, etc).
     */
    @Column(name = "perfil_completo", nullable = false)
    @Builder.Default
    private Boolean perfilCompleto = false;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    // ========== Lifecycle Callbacks ==========

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
        verificarPerfilCompleto();
    }

    @PrePersist
    protected void onCreate() {
        verificarPerfilCompleto();
    }

    // ========== Métodos de Domínio ==========

    /**
     * Verifica se o perfil está completo.
     */
    public void verificarPerfilCompleto() {
        this.perfilCompleto = this.bio != null && !this.bio.isBlank()
                && this.fotoUrl != null && !this.fotoUrl.isBlank()
                && this.especialidades != null && !this.especialidades.isBlank();
    }

    /**
     * Solicita vínculo a uma barbearia.
     */
    public void solicitarVinculo(Barbearia barbearia) {
        if (this.statusVinculo == StatusVinculo.APROVADO) {
            throw new IllegalStateException("Barbeiro já está vinculado a uma barbearia");
        }
        this.barbearia = barbearia;
        this.statusVinculo = StatusVinculo.PENDENTE;
        this.dataSolicitacaoVinculo = LocalDateTime.now();
    }

    /**
     * Cancela solicitação de vínculo pendente.
     */
    public void cancelarSolicitacao() {
        if (this.statusVinculo != StatusVinculo.PENDENTE) {
            throw new IllegalStateException("Não há solicitação pendente");
        }
        this.barbearia = null;
        this.statusVinculo = StatusVinculo.SEM_VINCULO;
        this.dataSolicitacaoVinculo = null;
    }

    /**
     * Desvincular da barbearia atual.
     */
    public void desvincular() {
        this.barbearia = null;
        this.statusVinculo = StatusVinculo.SEM_VINCULO;
        this.dataSolicitacaoVinculo = null;
    }

    /**
     * Aprovar vínculo (chamado pelo admin).
     */
    public void aprovarVinculo() {
        if (this.statusVinculo != StatusVinculo.PENDENTE) {
            throw new IllegalStateException("Não há solicitação pendente para aprovar");
        }
        this.statusVinculo = StatusVinculo.APROVADO;
    }

    /**
     * Rejeitar vínculo (chamado pelo admin).
     */
    public void rejeitarVinculo() {
        if (this.statusVinculo != StatusVinculo.PENDENTE) {
            throw new IllegalStateException("Não há solicitação pendente para rejeitar");
        }
        this.barbearia = null;
        this.statusVinculo = StatusVinculo.REJEITADO;
    }

    /**
     * Retorna o nome de exibição (profissional ou do usuário).
     */
    public String getNomeExibicao() {
        if (nomeProfissional != null && !nomeProfissional.isBlank()) {
            return nomeProfissional;
        }
        return usuario != null ? usuario.getNome() : "";
    }

    /**
     * Verifica se está vinculado a uma barbearia.
     */
    public boolean isVinculado() {
        return statusVinculo == StatusVinculo.APROVADO && barbearia != null;
    }

    /**
     * Verifica se é autônomo (não vinculado).
     */
    public boolean isAutonomo() {
        return !isVinculado();
    }

    // ========== Enum de Status ==========

    public enum StatusVinculo {
        SEM_VINCULO,
        PENDENTE,
        APROVADO,
        REJEITADO
    }
}
