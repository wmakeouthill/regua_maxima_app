package com.reguamaxima.orquestrador.dominio.entidade;

import com.reguamaxima.autenticacao.dominio.entidade.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Entidade Barbearia - representa uma barbearia cadastrada no sistema.
 * Cada barbearia pertence a um Admin (dono) e pode ter tema personalizado.
 */
@Entity
@Table(name = "barbearias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Barbearia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Slug único para URL amigável (ex: /barbearia/corte-fino)
     */
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 500)
    private String descricao;

    // ========== Endereço ==========

    @Column(length = 200)
    private String endereco;

    @Column(length = 100)
    private String cidade;

    @Column(length = 50)
    private String estado;

    @Column(length = 10)
    private String cep;

    // ========== Geolocalização ==========

    @Column(precision = 10)
    private Double latitude;

    @Column(precision = 10)
    private Double longitude;

    // ========== Contato ==========

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String whatsapp;

    @Column(length = 150)
    private String email;

    @Column(length = 200)
    private String instagram;

    // ========== Imagens ==========

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    // ========== Tema (JSON) ==========

    /**
     * Configuração de tema em JSON.
     * Exemplo: {"corPrimaria": "#1a237e", "corSecundaria": "#c5cae9", ...}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tema_config", columnDefinition = "json")
    private String temaConfig;

    // ========== Relacionamentos ==========

    /**
     * Admin (dono) da barbearia.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private Usuario admin;

    // ========== Status e Auditoria ==========

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "avaliacao_media")
    @Builder.Default
    private Double avaliacaoMedia = 0.0;

    @Column(name = "total_avaliacoes")
    @Builder.Default
    private Integer totalAvaliacoes = 0;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    // ========== Lifecycle Callbacks ==========

    @PrePersist
    protected void onCreate() {
        if (this.slug == null || this.slug.isBlank()) {
            this.slug = gerarSlugFromNome(this.nome);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    // ========== Métodos de Domínio ==========

    /**
     * Gera e define o slug a partir do nome atual.
     */
    public void gerarSlug() {
        this.slug = gerarSlugFromNome(this.nome);
    }

    /**
     * Gera slug a partir do nome.
     */
    private String gerarSlugFromNome(String nome) {
        if (nome == null)
            return "";
        return nome.toLowerCase()
                .replaceAll("[áàãâä]", "a")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[íìîï]", "i")
                .replaceAll("[óòõôö]", "o")
                .replaceAll("[úùûü]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Atualiza a média de avaliações.
     */
    public void atualizarAvaliacao(double novaAvaliacao) {
        double totalPontos = this.avaliacaoMedia * this.totalAvaliacoes;
        this.totalAvaliacoes++;
        this.avaliacaoMedia = (totalPontos + novaAvaliacao) / this.totalAvaliacoes;
    }

    /**
     * Verifica se a barbearia tem geolocalização definida.
     */
    public boolean temGeolocalizacao() {
        return this.latitude != null && this.longitude != null;
    }

    /**
     * Verifica se a barbearia tem tema personalizado.
     */
    public boolean temTemaPersonalizado() {
        return this.temaConfig != null && !this.temaConfig.isBlank();
    }

    /**
     * Retorna o endereço completo formatado.
     */
    public String getEnderecoCompleto() {
        StringBuilder sb = new StringBuilder();
        if (endereco != null && !endereco.isBlank()) {
            sb.append(endereco);
        }
        if (cidade != null && !cidade.isBlank()) {
            if (!sb.isEmpty())
                sb.append(", ");
            sb.append(cidade);
        }
        if (estado != null && !estado.isBlank()) {
            if (!sb.isEmpty())
                sb.append(" - ");
            sb.append(estado);
        }
        if (cep != null && !cep.isBlank()) {
            if (!sb.isEmpty())
                sb.append(" - ");
            sb.append(cep);
        }
        return sb.toString();
    }
}
