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
    IonList, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonButton, IonSpinner, IonText, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonToggle, EnderecoAutocompleteComponent, MapaComponent
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
          <p>Carregando informações...</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="salvar()">
          
          <!-- Dados Básicos -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="business-outline"></ion-icon>
                Dados Básicos
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item>
                  <ion-input
                    formControlName="nome"
                    label="Nome da Barbearia"
                    labelPlacement="floating"
                    placeholder="Ex: Barbearia do Silva"
                  ></ion-input>
                </ion-item>
                @if (form.get('nome')?.touched && form.get('nome')?.errors?.['required']) {
                  <ion-text color="danger" class="error-text">
                    <small>Nome é obrigatório</small>
                  </ion-text>
                }

                <ion-item>
                  <ion-textarea
                    formControlName="sobre"
                    label="Sobre"
                    labelPlacement="floating"
                    rows="3"
                    placeholder="Descreva sua barbearia..."
                  ></ion-textarea>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Localização -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="location-outline"></ion-icon>
                Localização
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              
              <!-- Map Integration -->
              <app-endereco-autocomplete
                 (localizacaoSelecionada)="onEnderecoSelecionado($event)"
              ></app-endereco-autocomplete>

              <div class="map-preview ion-margin-bottom">
                  <app-mapa
                    [center]="mapCenter"
                    [markers]="mapMarkers"
                    [zoom]="15"
                    height="200px"
                    (mapClick)="onMapClick($event)"
                  ></app-mapa>
                  <p class="ion-text-center ion-no-margin">
                    <small class="text-medium">Você pode ajustar o pino no mapa clicando no local exato.</small>
                  </p>
              </div>

              <ion-list lines="none">
                <ion-item>
                  <ion-input
                    formControlName="endereco"
                    label="Endereço Completo"
                    labelPlacement="floating"
                    placeholder="Rua, Número, Bairro"
                  ></ion-input>
                </ion-item>

                <div class="form-row">
                  <ion-item class="flex-item">
                    <ion-input
                      formControlName="cidade"
                      label="Cidade"
                      labelPlacement="floating"
                    ></ion-input>
                  </ion-item>

                  <ion-item class="flex-item-small">
                    <ion-select
                      formControlName="estado"
                      label="UF"
                      labelPlacement="floating"
                      interface="popover"
                    >
                      @for (uf of estados; track uf) {
                        <ion-select-option [value]="uf">{{ uf }}</ion-select-option>
                      }
                    </ion-select>
                  </ion-item>
                </div>
                
                <div class="form-row">
                    <ion-item class="flex-item">
                        <ion-input
                          formControlName="latitude"
                          type="number"
                          label="Latitude"
                          labelPlacement="floating"
                          step="0.000001"
                        ></ion-input>
                    </ion-item>
                    <ion-item class="flex-item">
                        <ion-input
                          formControlName="longitude"
                          type="number"
                          label="Longitude"
                          labelPlacement="floating"
                          step="0.000001"
                        ></ion-input>
                    </ion-item>
                </div>

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
              <ion-list lines="none">
                <ion-item>
                  <ion-icon name="call-outline" slot="start"></ion-icon>
                  <ion-input
                    formControlName="telefone"
                    type="tel"
                    label="Telefone"
                    labelPlacement="floating"
                    placeholder="(11) 99999-9999"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-icon name="logo-whatsapp" slot="start" color="success"></ion-icon>
                  <ion-input
                    formControlName="whatsapp"
                    type="tel"
                    label="WhatsApp"
                    labelPlacement="floating"
                    placeholder="(11) 99999-9999"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-icon name="mail-outline" slot="start"></ion-icon>
                  <ion-input
                    formControlName="emailContato"
                    type="email"
                    label="E-mail Público"
                    labelPlacement="floating"
                    placeholder="contato@barbearia.com"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-icon name="logo-instagram" slot="start" color="tertiary"></ion-icon>
                  <ion-input
                    formControlName="instagram"
                    label="Instagram"
                    labelPlacement="floating"
                    placeholder="@suabarbearia"
                  ></ion-input>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Status -->
          <ion-card>
            <ion-card-content>
               <ion-item lines="none">
                  <ion-toggle formControlName="ativo">Barbearia Ativa</ion-toggle>
               </ion-item>
               <ion-text color="medium" class="ion-padding-start">
                 <small>Se desativada, a barbearia não aparecerá para os clientes.</small>
               </ion-text>
            </ion-card-content>
          </ion-card>

          <!-- Botões de Ação -->
          <div class="action-buttons">
            <ion-button 
               expand="block" 
               type="submit" 
               [disabled]="!form.valid || salvando()"
               class="ion-margin-bottom"
            >
              @if (salvando()) {
                <ion-spinner name="crescent" slot="start"></ion-spinner>
                Salvando...
              } @else {
                <ion-icon name="save-outline" slot="start"></ion-icon>
                {{ possuiBarbearia() ? 'Atualizar Barbearia' : 'Criar Barbearia' }}
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

    .form-row {
      display: flex;
      gap: 8px;
    }

    .flex-item {
      flex: 1;
    }

    .flex-item-small {
      width: 80px;
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
  private fb = inject(FormBuilder);
  private barbeariaService = inject(BarbeariaService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  carregando = signal(true);
  salvando = signal(false);
  possuiBarbearia = signal(false);
  barbeariaId = signal<number | null>(null);

  estados = ESTADOS_BR;

  // Map state
  mapCenter: google.maps.LatLngLiteral = { lat: -23.550520, lng: -46.633308 };
  mapMarkers: MapMarkerOptions[] = [];

  form: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    sobre: [''],
    endereco: ['', Validators.required],
    bairro: [''],
    cidade: ['', Validators.required],
    estado: ['', Validators.required],
    cep: [''],
    latitude: [null],
    longitude: [null],
    telefone: ['', Validators.required],
    whatsapp: [''],
    emailContato: ['', [Validators.email]],
    instagram: [''],
    ativo: [true]
  });

  constructor() {
    addIcons({
      businessOutline, locationOutline, callOutline, logoWhatsapp,
      mailOutline, logoInstagram, saveOutline, trashOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.barbeariaService.buscarMinha().subscribe({
      next: (barbearia) => {
        if (barbearia) {
          this.possuiBarbearia.set(true);
          this.barbeariaId.set(barbearia.id);
          this.preencherFormulario(barbearia);
        } else {
          this.possuiBarbearia.set(false);
        }
        this.carregando.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar barbearia', error);
        this.carregando.set(false);
      }
    });
  }

  preencherFormulario(barbearia: Barbearia) {
    this.form.patchValue({
      nome: barbearia.nome,
      sobre: barbearia.sobre,
      endereco: barbearia.endereco,
      bairro: barbearia.bairro,
      cidade: barbearia.cidade,
      estado: barbearia.estado,
      cep: barbearia.cep,
      latitude: barbearia.latitude,
      longitude: barbearia.longitude,
      telefone: barbearia.telefone,
      whatsapp: barbearia.whatsapp,
      emailContato: barbearia.emailContato,
      instagram: barbearia.instagram,
      ativo: barbearia.ativo
    });

    if (barbearia.latitude && barbearia.longitude) {
      this.atualizarMapa({ lat: barbearia.latitude, lng: barbearia.longitude });
    }
  }

  onEnderecoSelecionado(loc: GeoLocation) {
    this.form.patchValue({
      endereco: loc.address, // O endereço completo ou parte dele
      // Idealmente parsearíamos os componentes do endereço se necessário
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
      options: { draggable: true }
    }];
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    const dados = this.form.value;

    if (this.possuiBarbearia()) {
      const id = this.barbeariaId();
      if (id) {
        this.barbeariaService.atualizar(dados as AtualizarBarbeariaDTO).subscribe({
          next: () => {
            this.salvando.set(false);
            this.mostrarToast('Barbearia atualizada com sucesso!', 'success');
          },
          error: (err) => {
            this.salvando.set(false);
            this.mostrarToast('Erro ao atualizar barbearia.', 'danger');
            console.error(err);
          }
        });
      }
    } else {
      this.barbeariaService.criar(dados as CriarBarbeariaDTO).subscribe({
        next: (novaBarbearia) => {
          this.salvando.set(false);
          this.possuiBarbearia.set(true);
          this.barbeariaId.set(novaBarbearia.id);
          this.mostrarToast('Barbearia criada com sucesso!', 'success');
        },
        error: (err) => {
          this.salvando.set(false);
          this.mostrarToast('Erro ao criar barbearia.', 'danger');
          console.error(err);
        }
      });
    }
  }

  async mostrarToast(mensagem: string, cor: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'bottom'
    });
    await toast.present();
  }
}
