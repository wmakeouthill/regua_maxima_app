import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, InfiniteScrollCustomEvent } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AvaliacaoService, AvaliacaoDTO, ResumoAvaliacoesDTO, PagedResponse } from '../../../core/services/avaliacao.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

// ========================================================
// Régua Máxima - Página Avaliações da Barbearia
// ========================================================

@Component({
    selector: 'app-avaliacoes-barbearia',
    standalone: true,
    imports: [CommonModule, IonicModule, StarRatingComponent],
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/barbearia/' + slug()"></ion-back-button>
        </ion-buttons>
        <ion-title>Avaliações</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (carregando() && avaliacoes().length === 0) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else {
        <!-- Resumo -->
        @if (resumo()) {
          <div class="resumo-container">
            <div class="nota-geral">
              <span class="nota">{{ formatarNota(resumo()!.media) }}</span>
              <app-star-rating
                [value]="resumo()!.media"
                [readonly]="true"
                size="medium"
              ></app-star-rating>
              <span class="total">{{ resumo()!.total }} avaliações</span>
            </div>

            <div class="distribuicao">
              @for (item of distribuicaoOrdenada(); track item.estrelas) {
                <div class="barra-container">
                  <span class="estrela-label">{{ item.estrelas }}</span>
                  <ion-icon name="star"></ion-icon>
                  <div class="barra-bg">
                    <div
                      class="barra-preenchida"
                      [style.width.%]="getPercentual(item.quantidade)"
                    ></div>
                  </div>
                  <span class="quantidade">{{ item.quantidade }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Lista de avaliações -->
        @if (avaliacoes().length === 0) {
          <div class="empty-state">
            <ion-icon name="chatbubbles-outline"></ion-icon>
            <p>Nenhuma avaliação ainda</p>
          </div>
        } @else {
          <ion-list>
            @for (avaliacao of avaliacoes(); track avaliacao.id) {
              <div class="avaliacao-item">
                <div class="avaliacao-header">
                  <div class="cliente-info">
                    @if (avaliacao.clienteFoto) {
                      <img [src]="avaliacao.clienteFoto" alt="Cliente" class="cliente-foto" />
                    } @else {
                      <div class="cliente-foto placeholder">
                        <ion-icon name="person"></ion-icon>
                      </div>
                    }
                    <div class="cliente-dados">
                      <span class="nome">{{ avaliacao.clienteNome }}</span>
                      <span class="data">{{ formatarData(avaliacao.dataCriacao) }}</span>
                    </div>
                  </div>
                  <app-star-rating
                    [value]="avaliacao.nota"
                    [readonly]="true"
                    size="small"
                  ></app-star-rating>
                </div>

                @if (avaliacao.comentario) {
                  <p class="comentario">{{ avaliacao.comentario }}</p>
                }

                @if (avaliacao.resposta) {
                  <div class="resposta">
                    <div class="resposta-header">
                      <ion-icon name="chatbubble-outline"></ion-icon>
                      <span>Resposta</span>
                    </div>
                    <p>{{ avaliacao.resposta }}</p>
                  </div>
                }
              </div>
            }
          </ion-list>

          <ion-infinite-scroll
            [disabled]="!temMais()"
            (ionInfinite)="carregarMais($event)"
          >
            <ion-infinite-scroll-content
              loadingSpinner="crescent"
              loadingText="Carregando mais..."
            ></ion-infinite-scroll-content>
          </ion-infinite-scroll>
        }
      }
    </ion-content>
  `,
    styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .resumo-container {
      background: var(--ion-color-light);
      padding: 20px;
      margin: 16px;
      border-radius: 16px;

      .nota-geral {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--ion-color-step-200);

        .nota {
          font-size: 48px;
          font-weight: 700;
          color: var(--ion-color-dark);
          line-height: 1;
        }

        app-star-rating {
          margin: 8px 0;
        }

        .total {
          font-size: 14px;
          color: var(--ion-color-medium);
        }
      }

      .distribuicao {
        .barra-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .estrela-label {
            width: 12px;
            text-align: right;
            font-size: 14px;
            color: var(--ion-color-dark);
          }

          ion-icon {
            font-size: 14px;
            color: #FFD700;
          }

          .barra-bg {
            flex: 1;
            height: 8px;
            background: var(--ion-color-step-200);
            border-radius: 4px;
            overflow: hidden;

            .barra-preenchida {
              height: 100%;
              background: var(--ion-color-primary);
              border-radius: 4px;
              transition: width 0.3s ease;
            }
          }

          .quantidade {
            width: 32px;
            font-size: 13px;
            color: var(--ion-color-medium);
            text-align: right;
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 12px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    ion-list {
      padding: 0 16px 16px;
      background: transparent;
    }

    .avaliacao-item {
      background: white;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .avaliacao-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .cliente-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .cliente-foto {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;

            &.placeholder {
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--ion-color-light);

              ion-icon {
                font-size: 20px;
                color: var(--ion-color-medium);
              }
            }
          }

          .cliente-dados {
            display: flex;
            flex-direction: column;

            .nome {
              font-weight: 600;
              color: var(--ion-color-dark);
              font-size: 14px;
            }

            .data {
              font-size: 12px;
              color: var(--ion-color-medium);
            }
          }
        }
      }

      .comentario {
        margin: 0 0 12px;
        font-size: 14px;
        color: var(--ion-color-dark);
        line-height: 1.5;
      }

      .resposta {
        background: var(--ion-color-light);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid var(--ion-color-primary);

        .resposta-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--ion-color-primary);

          ion-icon {
            font-size: 14px;
          }
        }

        p {
          margin: 0;
          font-size: 13px;
          color: var(--ion-color-dark);
          line-height: 1.4;
        }
      }
    }
  `],
})
export class AvaliacoesBarbeariaPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly avaliacaoService = inject(AvaliacaoService);

    readonly slug = signal('');
    readonly barbeariaId = signal<number | null>(null);
    readonly avaliacoes = signal<AvaliacaoDTO[]>([]);
    readonly resumo = signal<ResumoAvaliacoesDTO | null>(null);
    readonly carregando = signal(true);
    readonly paginaAtual = signal(0);
    readonly temMais = signal(true);

    readonly distribuicaoOrdenada = computed(() => {
        const r = this.resumo();
        if (!r) return [];

        const items: Array<{ estrelas: number; quantidade: number }> = [];
        for (let i = 5; i >= 1; i--) {
            items.push({
                estrelas: i,
                quantidade: r.distribuicao[i] || 0,
            });
        }
        return items;
    });

    async ngOnInit(): Promise<void> {
        const params = this.route.snapshot.params;
        const queryParams = this.route.snapshot.queryParams;

        this.slug.set(params['slug'] || '');
        this.barbeariaId.set(queryParams['id'] ? +queryParams['id'] : null);

        if (this.barbeariaId()) {
            await this.carregarDados();
        }
    }

    async carregarDados(): Promise<void> {
        try {
            this.carregando.set(true);

            const [resumo, pagina] = await Promise.all([
                this.avaliacaoService.obterResumoBarbearia(this.barbeariaId()!),
                this.avaliacaoService.listarAvaliacoesBarbearia(this.barbeariaId()!, 0, 10),
            ]);

            this.resumo.set(resumo);
            this.avaliacoes.set(pagina.content);
            this.temMais.set(!pagina.last);
            this.paginaAtual.set(0);
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        } finally {
            this.carregando.set(false);
        }
    }

    async carregarMais(event: InfiniteScrollCustomEvent): Promise<void> {
        if (!this.barbeariaId()) {
            event.target.complete();
            return;
        }

        try {
            const proximaPagina = this.paginaAtual() + 1;
            const pagina = await this.avaliacaoService.listarAvaliacoesBarbearia(
                this.barbeariaId()!,
                proximaPagina,
                10
            );

            this.avaliacoes.update(list => [...list, ...pagina.content]);
            this.temMais.set(!pagina.last);
            this.paginaAtual.set(proximaPagina);
        } catch (error) {
            console.error('Erro ao carregar mais avaliações:', error);
        } finally {
            event.target.complete();
        }
    }

    getPercentual(quantidade: number): number {
        const total = this.resumo()?.total || 0;
        if (total === 0) return 0;
        return (quantidade / total) * 100;
    }

    formatarNota(nota: number): string {
        return nota.toFixed(1);
    }

    formatarData(data: string): string {
        return this.avaliacaoService.formatarDataRelativa(data);
    }
}
