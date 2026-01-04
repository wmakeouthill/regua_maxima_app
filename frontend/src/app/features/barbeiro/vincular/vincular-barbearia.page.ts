import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonButton, IonSpinner, IonIcon, IonCard,
    IonCardContent, IonBadge, IonSearchbar,
    IonRefresher, IonRefresherContent, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    storefrontOutline, searchOutline, locationOutline, starOutline,
    linkOutline, unlinkOutline, closeCircleOutline, checkmarkCircleOutline
} from 'ionicons/icons';

import { BarbeiroService } from '../../../core/services/barbeiro.service';
import { BarbeariaService } from '../../../core/services/barbearia.service';
import { BarbeariaResumo } from '../../../core/models/barbearia.model';
import { STATUS_VINCULO_LABEL, STATUS_VINCULO_COR, StatusVinculo } from '../../../core/models/barbeiro.model';

@Component({
    selector: 'app-vincular-barbearia',
    standalone: true,
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
        IonList, IonItem, IonButton, IonSpinner, IonIcon, IonCard,
        IonCardContent, IonBadge, IonSearchbar,
        IonRefresher, IonRefresherContent
    ],
    template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/barbeiro/agenda"></ion-back-button>
        </ion-buttons>
        <ion-title>Vincular a Barbearia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="atualizar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Status Atual -->
      @if (statusVinculo()) {
        <ion-card class="status-card" [class]="'status-' + statusVinculo()">
          <ion-card-content>
            <div class="status-container">
              <div class="status-info">
                <ion-badge [color]="getCorStatus()">
                  {{ getLabelStatus() }}
                </ion-badge>
                @if (barbeariaNome()) {
                  <p class="barbearia-nome">{{ barbeariaNome() }}</p>
                }
              </div>

              @if (statusVinculo() === 'PENDENTE') {
                <ion-button
                  fill="outline"
                  color="danger"
                  size="small"
                  (click)="cancelarSolicitacao()"
                >
                  <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                  Cancelar
                </ion-button>
              }

              @if (statusVinculo() === 'APROVADO') {
                <ion-button
                  fill="outline"
                  color="warning"
                  size="small"
                  (click)="confirmarDesvinculo()"
                >
                  <ion-icon name="unlink-outline" slot="start"></ion-icon>
                  Desvincular
                </ion-button>
              }
            </div>
          </ion-card-content>
        </ion-card>
      }

      <!-- Buscar Barbearias -->
      @if (statusVinculo() !== 'APROVADO' && statusVinculo() !== 'PENDENTE') {
        <div class="ion-padding">
          <ion-searchbar
            placeholder="Buscar barbearia..."
            [debounce]="500"
            (ionInput)="buscar($event)"
          ></ion-searchbar>
        </div>

        @if (carregando()) {
          <div class="loading-container">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Buscando barbearias...</p>
          </div>
        } @else if (barbearias().length === 0) {
          <div class="empty-state">
            <ion-icon name="storefront-outline"></ion-icon>
            <h3>Nenhuma barbearia encontrada</h3>
            <p>Tente buscar por nome ou cidade</p>
          </div>
        } @else {
          <ion-list>
            @for (barbearia of barbearias(); track barbearia.id) {
              <ion-item>
                <div class="barbearia-item">
                  <div class="barbearia-foto">
                    @if (barbearia.fotoUrl) {
                      <img [src]="barbearia.fotoUrl" [alt]="barbearia.nome" />
                    } @else {
                      <ion-icon name="storefront-outline"></ion-icon>
                    }
                  </div>
                  <div class="barbearia-info">
                    <h3>{{ barbearia.nome }}</h3>
                    <p class="cidade">
                      <ion-icon name="location-outline"></ion-icon>
                      {{ barbearia.cidade }}, {{ barbearia.estado }}
                    </p>
                    @if (barbearia.avaliacaoMedia > 0) {
                      <p class="avaliacao">
                        <ion-icon name="star-outline" color="warning"></ion-icon>
                        {{ barbearia.avaliacaoMedia | number:'1.1-1' }}
                        ({{ barbearia.totalAvaliacoes }})
                      </p>
                    }
                  </div>
                  <ion-button
                    fill="outline"
                    size="small"
                    (click)="confirmarSolicitacao(barbearia)"
                    [disabled]="solicitando()"
                  >
                    <ion-icon name="link-outline" slot="start"></ion-icon>
                    Solicitar
                  </ion-button>
                </div>
              </ion-item>
            }
          </ion-list>
        }
      }
    </ion-content>
  `,
    styles: [`
    .status-card {
      margin: 16px;

      .status-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-info {
        .barbearia-nome {
          margin: 8px 0 0 0;
          font-weight: 600;
          font-size: 16px;
        }
      }
    }

    .loading-container, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px 0;
        color: var(--ion-text-color);
      }

      p {
        margin: 0;
      }
    }

    .barbearia-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 0;

      .barbearia-foto {
        width: 56px;
        height: 56px;
        border-radius: 8px;
        background: var(--ion-color-light);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        ion-icon {
          font-size: 28px;
          color: var(--ion-color-medium);
        }
      }

      .barbearia-info {
        flex: 1;

        h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .cidade, .avaliacao {
          margin: 0;
          font-size: 13px;
          color: var(--ion-color-medium);
          display: flex;
          align-items: center;
          gap: 4px;

          ion-icon {
            font-size: 14px;
          }
        }
      }
    }
  `]
})
export class VincularBarbeariaPage implements OnInit {
    private readonly router = inject(Router);
    private readonly barbeiroService = inject(BarbeiroService);
    private readonly barbeariaService = inject(BarbeariaService);
    private readonly toastController = inject(ToastController);
    private readonly alertController = inject(AlertController);

    readonly carregando = signal(false);
    readonly solicitando = signal(false);
    readonly barbearias = signal<BarbeariaResumo[]>([]);
    readonly statusVinculo = signal<StatusVinculo | null>(null);
    readonly barbeariaNome = signal<string | null>(null);

    constructor() {
        addIcons({
            storefrontOutline, searchOutline, locationOutline, starOutline,
            linkOutline, unlinkOutline, closeCircleOutline, checkmarkCircleOutline
        });
    }

    ngOnInit(): void {
        this.carregarStatus();
        this.carregarBarbearias();
    }

    private carregarStatus(): void {
        this.barbeiroService.carregarMeuPerfil().subscribe({
            next: (perfil) => {
                this.statusVinculo.set(perfil.statusVinculo);
                this.barbeariaNome.set(perfil.barbeariaNome);
            }
        });
    }

    private carregarBarbearias(): void {
        this.carregando.set(true);

        // Buscar barbearias ativas
        this.barbeariaService.listar(0, 50).subscribe({
            next: (response) => {
                this.barbearias.set(response.content || []);
                this.carregando.set(false);
            },
            error: () => {
                this.carregando.set(false);
            }
        });
    }

    buscar(event: any): void {
        const termo = event.detail.value?.trim();
        if (!termo) {
            this.carregarBarbearias();
            return;
        }

        this.carregando.set(true);
        this.barbeariaService.buscar(termo, 0, 50).subscribe({
            next: (response) => {
                this.barbearias.set(response.content || []);
                this.carregando.set(false);
            },
            error: () => {
                this.carregando.set(false);
            }
        });
    }

    async confirmarSolicitacao(barbearia: BarbeariaResumo): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Confirmar Solicitação',
            message: `Deseja solicitar vínculo com <strong>${barbearia.nome}</strong>?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Solicitar',
                    handler: () => this.solicitarVinculo(barbearia)
                }
            ]
        });
        await alert.present();
    }

    private async solicitarVinculo(barbearia: BarbeariaResumo): Promise<void> {
        this.solicitando.set(true);

        this.barbeiroService.solicitarVinculo(barbearia.id).subscribe({
            next: async () => {
                this.statusVinculo.set('PENDENTE');
                this.barbeariaNome.set(barbearia.nome);
                this.solicitando.set(false);

                const toast = await this.toastController.create({
                    message: 'Solicitação enviada! Aguarde a aprovação.',
                    duration: 3000,
                    color: 'success'
                });
                await toast.present();
            },
            error: async (error) => {
                this.solicitando.set(false);
                const toast = await this.toastController.create({
                    message: error.error?.message || 'Erro ao solicitar vínculo',
                    duration: 3000,
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    async cancelarSolicitacao(): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Cancelar Solicitação',
            message: 'Deseja cancelar a solicitação de vínculo?',
            buttons: [
                { text: 'Não', role: 'cancel' },
                {
                    text: 'Sim, cancelar',
                    handler: () => {
                        this.barbeiroService.cancelarSolicitacao().subscribe({
                            next: async () => {
                                this.statusVinculo.set('SEM_VINCULO');
                                this.barbeariaNome.set(null);

                                const toast = await this.toastController.create({
                                    message: 'Solicitação cancelada',
                                    duration: 2000,
                                    color: 'success'
                                });
                                await toast.present();
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    async confirmarDesvinculo(): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Desvincular',
            message: `Deseja se desvincular de <strong>${this.barbeariaNome()}</strong>?`,
            buttons: [
                { text: 'Não', role: 'cancel' },
                {
                    text: 'Sim, desvincular',
                    cssClass: 'text-danger',
                    handler: () => {
                        this.barbeiroService.desvincular().subscribe({
                            next: async () => {
                                this.statusVinculo.set('SEM_VINCULO');
                                this.barbeariaNome.set(null);

                                const toast = await this.toastController.create({
                                    message: 'Desvinculado com sucesso',
                                    duration: 2000,
                                    color: 'success'
                                });
                                await toast.present();
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    atualizar(event: any): void {
        this.carregarStatus();
        this.carregarBarbearias();
        event.target.complete();
    }

    getCorStatus(): string {
        const status = this.statusVinculo();
        return status ? STATUS_VINCULO_COR[status] : 'medium';
    }

    getLabelStatus(): string {
        const status = this.statusVinculo();
        return status ? STATUS_VINCULO_LABEL[status] : '';
    }
}
