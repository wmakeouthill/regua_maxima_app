import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonButton, IonSpinner, IonIcon, IonCard,
  IonCardContent, IonBadge, IonSegment, IonSegmentButton,
  IonItemSliding, IonItemOptions, IonItemOption, IonAvatar,
  IonRefresher, IonRefresherContent, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline, checkmarkCircleOutline, closeCircleOutline, trashOutline,
  personOutline, starOutline, briefcaseOutline, timeOutline, businessOutline, settingsOutline
} from 'ionicons/icons';

import { BarbeiroService } from '../../../core/services/barbeiro.service';
import { BarbeiroResumo } from '../../../core/models/barbeiro.model';

@Component({
  selector: 'app-gerenciar-barbeiros',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonButton, IonSpinner, IonIcon, IonCard,
    IonCardContent, IonBadge, IonSegment, IonSegmentButton,
    IonItemSliding, IonItemOptions, IonItemOption, IonAvatar,
    IonRefresher, IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/admin/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Barbeiros</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="segmentoAtivo()" (ionChange)="trocarSegmento($event)">
          <ion-segment-button value="equipe">
            <ion-label>Equipe</ion-label>
          </ion-segment-button>
          <ion-segment-button value="solicitacoes">
            <ion-label>
              Solicitações
              @if (solicitacoes().length > 0) {
                <ion-badge color="danger">{{ solicitacoes().length }}</ion-badge>
              }
            </ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="atualizar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (carregando()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando...</p>
        </div>
      } @else if (cadastroIncompleto()) {
        <!-- Cadastro Incompleto -->
        <div class="empty-state warning">
          <ion-icon name="business-outline" color="warning"></ion-icon>
          <h3>Configure sua Barbearia</h3>
          <p>Para gerenciar barbeiros, você precisa primeiro configurar sua barbearia.</p>
          <ion-button fill="outline" routerLink="/tabs/admin/minha-barbearia">
            <ion-icon name="settings-outline" slot="start"></ion-icon>
            Configurar Barbearia
          </ion-button>
        </div>
      } @else {
        @if (segmentoAtivo() === 'equipe') {
          <!-- Lista de Barbeiros da Equipe -->
          @if (barbeiros().length === 0) {
            <div class="empty-state">
              <ion-icon name="people-outline"></ion-icon>
              <h3>Nenhum barbeiro na equipe</h3>
              <p>Quando barbeiros solicitarem vínculo, você poderá aprová-los aqui.</p>
            </div>
          } @else {
            <ion-list>
              @for (barbeiro of barbeiros(); track barbeiro.id) {
                <ion-item-sliding>
                  <ion-item>
                    <ion-avatar slot="start">
                      @if (barbeiro.fotoUrl) {
                        <img [src]="barbeiro.fotoUrl" [alt]="barbeiro.nome" />
                      } @else {
                        <div class="avatar-placeholder">
                          <ion-icon name="person-outline"></ion-icon>
                        </div>
                      }
                    </ion-avatar>
                    <ion-label>
                      <h2>{{ barbeiro.nome }}</h2>
                      <p class="especialidades">{{ barbeiro.especialidades || 'Sem especialidades' }}</p>
                      @if (barbeiro.avaliacaoMedia > 0) {
                        <p class="avaliacao">
                          <ion-icon name="star-outline" color="warning"></ion-icon>
                          {{ barbeiro.avaliacaoMedia | number:'1.1-1' }}
                          ({{ barbeiro.totalAvaliacoes }})
                        </p>
                      }
                    </ion-label>
                  </ion-item>
                  <ion-item-options side="end">
                    <ion-item-option color="danger" (click)="confirmarDesvinculo(barbeiro)">
                      <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                    </ion-item-option>
                  </ion-item-options>
                </ion-item-sliding>
              }
            </ion-list>
          }
        } @else {
          <!-- Lista de Solicitações Pendentes -->
          @if (solicitacoes().length === 0) {
            <div class="empty-state">
              <ion-icon name="time-outline"></ion-icon>
              <h3>Nenhuma solicitação pendente</h3>
              <p>Quando barbeiros solicitarem vínculo, eles aparecerão aqui.</p>
            </div>
          } @else {
            <ion-list>
              @for (barbeiro of solicitacoes(); track barbeiro.id) {
                <ion-card class="solicitacao-card">
                  <ion-card-content>
                    <div class="solicitacao-header">
                      <ion-avatar>
                        @if (barbeiro.fotoUrl) {
                          <img [src]="barbeiro.fotoUrl" [alt]="barbeiro.nome" />
                        } @else {
                          <div class="avatar-placeholder">
                            <ion-icon name="person-outline"></ion-icon>
                          </div>
                        }
                      </ion-avatar>
                      <div class="info">
                        <h3>{{ barbeiro.nome }}</h3>
                        <p>{{ barbeiro.especialidades || 'Sem especialidades informadas' }}</p>
                      </div>
                    </div>
                    <div class="solicitacao-actions">
                      <ion-button
                        fill="outline"
                        color="danger"
                        (click)="rejeitar(barbeiro)"
                        [disabled]="processando()"
                      >
                        <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                        Rejeitar
                      </ion-button>
                      <ion-button
                        color="success"
                        (click)="aprovar(barbeiro)"
                        [disabled]="processando()"
                      >
                        <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                        Aprovar
                      </ion-button>
                    </div>
                  </ion-card-content>
                </ion-card>
              }
            </ion-list>
          }
        }
      }
    </ion-content>
  `,
  styles: [`
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
        margin: 0 0 16px 0;
      }
    }

    ion-segment-button ion-badge {
      margin-left: 8px;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      ion-icon {
        font-size: 24px;
        color: var(--ion-color-medium);
      }
    }

    .especialidades {
      color: var(--ion-color-medium);
      font-size: 13px;
    }

    .avaliacao {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 14px;
      }
    }

    .solicitacao-card {
      margin: 16px;

      .solicitacao-header {
        display: flex;
        align-items: center;
        gap: 12px;

        ion-avatar {
          width: 56px;
          height: 56px;
        }

        .info {
          flex: 1;

          h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 13px;
            color: var(--ion-color-medium);
          }
        }
      }

      .solicitacao-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;

        ion-button {
          flex: 1;
        }
      }
    }
  `]
})
export class GerenciarBarbeirosPage implements OnInit {
  private readonly barbeiroService = inject(BarbeiroService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  readonly carregando = signal(false);
  readonly processando = signal(false);
  readonly segmentoAtivo = signal<'equipe' | 'solicitacoes'>('equipe');
  readonly barbeiros = signal<BarbeiroResumo[]>([]);
  readonly solicitacoes = signal<BarbeiroResumo[]>([]);
  readonly cadastroIncompleto = this.barbeiroService.cadastroIncompleto;

  constructor() {
    addIcons({
      peopleOutline, checkmarkCircleOutline, closeCircleOutline, trashOutline,
      personOutline, starOutline, briefcaseOutline, timeOutline, businessOutline, settingsOutline
    });
  }

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);

    // Carrega barbeiros da equipe
    this.barbeiroService.carregarMeusBarbeiros().subscribe({
      next: (barbeiros) => this.barbeiros.set(barbeiros),
      error: () => {
        this.barbeiros.set([]);
        this.carregando.set(false);
      },
      complete: () => this.carregando.set(false)
    });

    // Carrega solicitações pendentes
    this.barbeiroService.carregarSolicitacoes().subscribe({
      next: (solicitacoes) => this.solicitacoes.set(solicitacoes),
      error: () => this.solicitacoes.set([])
    });
  }

  trocarSegmento(event: any): void {
    this.segmentoAtivo.set(event.detail.value);
  }

  async aprovar(barbeiro: BarbeiroResumo): Promise<void> {
    this.processando.set(true);

    this.barbeiroService.aprovarVinculo(barbeiro.id).subscribe({
      next: async () => {
        // Move para a lista de barbeiros
        this.solicitacoes.update(list => list.filter(b => b.id !== barbeiro.id));
        this.barbeiros.update(list => [...list, barbeiro]);
        this.processando.set(false);

        const toast = await this.toastController.create({
          message: `${barbeiro.nome} aprovado!`,
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (error) => {
        this.processando.set(false);
        const toast = await this.toastController.create({
          message: error.error?.message || 'Erro ao aprovar',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async rejeitar(barbeiro: BarbeiroResumo): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Rejeitar Solicitação',
      message: `Deseja rejeitar a solicitação de ${barbeiro.nome}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rejeitar',
          cssClass: 'text-danger',
          handler: () => {
            this.processando.set(true);

            this.barbeiroService.rejeitarVinculo(barbeiro.id).subscribe({
              next: async () => {
                this.solicitacoes.update(list => list.filter(b => b.id !== barbeiro.id));
                this.processando.set(false);

                const toast = await this.toastController.create({
                  message: 'Solicitação rejeitada',
                  duration: 2000,
                  color: 'warning'
                });
                await toast.present();
              },
              error: async () => {
                this.processando.set(false);
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmarDesvinculo(barbeiro: BarbeiroResumo): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Desvincular Barbeiro',
      message: `Deseja remover ${barbeiro.nome} da sua equipe?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desvincular',
          cssClass: 'text-danger',
          handler: () => {
            this.barbeiroService.desvincularBarbeiro(barbeiro.id).subscribe({
              next: async () => {
                this.barbeiros.update(list => list.filter(b => b.id !== barbeiro.id));

                const toast = await this.toastController.create({
                  message: 'Barbeiro desvinculado',
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
    this.carregar();
    event.target.complete();
  }
}
