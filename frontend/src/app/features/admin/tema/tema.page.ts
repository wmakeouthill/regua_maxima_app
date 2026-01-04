import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonSpinner, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonToggle, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { colorPaletteOutline, saveOutline, refreshOutline } from 'ionicons/icons';

import { BarbeariaService } from '../../../core/services/barbearia.service';
import { BarbeariaTema, TEMA_PADRAO } from '../../../core/models/barbearia.model';

@Component({
    selector: 'app-tema',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
        IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
        IonButton, IonSpinner, IonIcon, IonCard, IonCardHeader, IonCardTitle,
        IonCardContent, IonToggle
    ],
    template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/admin/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Personalizar Tema</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (carregando()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando tema...</p>
        </div>
      } @else {
        <!-- Preview -->
        <ion-card class="preview-card" [style]="previewStyle()">
          <ion-card-header>
            <ion-card-title [style.color]="tema.corTexto">
              Prévia do Tema
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="preview-content">
              <div class="preview-header" [style.background]="tema.corPrimaria">
                <span [style.color]="'#fff'">Cabeçalho</span>
              </div>
              <div class="preview-body" [style.background]="tema.corFundo">
                <p [style.color]="tema.corTexto">Texto normal</p>
                <button 
                  class="preview-button" 
                  [style.background]="tema.corSecundaria"
                  [style.color]="'#fff'"
                >
                  Botão
                </button>
                <span 
                  class="preview-highlight" 
                  [style.color]="tema.corDestaque"
                >
                  Destaque
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Configurações de Cores -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="color-palette-outline"></ion-icon>
              Cores
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>Cor Primária</ion-label>
                <input 
                  type="color" 
                  [(ngModel)]="tema.corPrimaria"
                  class="color-input"
                />
                <ion-input
                  [(ngModel)]="tema.corPrimaria"
                  placeholder="#1E3A5F"
                  class="color-text"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label>Cor Secundária</ion-label>
                <input 
                  type="color" 
                  [(ngModel)]="tema.corSecundaria"
                  class="color-input"
                />
                <ion-input
                  [(ngModel)]="tema.corSecundaria"
                  placeholder="#2E5077"
                  class="color-text"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label>Cor de Fundo</ion-label>
                <input 
                  type="color" 
                  [(ngModel)]="tema.corFundo"
                  class="color-input"
                />
                <ion-input
                  [(ngModel)]="tema.corFundo"
                  placeholder="#FFFFFF"
                  class="color-text"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label>Cor do Texto</ion-label>
                <input 
                  type="color" 
                  [(ngModel)]="tema.corTexto"
                  class="color-input"
                />
                <ion-input
                  [(ngModel)]="tema.corTexto"
                  placeholder="#333333"
                  class="color-text"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label>Cor de Destaque</ion-label>
                <input 
                  type="color" 
                  [(ngModel)]="tema.corDestaque"
                  class="color-input"
                />
                <ion-input
                  [(ngModel)]="tema.corDestaque"
                  placeholder="#D4AF37"
                  class="color-text"
                ></ion-input>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Tipografia -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Tipografia</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-select
                  [(ngModel)]="tema.fonteFamilia"
                  label="Fonte"
                  labelPlacement="stacked"
                  interface="action-sheet"
                >
                  <ion-select-option value="Roboto">Roboto</ion-select-option>
                  <ion-select-option value="Open Sans">Open Sans</ion-select-option>
                  <ion-select-option value="Montserrat">Montserrat</ion-select-option>
                  <ion-select-option value="Poppins">Poppins</ion-select-option>
                  <ion-select-option value="Lato">Lato</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label>
                  <h2>Modo Escuro</h2>
                  <p>Aplica tema escuro na tela do cliente</p>
                </ion-label>
                <ion-toggle [(ngModel)]="tema.modoEscuro"></ion-toggle>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Botões -->
        <div class="action-buttons">
          <ion-button 
            expand="block" 
            (click)="salvar()"
            [disabled]="salvando()"
          >
            @if (salvando()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              <ion-icon name="save-outline" slot="start"></ion-icon>
              Salvar Tema
            }
          </ion-button>

          <ion-button 
            expand="block" 
            fill="outline"
            (click)="restaurarPadrao()"
          >
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Restaurar Padrão
          </ion-button>
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

    .preview-card {
      margin-bottom: 16px;
    }

    .preview-content {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ion-color-light);
    }

    .preview-header {
      padding: 12px 16px;
      font-weight: 600;
    }

    .preview-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      p {
        margin: 0;
      }
    }

    .preview-button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }

    .preview-highlight {
      font-weight: 600;
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;

      ion-icon {
        font-size: 1.3rem;
      }
    }

    .color-input {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      padding: 0;
      margin-right: 8px;
    }

    .color-text {
      max-width: 100px;
      text-align: right;
    }

    .action-buttons {
      margin-top: 24px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `]
})
export class TemaPage implements OnInit {
    private readonly barbeariaService = inject(BarbeariaService);
    private readonly toastController = inject(ToastController);

    readonly carregando = signal(false);
    readonly salvando = signal(false);

    tema: BarbeariaTema = { ...TEMA_PADRAO };

    previewStyle = () => ({
        '--preview-bg': this.tema.corFundo,
        'font-family': this.tema.fonteFamilia
    });

    constructor() {
        addIcons({ colorPaletteOutline, saveOutline, refreshOutline });
    }

    ngOnInit(): void {
        this.carregarTema();
    }

    private carregarTema(): void {
        this.carregando.set(true);
        this.barbeariaService.buscarMinha().subscribe({
            next: () => {
                const temaAtual = this.barbeariaService.tema();
                if (temaAtual) {
                    this.tema = { ...temaAtual };
                }
                this.carregando.set(false);
            },
            error: () => {
                this.carregando.set(false);
                this.mostrarToast('Erro ao carregar tema', 'danger');
            }
        });
    }

    salvar(): void {
        this.salvando.set(true);
        this.barbeariaService.atualizarTema(this.tema).subscribe({
            next: () => {
                this.salvando.set(false);
                this.mostrarToast('Tema salvo com sucesso!', 'success');
            },
            error: () => {
                this.salvando.set(false);
                this.mostrarToast('Erro ao salvar tema', 'danger');
            }
        });
    }

    restaurarPadrao(): void {
        this.tema = { ...TEMA_PADRAO };
        this.mostrarToast('Tema restaurado para padrão', 'medium');
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
