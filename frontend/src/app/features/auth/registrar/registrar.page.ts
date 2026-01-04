import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonInput, IonButton, IonSpinner,
    IonInputPasswordToggle, IonBackButton, IonButtons, IonIcon, IonList
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cutOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { GoogleSignInService } from '@core/auth/google-signin.service';

/**
 * Página de registro com design Barbershop.
 * Suporta registro tradicional e Google OAuth.
 */
@Component({
    selector: 'app-registrar',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
        IonInput, IonButton, IonSpinner, IonList,
        IonInputPasswordToggle, IonBackButton, IonButtons, IonIcon, FormsModule
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button defaultHref="/login" text=""></ion-back-button>
                </ion-buttons>
                <ion-title>Criar Conta</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <div class="auth-container animate-fade-in">
                <!-- Header -->
                <div class="auth-header">
                    <div class="auth-logo">
                        <ion-icon name="cut-outline"></ion-icon>
                    </div>
                    <h1>Junte-se a nós</h1>
                    <p>Crie sua conta e agende seu corte</p>
                </div>

                <!-- Formulário de Registro -->
                <div class="auth-form">
                    <form (ngSubmit)="registrar()">
                        <ion-list>
                            <ion-item>
                                <ion-input
                                    type="text"
                                    label="Nome completo"
                                    labelPlacement="floating"
                                    [(ngModel)]="nome"
                                    name="nome"
                                    autocomplete="name"
                                    required
                                ></ion-input>
                            </ion-item>

                            <ion-item>
                                <ion-input
                                    type="email"
                                    label="Email"
                                    labelPlacement="floating"
                                    [(ngModel)]="email"
                                    name="email"
                                    autocomplete="email"
                                    required
                                ></ion-input>
                            </ion-item>

                            <ion-item>
                                <ion-input
                                    type="tel"
                                    label="Telefone (opcional)"
                                    labelPlacement="floating"
                                    [(ngModel)]="telefone"
                                    name="telefone"
                                    autocomplete="tel"
                                ></ion-input>
                            </ion-item>

                            <ion-item>
                                <ion-input
                                    type="password"
                                    label="Senha"
                                    labelPlacement="floating"
                                    [(ngModel)]="senha"
                                    name="senha"
                                    autocomplete="new-password"
                                    required
                                >
                                    <ion-input-password-toggle slot="end"></ion-input-password-toggle>
                                </ion-input>
                            </ion-item>
                        </ion-list>

                        @if (erro()) {
                            <div class="error-message">{{ erro() }}</div>
                        }

                        <ion-button 
                            type="submit" 
                            expand="block" 
                            [disabled]="carregando()"
                        >
                            @if (carregando()) {
                                <ion-spinner name="crescent"></ion-spinner>
                            } @else {
                                Criar Conta
                            }
                        </ion-button>
                    </form>

                    <!-- Divider -->
                    @if (googleSignIn.isConfigured) {
                        <div class="auth-divider">
                            <span>ou registre-se com</span>
                        </div>

                        <!-- Botão do Google -->
                        <div class="google-button-container" #googleButton></div>
                    }
                </div>

                <!-- Footer -->
                <div class="auth-footer">
                    <ion-button 
                        fill="clear" 
                        expand="block" 
                        routerLink="/login"
                    >
                        Já tem conta? <strong>&nbsp;Faça login</strong>
                    </ion-button>
                </div>
            </div>
        </ion-content>
    `,
    styles: [`
        ion-list {
            margin: 0;
        }
    `]
})
export class RegistrarPage implements OnInit, OnDestroy, AfterViewChecked {
    private authService = inject(AuthService);
    protected googleSignIn = inject(GoogleSignInService);
    private router = inject(Router);

    @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;
    private googleButtonRendered = false;
    private credentialSub?: Subscription;

    nome = '';
    email = '';
    telefone = '';
    senha = '';
    erro = signal('');
    carregando = signal(false);

    constructor() {
        addIcons({ cutOutline });
    }

    async ngOnInit() {
        // Inicializa Google OAuth (tenta mesmo se isConfigured for false inicialmente,
        // pois o config pode ter falhado ao carregar - o initialize verifica internamente)
        try {
            await this.googleSignIn.initialize();
            if (this.googleSignIn.isConfigured) {
                this.setupGoogleCredentialListener();
            }
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
        }
    }

    ngAfterViewChecked() {
        this.renderizarBotaoGoogle();
    }

    ngOnDestroy() {
        this.credentialSub?.unsubscribe();
    }

    private setupGoogleCredentialListener() {
        this.credentialSub = this.googleSignIn.credential$.subscribe(async (token) => {
            await this.processarRegistroGoogle(token);
        });
    }

    private renderizarBotaoGoogle() {
        const element = this.googleButtonRef?.nativeElement;
        if (element && !this.googleButtonRendered && this.googleSignIn.isInitialized) {
            try {
                this.googleSignIn.renderButton(element, {
                    theme: 'outline',
                    size: 'large',
                    text: 'signup_with',
                    shape: 'rectangular',
                    width: 280
                });
                this.googleButtonRendered = true;
            } catch (e) {
                console.error('Erro ao renderizar botão Google:', e);
            }
        }
    }

    private async processarRegistroGoogle(idToken: string) {
        this.erro.set('');
        this.carregando.set(true);

        try {
            // TODO: Implementar chamada ao backend para registro com Google
            console.log('Token Google recebido:', idToken.substring(0, 50) + '...');

            // Por enquanto, mostra mensagem informativa
            this.erro.set('Registro com Google será implementado no backend');
            this.carregando.set(false);
        } catch (e: any) {
            console.error('Erro no registro com Google:', e);
            this.erro.set(e?.error?.message || 'Erro ao registrar com Google');
            this.carregando.set(false);
        }
    }

    registrar() {
        if (!this.nome || !this.email || !this.senha) {
            this.erro.set('Preencha os campos obrigatórios');
            return;
        }

        this.erro.set('');
        this.carregando.set(true);

        this.authService.registrar(this.nome, this.email, this.senha, this.telefone).subscribe({
            next: () => {
                this.router.navigate(['/tabs/home']);
            },
            error: (err) => {
                this.carregando.set(false);
                this.erro.set(err.error?.message || 'Erro ao criar conta');
            }
        });
    }
}
