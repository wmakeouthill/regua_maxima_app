import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonText, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonToggle, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline, locationOutline, callOutline, logoWhatsapp,
  mailOutline, logoInstagram, saveOutline, trashOutline, checkmarkCircleOutline
} from 'ionicons/icons';

import { BarbeariaService } from '../../../core/services/barbearia.service';
import {
  Barbearia, CriarBarbeariaDTO, AtualizarBarbeariaDTO, ESTADOS_BR
} from '../../../core/models/barbearia.model';
import { EnderecoAutocompleteComponent } from '../../../shared/components/endereco-autocomplete/endereco-autocomplete.component';
import { MapaComponent, MapMarkerOptions } from '../../../shared/components/mapa/mapa.component';
import { GeoLocation } from '../../../core/services/google-maps.service';

@Component({
  selector: 'app-minha-barbearia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonButton, IonSpinner, IonText, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonToggle, EnderecoAutocompleteComponent, MapaComponent
  ],
    ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/admin/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ possuiBarbearia() ? 'Minha Barbearia' : 'Cadastrar Barbearia' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (carregando()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando...</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="salvar()">
          <!-- Informações Básicas -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="business-outline"></ion-icon>
                Informações Básicas
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-input
                    formControlName="nome"
                    label="Nome da Barbearia *"
                    labelPlacement="stacked"
                    placeholder="Ex: Barbearia do João"
                    [clearInput]="true"
                  ></ion-input>
                </ion-item>
                @if (form.get('nome')?.touched && form.get('nome')?.errors) {
                  <ion-text color="danger" class="error-text">
                    <small>Nome é obrigatório (2-100 caracteres)</small>
                  </ion-text>
                }

                <ion-item>
                  <ion-textarea
                    formControlName="descricao"
                    label="Descrição"
                    labelPlacement="stacked"
                    placeholder="Descreva sua barbearia..."
                    [autoGrow]="true"
                    [rows]="3"
                  ></ion-textarea>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Endereço -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="location-outline"></ion-icon>
                Endereço
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item lines="none" class="autocomplete-item">
                  <app-endereco-autocomplete
                    (localizacaoSelecionada)="onEnderecoSelecionado($event)"
                    label="Buscar Endereço e Preencher"
                  ></app-endereco-autocomplete>
                </ion-item>

                <ion-item>
                  <ion-input
                    formControlName="endereco"
                    label="Endereço Completo *"
                    labelPlacement="stacked"
                    placeholder="Rua, número, bairro"
                  ></ion-input>
                </ion-item>

                <!-- Mapa Preview -->
                <div class="map-preview ion-margin-bottom">
                  <app-mapa
                    [center]="mapCenter"
                    [markers]="mapMarkers"
                    [zoom]="15"
                    height="200px"
                    (mapClick)="onMapClick($event)"
                  ></app-mapa>
                  <p class="ion-text-center ion-no-margin">
                    <small class="text-medium">Toque no mapa para ajustar a localização exata</small>
                  </p>
                </div>

                <ion-item>
                  <ion-input
                    formControlName="cidade"
                    label="Cidade *"
                    labelPlacement="stacked"
                    placeholder="Cidade"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-select
                    formControlName="estado"
                    label="Estado *"
                    labelPlacement="stacked"
                    placeholder="Selecione"
                    interface="action-sheet"
                  >
                    @for (estado of estados; track estado.sigla) {
                      <ion-select-option [value]="estado.sigla">
                        {{ estado.nome }}
                      </ion-select-option>
                    }
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-input
                    formControlName="cep"
                    label="CEP"
                    labelPlacement="stacked"
                    placeholder="00000-000"
                    [maxlength]="10"
                  ></ion-input>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Contato -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="call-outline"></ion-icon>
                Contato
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-icon name="call-outline" slot="start"></ion-icon>
                  <ion-input
                    formControlName="telefone"
                    label="Telefone"
                    labelPlacement="stacked"
                    placeholder="(00) 0000-0000"
                    type="tel"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-icon name="logo-whatsapp" slot="start" color="success"></ion-icon>
                  <ion-input
                    formControlName="whatsapp"
                    label="WhatsApp"
                    labelPlacement="stacked"
                    placeholder="(00) 00000-0000"
                    type="tel"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-icon name="mail-outline" slot="start"></ion-icon>
                  <ion-input
                    formControlName="email"
                    label="E-mail"
                    labelPlacement="stacked"
                    placeholder="contato@barbearia.com"
                    type="email"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-icon name="logo-instagram" slot="start" color="tertiary"></ion-icon>
                  <ion-input
                    formControlName="instagram"
                    label="Instagram"
                    labelPlacement="stacked"
                    placeholder="@suabarbearia"
                  ></ion-input>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Status (apenas se já existe) -->
          @if (possuiBarbearia()) {
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                  Status
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item>
                  <ion-label>
                    <h2>Barbearia Ativa</h2>
                    <p>Quando desativada, não aparece nas buscas</p>
                  </ion-label>
                  <ion-toggle 
                    [checked]="barbearia()?.ativo" 
                    (ionChange)="toggleAtivo($event)"
                  ></ion-toggle>
                </ion-item>
              </ion-card-content>
            </ion-card>
          }

          <!-- Botões -->
          <div class="action-buttons">
            <ion-button 
              expand="block" 
              type="submit" 
              [disabled]="form.invalid || salvando()"
            >
              @if (salvando()) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                <ion-icon name="save-outline" slot="start"></ion-icon>
                {{ possuiBarbearia() ? 'Salvar Alterações' : 'Cadastrar Barbearia' }}
              }
            </ion-button>
          </div>
        </form>
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

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;

      ion-icon {
        font-size: 1.3rem;
      }
    }

    .error-text {
      display: block;
      padding: 4px 16px;
    }

    .action-buttons {
      margin-top: 24px;
      margin-bottom: 32px;
    }

    .autocomplete-item {
      --padding-start: 0;
      --inner-padding-end: 0;
      margin-bottom: 16px;
    }

    .map-preview {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ion-color-light-shade);
      margin: 0 16px 16px 16px;
    }

    .text-medium {
      color: var(--ion-color-medium);
    }
  `]
})
export class MinhaBarbeariaPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly barbeariaService = inject(BarbeariaService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  readonly estados = ESTADOS_BR;
  readonly carregando = this.barbeariaService.carregando;
  readonly possuiBarbearia = this.barbeariaService.possuiBarbearia;
  readonly barbearia = this.barbeariaService.minhaBarbearia;
  readonly salvando = signal(false);

  // Map State
  mapCenter: google.maps.LatLngLiteral = { lat: -23.550520, lng: -46.633308 };
  mapMarkers: MapMarkerOptions[] = [];

  form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(500)]],
    endereco: ['', [Validators.required, Validators.maxLength(255)]],
    cidade: ['', [Validators.required, Validators.maxLength(100)]],
    estado: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    cep: ['', [Validators.maxLength(10)]],
    telefone: ['', [Validators.maxLength(20)]],
    whatsapp: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    instagram: ['', [Validators.maxLength(100)]],
    latitude: [null],
    longitude: [null]
  });

  constructor() {
    addIcons({
      businessOutline, locationOutline, callOutline, logoWhatsapp,
      mailOutline, logoInstagram, saveOutline, trashOutline, checkmarkCircleOutline
    });
  }

  ngOnInit(): void {
    this.carregarBarbearia();
  }

  private carregarBarbearia(): void {
    this.barbeariaService.buscarMinha().subscribe({
      next: (barbearia) => {
        this.preencherFormulario(barbearia);
      },
      error: (err) => {
        if (err.status !== 404) {
          this.mostrarToast('Erro ao carregar barbearia', 'danger');
        }
      }
    });
  }

  private preencherFormulario(barbearia: Barbearia): void {
    this.form.patchValue({
      nome: barbearia.nome,
      descricao: barbearia.descricao,
      endereco: barbearia.endereco,
      cidade: barbearia.cidade,
      estado: barbearia.estado,
      cep: barbearia.cep,
      telefone: barbearia.telefone,
      whatsapp: barbearia.whatsapp,
      email: barbearia.email,
      instagram: barbearia.instagram,
      latitude: barbearia.latitude,
      longitude: barbearia.longitude
    });

    if (barbearia.latitude && barbearia.longitude) {
      this.atualizarMapa({ lat: barbearia.latitude, lng: barbearia.longitude });
    }
  }

  onEnderecoSelecionado(loc: GeoLocation) {
    // Preencher campos de endereço se disponíveis
    // A API retorna o endereço formatado completo, precisamos parsear ou usar o que temos.
    // O componente autocomplete já retorna o local com coordenadas.

    // Tenta extrair cidade/estado do endereço formatado se possível (simples)
    // Ou idealmente o GoogleMapsService poderia retornar componentes estruturados.
    // Por enquanto vamos preencher o endereço completo no campo endereço e as coordenadas.

    this.form.patchValue({
      endereco: loc.address, // O endereço completo
      latitude: loc.lat,
      longitude: loc.lng
    });

    this.atualizarMapa({ lat: loc.lat, lng: loc.lng });
  }

  onMapClick(coords: google.maps.LatLngLiteral) {
    this.form.patchValue({
      latitude: coords.lat,
      longitude: coords.lng
    });
    this.atualizarMapa(coords);
  }

  private atualizarMapa(coords: google.maps.LatLngLiteral) {
    this.mapCenter = coords;
    this.mapMarkers = [{
      position: coords,
      title: 'Localização da Barbearia',
      options: { draggable: true } // Visual only, drag events to be handled if needed
    }];
  }

  salvar(): void {
    if (this.form.invalid) return;

    this.salvando.set(true);
    const dados = this.form.value;

    if (this.possuiBarbearia()) {
      // Atualizar
      const dto: AtualizarBarbeariaDTO = dados;
      this.barbeariaService.atualizar(dto).subscribe({
        next: () => {
          this.salvando.set(false);
          this.mostrarToast('Barbearia atualizada com sucesso!', 'success');
        },
        error: (err) => {
          this.salvando.set(false);
          this.mostrarToast(err.error?.erro || 'Erro ao atualizar', 'danger');
        }
      });
    } else {
      // Criar
      const dto: CriarBarbeariaDTO = dados;
      this.barbeariaService.criar(dto).subscribe({
        next: () => {
          this.salvando.set(false);
          this.mostrarToast('Barbearia cadastrada com sucesso!', 'success');
          this.router.navigate(['/tabs/admin/dashboard']);
        },
        error: (err) => {
          this.salvando.set(false);
          this.mostrarToast(err.error?.erro || 'Erro ao cadastrar', 'danger');
        }
      });
    }
  }

  async toggleAtivo(event: CustomEvent): Promise<void> {
    const ativo = event.detail.checked;

    if (!ativo) {
      const alert = await this.alertController.create({
        header: 'Desativar Barbearia',
        message: 'Sua barbearia não aparecerá nas buscas. Deseja continuar?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              // Reverter toggle
              event.target && ((event.target as HTMLIonToggleElement).checked = true);
            }
          },
          {
            text: 'Desativar',
            role: 'destructive',
            handler: () => {
              this.barbeariaService.desativar().subscribe({
                next: () => this.mostrarToast('Barbearia desativada', 'warning'),
                error: () => this.mostrarToast('Erro ao desativar', 'danger')
              });
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.barbeariaService.ativar().subscribe({
        next: () => this.mostrarToast('Barbearia ativada!', 'success'),
        error: () => this.mostrarToast('Erro ao ativar', 'danger')
      });
    }
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
