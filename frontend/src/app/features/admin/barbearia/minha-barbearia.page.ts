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
  mailOutline, logoInstagram, saveOutline, trashOutline, checkmarkCircleOutline,
  imageOutline, cameraOutline, closeCircleOutline
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

          <!-- Foto da Barbearia -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="image-outline"></ion-icon>
                Foto Principal
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="photo-upload-container">
                @if (fotoPreview()) {
                  <div class="photo-preview">
                    <img [src]="fotoPreview()" alt="Foto da Barbearia" />
                    <ion-button fill="clear" color="danger" class="remove-photo-btn" (click)="removerFoto()">
                      <ion-icon name="close-circle-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                  </div>
                } @else {
                  <div class="photo-placeholder" (click)="fileInput.click()">
                    <ion-icon name="camera-outline"></ion-icon>
                    <p>Clique para adicionar foto</p>
                  </div>
                }
                <input #fileInput type="file" accept="image/*" hidden (change)="onFotoSelecionada($event)" />
                @if (fotoPreview()) {
                  <ion-button fill="outline" expand="block" (click)="fileInput.click()" class="ion-margin-top">
                    <ion-icon name="camera-outline" slot="start"></ion-icon>
                    Alterar Foto
                  </ion-button>
                }
              </div>
              <p class="photo-hint"><small>Recomendado: imagem 800x600px ou maior</small></p>
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
                      interface="action-sheet"
                    >
                      @for (uf of estados; track uf.sigla) {
                        <ion-select-option [value]="uf.sigla">{{ uf.sigla }}</ion-select-option>
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
      width: 100px;
      min-width: 100px;
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

    .photo-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .photo-preview {
      position: relative;
      width: 100%;
      max-width: 300px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);

      img {
        width: 100%;
        height: auto;
        display: block;
      }
    }

    .remove-photo-btn {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .photo-placeholder {
      width: 100%;
      max-width: 300px;
      height: 200px;
      border: 2px dashed var(--ion-color-medium);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-primary-tint);
      }

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
      }

      p {
        margin: 8px 0 0 0;
        color: var(--ion-color-medium);
      }
    }

    .photo-hint {
      text-align: center;
      color: var(--ion-color-medium);
      margin-top: 12px;
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
  fotoPreview = signal<string | null>(null);

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
    fotoUrl: [''],
    ativo: [true]
  });

  constructor() {
    addIcons({
      businessOutline, locationOutline, callOutline, logoWhatsapp,
      mailOutline, logoInstagram, saveOutline, trashOutline, checkmarkCircleOutline,
      imageOutline, cameraOutline, closeCircleOutline
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
      fotoUrl: barbearia.fotoUrl,
      ativo: barbearia.ativo
    });

    // Carregar preview da foto existente
    if (barbearia.fotoUrl) {
      this.fotoPreview.set(barbearia.fotoUrl);
    }

    if (barbearia.latitude && barbearia.longitude) {
      this.atualizarMapa({ lat: barbearia.latitude, lng: barbearia.longitude });
    }
  }

  onEnderecoSelecionado(loc: GeoLocation) {
    this.form.patchValue({
      endereco: loc.address,
      cidade: loc.cidade || '',
      estado: loc.estado || '',
      bairro: loc.bairro || '',
      cep: loc.cep || '',
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

  /**
   * Handler para seleção de foto via input file.
   * Converte a imagem para base64 e atualiza preview e form.
   */
  onFotoSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.mostrarToast('Imagem muito grande. Máximo 2MB.', 'danger');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.mostrarToast('Arquivo deve ser uma imagem.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const base64 = e.target?.result as string;

      // Redimensionar se necessário (opcional, para economia)
      this.resizeImage(base64, 800, 600).then(resizedBase64 => {
        this.fotoPreview.set(resizedBase64);
        this.form.patchValue({ fotoUrl: resizedBase64 });
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove a foto atual.
   */
  removerFoto(): void {
    this.fotoPreview.set(null);
    this.form.patchValue({ fotoUrl: '' });
  }

  /**
   * Redimensiona imagem mantendo proporção.
   */
  private resizeImage(base64: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nova dimensão mantendo proporção
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = base64;
    });
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
