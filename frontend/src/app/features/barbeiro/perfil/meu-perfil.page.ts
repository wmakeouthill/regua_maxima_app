import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonToggle, IonBadge, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cutOutline, locationOutline, callOutline, logoWhatsapp,
  logoInstagram, saveOutline, imageOutline, starOutline, briefcaseOutline,
  mapOutline, cloudUploadOutline
} from 'ionicons/icons';

import { BarbeiroService } from '../../../core/services/barbeiro.service';
import { ImageUploadService } from '../../../core/services/image-upload.service';
import { MapaComponent, MapMarkerOptions } from '../../../shared/components/mapa/mapa.component';
import {
  Barbeiro, CriarBarbeiroDTO, AtualizarBarbeiroDTO,
  ESPECIALIDADES_BARBEIRO, STATUS_VINCULO_LABEL, STATUS_VINCULO_COR
} from '../../../core/models/barbeiro.model';

@Component({
  selector: 'app-meu-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonButton, IonSpinner, IonText, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonToggle, IonAvatar, IonBadge, MapaComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/barbeiro/agenda"></ion-back-button>
        </ion-buttons>
        <ion-title>Meu Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (carregando()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando perfil...</p>
        </div>
      } @else {
        <!-- Status do Vínculo -->
        @if (modoEdicao()) {
          <ion-card class="status-card">
            <ion-card-content>
              <div class="status-info">
                <ion-icon name="briefcase-outline"></ion-icon>
                <div>
                  <p class="status-label">Status</p>
                  <ion-badge [color]="getCorStatus()">
                    {{ getLabelStatus() }}
                  </ion-badge>
                  @if (perfil()?.barbeariaNome) {
                    <p class="barbearia-nome">{{ perfil()?.barbeariaNome }}</p>
                  }
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <form [formGroup]="form" (ngSubmit)="salvar()">
          <!-- Dados Básicos -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="person-outline"></ion-icon>
                Dados Profissionais
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-input
                    formControlName="nomeProfissional"
                    label="Nome Profissional"
                    labelPlacement="floating"
                    placeholder="Nome artístico (opcional)"
                  ></ion-input>
                </ion-item>

                <ion-item>
                  <ion-textarea
                    formControlName="bio"
                    label="Bio / Sobre você"
                    labelPlacement="floating"
                    placeholder="Conte um pouco sobre você e seu trabalho..."
                    [rows]="4"
                    [autoGrow]="true"
                  ></ion-textarea>
                </ion-item>

                <ion-item>
                  <ion-select
                    formControlName="especialidadesSelecionadas"
                    label="Especialidades"
                    labelPlacement="floating"
                    [multiple]="true"
                    placeholder="Selecione suas especialidades"
                  >
                    @for (esp of especialidades; track esp) {
                      <ion-select-option [value]="esp">{{ esp }}</ion-select-option>
                    }
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-input
                    formControlName="anosExperiencia"
                    type="number"
                    label="Anos de Experiência"
                    labelPlacement="floating"
                    placeholder="0"
                    [min]="0"
                    [max]="50"
                  ></ion-input>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Imagem -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="image-outline"></ion-icon>
                Foto de Perfil
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="foto-upload-section">
                @if (form.get('fotoUrl')?.value) {
                  <div class="foto-preview">
                    <img [src]="form.get('fotoUrl')?.value" alt="Preview" />
                  </div>
                } @else {
                  <div class="foto-placeholder">
                    <ion-icon name="person-outline"></ion-icon>
                  </div>
                }

                <ion-button
                  expand="block"
                  fill="outline"
                  (click)="selecionarFoto()"
                  [disabled]="uploadandoFoto()"
                  class="ion-margin-top"
                >
                  @if (uploadandoFoto()) {
                    <ion-spinner name="crescent" slot="start"></ion-spinner>
                    Enviando...
                  } @else {
                    <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
                    {{ form.get('fotoUrl')?.value ? 'Trocar Foto' : 'Enviar Foto' }}
                  }
                </ion-button>
              </div>

              <ion-list class="ion-margin-top">
                <ion-item>
                  <ion-input
                    formControlName="fotoUrl"
                    label="Ou cole uma URL"
                    labelPlacement="floating"
                    placeholder="https://..."
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
                  <ion-icon name="logo-instagram" slot="start" color="tertiary"></ion-icon>
                  <ion-input
                    formControlName="instagram"
                    label="Instagram"
                    labelPlacement="floating"
                    placeholder="@seu_perfil"
                  ></ion-input>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Geolocalização -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="map-outline"></ion-icon>
                Localização no Mapa
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-toggle formControlName="visivelMapa" [enableOnOffLabels]="true">
                    Aparecer no mapa
                  </ion-toggle>
                </ion-item>

                @if (form.get('visivelMapa')?.value) {
                  <div class="map-preview ion-margin-top ion-margin-bottom">
                      <app-mapa
                        [center]="mapCenter"
                        [markers]="mapMarkers"
                        [zoom]="15"
                        height="200px"
                        (mapClick)="onMapClick($event)"
                      ></app-mapa>
                      <p class="ion-text-center ion-no-margin">
                        <small class="text-medium">Toque no mapa para definir sua posição exata</small>
                      </p>
                  </div>

                  <ion-item>
                    <ion-input
                      formControlName="latitude"
                      type="number"
                      label="Latitude"
                      labelPlacement="floating"
                      step="0.000001"
                      readonly
                    ></ion-input>
                  </ion-item>

                  <ion-item>
                    <ion-input
                      formControlName="longitude"
                      type="number"
                      label="Longitude"
                      labelPlacement="floating"
                      step="0.000001"
                      readonly
                    ></ion-input>
                  </ion-item>

                  <ion-button
                    expand="block"
                    fill="outline"
                    (click)="obterLocalizacao()"
                    class="ion-margin-top"
                  >
                    <ion-icon name="location-outline" slot="start"></ion-icon>
                    Usar minha localização atual
                  </ion-button>
                }
              </ion-list>
            </ion-card-content>
          </ion-card>

          <!-- Botão Salvar -->
          <ion-button
            expand="block"
            type="submit"
            [disabled]="!form.valid || salvando()"
            class="ion-margin-top"
          >
            @if (salvando()) {
              <ion-spinner name="crescent" slot="start"></ion-spinner>
              Salvando...
            } @else {
              <ion-icon name="save-outline" slot="start"></ion-icon>
              {{ modoEdicao() ? 'Atualizar Perfil' : 'Criar Perfil' }}
            }
          </ion-button>
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
      color: var(--ion-color-medium);
    }

    .status-card {
      ion-card-content {
        padding: 12px 16px;
      }

      .status-info {
        display: flex;
        align-items: center;
        gap: 12px;

        ion-icon {
          font-size: 24px;
          color: var(--ion-color-primary);
        }

        .status-label {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: var(--ion-color-medium);
        }

        .barbearia-nome {
          margin: 4px 0 0 0;
          font-size: 14px;
          font-weight: 500;
        }
      }
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;

      ion-icon {
        color: var(--ion-color-primary);
      }
    }

    .foto-preview {
      margin-top: 16px;
      text-align: center;

      img {
        max-width: 150px;
        max-height: 150px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--ion-color-primary);
      }
    }

    .foto-upload-section {
      text-align: center;
    }

    .foto-placeholder {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      border: 3px dashed var(--ion-color-medium);

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
      }
    }

    .map-preview {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--ion-color-light-shade);
    }
  `]
})
export class MeuPerfilBarbeiroPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly barbeiroService = inject(BarbeiroService);
  private readonly toastController = inject(ToastController);
  private readonly imageUploadService = inject(ImageUploadService);

  readonly especialidades = ESPECIALIDADES_BARBEIRO;

  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly modoEdicao = signal(false);
  readonly perfil = signal<Barbeiro | null>(null);
  readonly uploadandoFoto = signal(false);

  // Map state
  mapCenter: google.maps.LatLngLiteral = { lat: -23.550520, lng: -46.633308 };
  mapMarkers: MapMarkerOptions[] = [];

  form: FormGroup = this.fb.group({
    nomeProfissional: [''],
    bio: [''],
    especialidadesSelecionadas: [[]],
    anosExperiencia: [null],
    fotoUrl: [''],
    telefone: [''],
    whatsapp: [''],
    instagram: [''],
    visivelMapa: [true],
    latitude: [null],
    longitude: [null]
  });

  constructor() {
    addIcons({
      personOutline, cutOutline, locationOutline, callOutline, logoWhatsapp,
      logoInstagram, saveOutline, imageOutline, starOutline, briefcaseOutline,
      mapOutline, cloudUploadOutline
    });
  }

  ngOnInit(): void {
    this.carregarPerfil();
  }

  private async carregarPerfil(): Promise<void> {
    this.carregando.set(true);

    this.barbeiroService.carregarMeuPerfil().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.modoEdicao.set(true);
        this.preencherFormulario(perfil);
        this.carregando.set(false);
      },
      error: (error) => {
        if (error.status === 404) {
          // Não possui perfil ainda
          this.modoEdicao.set(false);
        }
        this.carregando.set(false);
      }
    });
  }

  private preencherFormulario(perfil: Barbeiro): void {
    this.form.patchValue({
      nomeProfissional: perfil.nomeProfissional,
      bio: perfil.bio,
      especialidadesSelecionadas: perfil.especialidades ? perfil.especialidades.split(',').map(e => e.trim()) : [],
      anosExperiencia: perfil.anosExperiencia,
      fotoUrl: perfil.fotoUrl,
      telefone: perfil.telefone,
      whatsapp: perfil.whatsapp,
      instagram: perfil.instagram,
      visivelMapa: perfil.visivelMapa,
      latitude: perfil.latitude,
      longitude: perfil.longitude
    });

    if (perfil.latitude && perfil.longitude) {
      this.atualizarMapa({ lat: perfil.latitude, lng: perfil.longitude });
    }
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
      title: 'Sua Localização',
      options: { draggable: true }
    }];
  }

  async salvar(): Promise<void> {
    if (!this.form.valid) return;

    this.salvando.set(true);
    const valores = this.form.value;

    const dto = {
      nomeProfissional: valores.nomeProfissional,
      bio: valores.bio,
      especialidades: valores.especialidadesSelecionadas?.join(', '),
      anosExperiencia: valores.anosExperiencia,
      fotoUrl: valores.fotoUrl,
      telefone: valores.telefone,
      whatsapp: valores.whatsapp,
      instagram: valores.instagram,
      visivelMapa: valores.visivelMapa,
      latitude: valores.latitude,
      longitude: valores.longitude
    };

    const operacao = this.modoEdicao()
      ? this.barbeiroService.atualizarPerfil(dto)
      : this.barbeiroService.criarPerfil(dto);

    operacao.subscribe({
      next: async (perfil) => {
        this.perfil.set(perfil);
        this.modoEdicao.set(true);
        this.salvando.set(false);

        const toast = await this.toastController.create({
          message: this.modoEdicao() ? 'Perfil atualizado!' : 'Perfil criado com sucesso!',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      },
      error: async (error) => {
        this.salvando.set(false);
        const toast = await this.toastController.create({
          message: error.error?.message || 'Erro ao salvar perfil',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }

  async obterLocalizacao(): Promise<void> {
    if (!navigator.geolocation) {
      const toast = await this.toastController.create({
        message: 'Geolocalização não suportada',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        this.atualizarMapa({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      async (error) => {
        const toast = await this.toastController.create({
          message: 'Erro ao obter localização',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    );
  }

  getCorStatus(): string {
    const status = this.perfil()?.statusVinculo;
    return status ? STATUS_VINCULO_COR[status] : 'medium';
  }

  getLabelStatus(): string {
    const status = this.perfil()?.statusVinculo;
    return status ? STATUS_VINCULO_LABEL[status] : 'Autônomo';
  }

  /**
   * Abre seletor de arquivo e faz upload da foto.
   */
  async selecionarFoto(): Promise<void> {
    if (this.uploadandoFoto()) return;

    try {
      const file = await this.imageUploadService.openFileSelector();
      if (!file) return;

      this.uploadandoFoto.set(true);

      // Processar imagem (resize para 200x200)
      const processed = await this.imageUploadService.processProfilePhoto(file);

      // Atualiza o form com a foto em base64
      this.form.patchValue({ fotoUrl: processed.base64 });
      this.uploadandoFoto.set(false);

      const toast = await this.toastController.create({
        message: 'Foto carregada! Clique em Salvar para confirmar.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      this.uploadandoFoto.set(false);
      const toast = await this.toastController.create({
        message: 'Erro ao processar foto',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
