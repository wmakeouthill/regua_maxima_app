import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonInput, IonButton, IonSpinner, IonIcon,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, saveOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonInput, IonButton, IonSpinner, IonIcon
  ],
  template: `
        <ion-header>
            <ion-toolbar color="primary">
                <ion-buttons slot="start">
                    <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
                </ion-buttons>
                <ion-title>Editar Perfil</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <form [formGroup]="form" (ngSubmit)="salvar()">
                <!-- Avatar -->
                <div class="avatar-section">
                    <div class="avatar">
                        @if (authService.currentUser()?.fotoBase64) {
                            <img [src]="authService.currentUser()?.fotoBase64" alt="Foto" />
                        } @else {
                            <ion-icon name="person-outline"></ion-icon>
                        }
                    </div>
                    <p class="email">{{ authService.currentUser()?.email }}</p>
                </div>

                <ion-list>
                    <ion-item>
                        <ion-input
                            label="Apelido"
                            labelPlacement="stacked"
                            placeholder="Como você quer ser chamado?"
                            formControlName="apelido"
                            maxlength="50"
                        ></ion-input>
                    </ion-item>

                    <ion-item>
                        <ion-input
                            label="Nome Completo"
                            labelPlacement="stacked"
                            placeholder="Seu nome"
                            formControlName="nome"
                            [readonly]="true"
                        ></ion-input>
                    </ion-item>

                    <ion-item>
                        <ion-input
                            label="Telefone"
                            labelPlacement="stacked"
                            placeholder="(11) 99999-9999"
                            formControlName="telefone"
                            type="tel"
                        ></ion-input>
                    </ion-item>
                </ion-list>

                <div class="actions">
                    <ion-button expand="block" type="submit" [disabled]="salvando() || form.invalid">
                        @if (salvando()) {
                            <ion-spinner name="crescent"></ion-spinner>
                        } @else {
                            <ion-icon name="save-outline" slot="start"></ion-icon>
                            Salvar Alterações
                        }
                    </ion-button>
                </div>
            </form>
        </ion-content>
    `,
  styles: [`
        .avatar-section {
            text-align: center;
            padding: 24px 0;
        }
        .avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin: 0 auto 12px;
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
                font-size: 48px;
                color: var(--ion-color-medium);
            }
        }
        .email {
            color: var(--ion-color-medium);
            font-size: 0.9rem;
        }
        .actions {
            padding: 24px 0;
        }
    `]
})
export class EditarPerfilComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  form: FormGroup;
  salvando = signal(false);

  constructor() {
    addIcons({ personOutline, saveOutline, arrowBackOutline });

    this.form = this.fb.group({
      apelido: ['', [Validators.maxLength(50)]],
      nome: [''],
      telefone: ['']
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({
        apelido: user.apelido || '',
        nome: user.nome || '',
        telefone: user.telefone || ''
      });
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid || this.salvando()) return;

    this.salvando.set(true);
    const dados = this.form.value;

    this.authService.atualizarPerfil({
      apelido: dados.apelido,
      telefone: dados.telefone
    }).subscribe({
      next: async () => {
        this.salvando.set(false);
        const toast = await this.toastController.create({
          message: 'Perfil atualizado com sucesso!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.router.navigate(['/tabs/perfil']);
      },
      error: async (err) => {
        this.salvando.set(false);
        console.error('Erro ao atualizar perfil:', err);
        const toast = await this.toastController.create({
          message: 'Erro ao atualizar perfil.',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}
