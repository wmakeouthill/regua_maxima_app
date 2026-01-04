import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonInput, IonButton, IonSpinner,
    IonInputPasswordToggle, IonBackButton, IonButtons, IonIcon, IonList,
    IonRadioGroup, IonRadio, IonText
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cutOutline, personOutline, storefrontOutline, briefcaseOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService, TipoUsuario, TIPOS_USUARIO } from '@core/auth/auth.service';
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
        IonInput, IonButton, IonSpinner, IonList, IonText,
        IonInputPasswordToggle, IonBackButton, IonButtons, IonIcon,
        IonRadioGroup, IonRadio, FormsModule
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
                    <p>Crie sua conta e comece agora</p>
                </div>

                <!-- Formulário de Registro -->
                <div class="auth-form">
                    <form (ngSubmit)="registrar()">
                        <!-- Seleção de Tipo de Usuário -->
                        <div class="tipo-usuario-section">
                            <ion-text color="medium">
                                <p class="section-label">Sou um(a):</p>
                            </ion-text>
                            <ion-radio-group [(ngModel)]="tipoUsuario" name="tipoUsuario">
                                @for (tipo of tiposUsuario; track tipo.valor) {
                                    <div class="tipo-card" [class.selected]="tipoUsuario === tipo.valor">
                                        <ion-radio [value]="tipo.valor" labelPlacement="end">
                                            <div class="tipo-content">
                                                <ion-icon [name]="getIcone(tipo.valor)"></ion-icon>
                                                <div class="tipo-info">
                                                    <strong>{{ tipo.label }}</strong>
                                                    <span>{{ tipo.descricao }}</span>
                                                </div>
                                            </div>
                                        </ion-radio>
                                    </div>
                                }
                            </ion-radio-group>
                        </div>

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

        .tipo-usuario-section {
            margin-bottom: 16px;
        }

        .section-label {
            font-size: 14px;
            margin-bottom: 12px;
            font-weight: 500;
        }

        .tipo-card {
            background: var(--ion-color-light);
            border-radius: 12px;
            margin-bottom: 8px;
            padding: 12px 16px;
            border: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .tipo-card.selected {
            border-color: var(--ion-color-primary);
            background: var(--ion-color-primary-tint);
        }

        .tipo-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .tipo-content ion-icon {
            font-size: 24px;
            color: var(--ion-color-primary);
        }

        .tipo-info {
            display: flex;
            flex-direction: column;
        }

        .tipo-info strong {
            font-size: 15px;
            color: var(--ion-color-dark);
        }

        .tipo-info span {
            font-size: 12px;
            color: var(--ion-color-medium);
        }

        ion-radio {
            --color-checked: var(--ion-color-primary);
            width: 100%;
        }

        ion-radio::part(container) {
            display: none;
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

    // Campos do formulário
    nome = '';
    email = '';
    telefone = '';
    senha = '';
    tipoUsuario: TipoUsuario = 'CLIENTE';

    // Opções de tipo de usuário
    tiposUsuario = TIPOS_USUARIO;

    // Estado
    erro = signal('');
    carregando = signal(false);

    constructor() {
        addIcons({ cutOutline, personOutline, storefrontOutline, briefcaseOutline });
    }

    /**
     * Retorna o ícone correspondente ao tipo de usuário.
     */
    getIcone(tipo: TipoUsuario): string {
        switch (tipo) {
            case 'CLIENTE': return 'person-outline';
            case 'ADMIN': return 'storefront-outline';
            case 'BARBEIRO': return 'briefcase-outline';
            default: return 'person-outline';
        }
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

        if (!this.tipoUsuario) {
            this.erro.set('Selecione o tipo de conta');
            return;
        }

        this.erro.set('');
        this.carregando.set(true);

        this.authService.registrar(
            this.nome,
            this.email,
            this.senha,
            this.tipoUsuario,
            this.telefone || undefined
        ).subscribe({
            next: () => {
                // Redireciona baseado no tipo de usuário
                const redirect = this.getRedirectPath();
                this.router.navigate([redirect]);
            },
            error: (err) => {
                this.carregando.set(false);
                this.erro.set(err.error?.message || 'Erro ao criar conta');
            }
        });
    }

    /**
     * Retorna o path de redirecionamento baseado no tipo de usuário.
     */
    private getRedirectPath(): string {
        switch (this.tipoUsuario) {
            case 'ADMIN': return '/tabs/admin';
            case 'BARBEIRO': return '/tabs/barbeiro';
            case 'CLIENTE': return '/tabs/explorar';
            default: return '/tabs/home';
        }
    }
}
