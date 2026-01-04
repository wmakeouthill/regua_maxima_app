import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonButton, IonSpinner, IonIcon, IonFab, IonFabButton, IonItemSliding, IonItemOptions,
    IonItemOption, IonReorder, IonReorderGroup, IonBadge,
    ToastController, AlertController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline, createOutline, trashOutline, reorderThreeOutline,
    cutOutline, cashOutline, timeOutline
} from 'ionicons/icons';

import { BarbeariaService } from '../../../core/services/barbearia.service';
import {
    Servico, CriarServicoDTO, AtualizarServicoDTO, ICONES_SERVICOS
} from '../../../core/models/barbearia.model';

@Component({
    selector: 'app-servicos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
        IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
        IonButton, IonSpinner, IonIcon, IonFab, IonFabButton, IonItemSliding, IonItemOptions,
        IonItemOption, IonReorder, IonReorderGroup, IonBadge
    ],
    template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/admin/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Serviços</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (carregando()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando serviços...</p>
        </div>
      } @else if (servicos().length === 0) {
        <div class="empty-state">
          <ion-icon name="cut-outline"></ion-icon>
          <h2>Nenhum serviço cadastrado</h2>
          <p>Adicione os serviços oferecidos pela sua barbearia</p>
          <ion-button (click)="abrirModalServico()">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Adicionar Serviço
          </ion-button>
        </div>
      } @else {
        <ion-list>
          <ion-reorder-group [disabled]="false" (ionItemReorder)="reordenar($event)">
            @for (servico of servicos(); track servico.id) {
              <ion-item-sliding>
                <ion-item>
                  <ion-icon [name]="servico.icone || 'cut-outline'" slot="start" color="primary"></ion-icon>
                  <ion-label>
                    <h2>{{ servico.nome }}</h2>
                    <p>{{ servico.descricao }}</p>
                    <div class="servico-meta">
                      <ion-badge color="success">
                        <ion-icon name="cash-outline"></ion-icon>
                        {{ servico.precoFormatado }}
                      </ion-badge>
                      <ion-badge color="medium">
                        <ion-icon name="time-outline"></ion-icon>
                        {{ servico.duracaoFormatada }}
                      </ion-badge>
                    </div>
                  </ion-label>
                  <ion-reorder slot="end"></ion-reorder>
                </ion-item>

                <ion-item-options side="end">
                  <ion-item-option color="primary" (click)="abrirModalServico(servico)">
                    <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                  </ion-item-option>
                  <ion-item-option color="danger" (click)="confirmarRemocao(servico)">
                    <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                  </ion-item-option>
                </ion-item-options>
              </ion-item-sliding>
            }
          </ion-reorder-group>
        </ion-list>
      }

      <!-- FAB para adicionar -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="abrirModalServico()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Modal de Serviço -->
      @if (modalAberto()) {
        <div class="modal-backdrop" (click)="fecharModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ servicoEditando() ? 'Editar Serviço' : 'Novo Serviço' }}</h2>
              <ion-button fill="clear" (click)="fecharModal()">
                <ion-icon name="close-outline"></ion-icon>
              </ion-button>
            </div>

            <div class="modal-body">
              <ion-list>
                <ion-item>
                  <ion-input
                    [(ngModel)]="formServico.nome"
                    label="Nome do Serviço *"
                    labelPlacement="stacked"
                    placeholder="Ex: Corte Masculino"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-textarea
                    [(ngModel)]="formServico.descricao"
                    label="Descrição"
                    labelPlacement="stacked"
                    placeholder="Descreva o serviço..."
                    [rows]="2"
                  ></ion-textarea>
                </ion-item>

                <ion-item>
                  <ion-input
                    [(ngModel)]="formServico.preco"
                    label="Preço (R$) *"
                    labelPlacement="stacked"
                    type="number"
                    placeholder="0.00"
                    [min]="0"
                    [step]="0.01"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-input
                    [(ngModel)]="formServico.duracaoMinutos"
                    label="Duração (minutos) *"
                    labelPlacement="stacked"
                    type="number"
                    placeholder="30"
                    [min]="5"
                    [max]="480"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-select
                    [(ngModel)]="formServico.icone"
                    label="Ícone"
                    labelPlacement="stacked"
                    placeholder="Selecione"
                    interface="action-sheet"
                  >
                    @for (icone of icones; track icone.value) {
                      <ion-select-option [value]="icone.value">
                        {{ icone.label }}
                      </ion-select-option>
                    }
                  </ion-select>
                </ion-item>
              </ion-list>
            </div>

            <div class="modal-footer">
              <ion-button fill="outline" (click)="fecharModal()">
                Cancelar
              </ion-button>
              <ion-button 
                (click)="salvarServico()" 
                [disabled]="!formValido() || salvando()"
              >
                @if (salvando()) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  {{ servicoEditando() ? 'Salvar' : 'Adicionar' }}
                }
              </ion-button>
            </div>
          </div>
        </div>
      }
    </ion-content>
  `,
    styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      
      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      padding: 20px;
      text-align: center;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h2 {
        margin: 0;
        color: var(--ion-color-dark);
      }

      p {
        color: var(--ion-color-medium);
        margin: 8px 0 24px;
      }
    }

    .servico-meta {
      display: flex;
      gap: 8px;
      margin-top: 8px;

      ion-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;

        ion-icon {
          font-size: 12px;
        }
      }
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    }

    .modal-content {
      background: var(--ion-background-color);
      border-radius: 16px;
      width: 100%;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--ion-color-light);

      h2 {
        margin: 0;
        font-size: 1.2rem;
      }
    }

    .modal-body {
      padding: 8px 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid var(--ion-color-light);
    }
  `]
})
export class ServicosPage implements OnInit {
    private readonly barbeariaService = inject(BarbeariaService);
    private readonly toastController = inject(ToastController);
    private readonly alertController = inject(AlertController);

