import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { Router } from '@angular/router';
import { AvaliacaoService, AvaliacaoDTO } from '../../../core/services/avaliacao.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

// ========================================================
// Régua Máxima - Página Minhas Avaliações
// ========================================================

@Component({
    selector: 'app-minhas-avaliacoes',
    standalone: true,
    imports: [CommonModule, IonicModule, StarRatingComponent],
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Minhas Avaliações</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (carregando() && avaliacoes().length === 0) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando avaliações...</p>
        </div>
      } @else if (avaliacoes().length === 0) {
        <div class="empty-state">
          <ion-icon name="star-outline"></ion-icon>
          <h2>Nenhuma avaliação ainda</h2>
          <p>Suas avaliações aparecerão aqui após você avaliar um atendimento.</p>
        </div>
      } @else {
        <ion-list>
          @for (avaliacao of avaliacoes(); track avaliacao.id) {
            <ion-card class="avaliacao-card">
              <ion-card-header>
                <div class="card-header-content">
                  <div class="avaliacao-info">
                    <ion-chip [color]="getTipoColor(avaliacao.tipo)" size="small">
                      {{ getTipoLabel(avaliacao.tipo) }}
                    </ion-chip>
                    <span class="data">{{ formatarData(avaliacao.dataCriacao) }}</span>
                  </div>
                  <app-star-rating
                    [value]="avaliacao.nota"
                    [readonly]="true"
                    size="small"
                    [showValue]="true"
                  ></app-star-rating>
                </div>
              </ion-card-header>

              <ion-card-content>
                <!-- Info do avaliado -->
                <div class="avaliado-info">
                  @if (avaliacao.barbeariaNome) {
                    <p class="nome-avaliado">
                      <ion-icon name="business-outline"></ion-icon>
                      {{ avaliacao.barbeariaNome }}
                    </p>
                  }
                  @if (avaliacao.barbeiroNome && avaliacao.tipo === 'BARBEIRO') {
                    <p class="nome-avaliado">
                      <ion-icon name="person-outline"></ion-icon>
                      {{ avaliacao.barbeiroNome }}
                    </p>
                  }
                </div>

                <!-- Comentário -->
                @if (avaliacao.comentario) {
                  <div class="comentario">
                    <p>{{ avaliacao.comentario }}</p>
                  </div>
                }

                <!-- Resposta -->
                @if (avaliacao.resposta) {
                  <div class="resposta">
                    <div class="resposta-header">
                      <ion-icon name="chatbubble-outline"></ion-icon>
                      <span>Resposta da barbearia</span>
                    </div>
                    <p>{{ avaliacao.resposta }}</p>
                    @if (avaliacao.dataResposta) {
                      <span class="data-resposta">
                        {{ formatarData(avaliacao.dataResposta) }}
                      </span>
                    }
                  </div>
                }

                <!-- Indicador anônimo -->
                @if (avaliacao.anonima) {
                  <ion-chip color="medium" size="small" class="chip-anonimo">
                    <ion-icon name="eye-off-outline"></ion-icon>
                    <ion-label>Avaliação anônima</ion-label>
                  </ion-chip>
                }
              </ion-card-content>
            </ion-card>
          }
        </ion-list>
      }
    </ion-content>
  `,
    styles: [`
    .loading-container, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
      padding: 24px;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px;
        color: var(--ion-color-dark);
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    ion-list {
      padding: 8px 16px 16px;
      background: transparent;
    }

    .avaliacao-card {
      margin: 0 0 12px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      ion-card-header {
        padding-bottom: 8px;
      }

      .card-header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .avaliacao-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          ion-chip {
            margin: 0;
            height: 24px;
          }

          .data {
            font-size: 12px;
            color: var(--ion-color-medium);
          }
        }
      }

      ion-card-content {
        padding-top: 0;
      }

      .avaliado-info {
        margin-bottom: 12px;

        .nome-avaliado {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 4px;
          font-size: 14px;
          color: var(--ion-color-dark);

          ion-icon {
            font-size: 16px;
            color: var(--ion-color-primary);
          }
        }
      }

      .comentario {
        background: var(--ion-color-light);
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;

        p {
          margin: 0;
          font-size: 14px;
          color: var(--ion-color-dark);
          line-height: 1.5;
        }
      }

      .resposta {
        background: var(--ion-color-primary-tint);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid var(--ion-color-primary);
        margin-bottom: 12px;

        .resposta-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--ion-color-primary);

          ion-icon {
            font-size: 14px;
          }
        }

        p {
          margin: 0;
          font-size: 14px;
          color: var(--ion-color-dark);
          line-height: 1.5;
        }

        .data-resposta {
          display: block;
          font-size: 11px;
          color: var(--ion-color-medium);
          margin-top: 8px;
          text-align: right;
        }
      }

      .chip-anonimo {
        margin: 0;
        height: 24px;
        font-size: 11px;
      }
    }
  `],
})
export class MinhasAvaliacoesPage implements OnInit {
    private readonly router = inject(Router);
    readonly avaliacaoService = inject(AvaliacaoService);

    readonly avaliacoes = signal<AvaliacaoDTO[]>([]);
    readonly carregando = signal(true);

    async ngOnInit(): Promise<void> {
        await this.carregarAvaliacoes();
    }

    async carregarAvaliacoes(): Promise<void> {
        try {
            this.carregando.set(true);
            await this.avaliacaoService.carregarMinhasAvaliacoes();
            this.avaliacoes.set(this.avaliacaoService.minhasAvaliacoes());
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        } finally {
            this.carregando.set(false);
        }
    }

    async onRefresh(event: RefresherCustomEvent): Promise<void> {
        await this.carregarAvaliacoes();
        event.target.complete();
    }

    getTipoLabel(tipo: string): string {
        switch (tipo) {
            case 'BARBEARIA': return 'Barbearia';
            case 'BARBEIRO': return 'Barbeiro';
            case 'ATENDIMENTO': return 'Atendimento';
            default: return tipo;
        }
    }

    getTipoColor(tipo: string): string {
        switch (tipo) {
            case 'BARBEARIA': return 'primary';
            case 'BARBEIRO': return 'secondary';
            case 'ATENDIMENTO': return 'tertiary';
            default: return 'medium';
        }
    }

    formatarData(data: string): string {
        return this.avaliacaoService.formatarDataRelativa(data);
    }
}