    readonly icones = ICONES_SERVICOS;
    readonly carregando = signal(false);
    readonly salvando = signal(false);
    readonly modalAberto = signal(false);
    readonly servicoEditando = signal<Servico | null>(null);

    readonly servicos = this.barbeariaService.meusServicos;

    formServico = {
        nome: '',
        descricao: '',
        preco: 0,
        duracaoMinutos: 30,
        icone: 'cut-outline'
    };

    readonly formValido = computed(() =>
        this.formServico.nome.length >= 2 &&
        this.formServico.preco > 0 &&
        this.formServico.duracaoMinutos >= 5
    );

    constructor() {
        addIcons({
            addOutline, createOutline, trashOutline, reorderThreeOutline,
            cutOutline, cashOutline, timeOutline
        });
    }

    ngOnInit(): void {
        this.carregarServicos();
    }

    private carregarServicos(): void {
        this.carregando.set(true);
        this.barbeariaService.buscarMinha().subscribe({
            next: () => this.carregando.set(false),
            error: () => {
                this.carregando.set(false);
                this.mostrarToast('Erro ao carregar serviços', 'danger');
            }
        });
    }

    abrirModalServico(servico?: Servico): void {
        if (servico) {
            this.servicoEditando.set(servico);
            this.formServico = {
                nome: servico.nome,
                descricao: servico.descricao || '',
                preco: servico.preco,
                duracaoMinutos: servico.duracaoMinutos,
                icone: servico.icone || 'cut-outline'
            };
        } else {
            this.servicoEditando.set(null);
            this.formServico = {
                nome: '',
                descricao: '',
                preco: 0,
                duracaoMinutos: 30,
                icone: 'cut-outline'
            };
        }
        this.modalAberto.set(true);
    }

    fecharModal(): void {
        this.modalAberto.set(false);
        this.servicoEditando.set(null);
    }

    salvarServico(): void {
        if (!this.formValido()) return;

        this.salvando.set(true);
        const editando = this.servicoEditando();

        if (editando) {
            // Atualizar
            const dto: AtualizarServicoDTO = this.formServico;
            this.barbeariaService.atualizarServico(editando.id, dto).subscribe({
                next: () => {
                    this.salvando.set(false);
                    this.fecharModal();
                    this.mostrarToast('Serviço atualizado!', 'success');
                },
                error: (err) => {
                    this.salvando.set(false);
                    this.mostrarToast(err.error?.erro || 'Erro ao atualizar', 'danger');
                }
            });
        } else {
            // Criar
            const dto: CriarServicoDTO = this.formServico;
            this.barbeariaService.adicionarServico(dto).subscribe({
                next: () => {
                    this.salvando.set(false);
                    this.fecharModal();
                    this.mostrarToast('Serviço adicionado!', 'success');
                },
                error: (err) => {
                    this.salvando.set(false);
                    this.mostrarToast(err.error?.erro || 'Erro ao adicionar', 'danger');
                }
            });
        }
    }

    async confirmarRemocao(servico: Servico): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Remover Serviço',
            message: `Deseja remover o serviço "${servico.nome}"?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Remover',
                    role: 'destructive',
                    handler: () => this.removerServico(servico.id)
                }
            ]
        });
        await alert.present();
    }

    private removerServico(id: number): void {
        this.barbeariaService.removerServico(id).subscribe({
            next: () => this.mostrarToast('Serviço removido', 'success'),
            error: () => this.mostrarToast('Erro ao remover', 'danger')
        });
    }

    reordenar(event: CustomEvent): void {
        const { from, to } = event.detail;
        // TODO: Implementar reordenação no backend
        event.detail.complete();
    }

    private async mostrarToast(message: string, color: string): Promise<void> {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color,
            position: 'bottom'
        });
        await toast.present();
    }
}
