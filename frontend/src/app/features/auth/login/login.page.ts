import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonContent, IonItem, IonInput, IonButton, IonSpinner,
    IonInputPasswordToggle, IonIcon, IonList
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cutOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { GoogleSignInService } from '@core/auth/google-signin.service';

/**
 * Página de login com design Barbershop.
 * Suporta login tradicional e Google OAuth.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        IonContent, IonItem, IonInput, IonButton, IonSpinner,
        IonInputPasswordToggle, IonIcon, IonList, FormsModule
    ],
    template: `
        <ion-content class="ion-padding" [fullscreen]="true">
            <!-- Stripe decorativo -->
            <div class="barbershop-stripe"></div>

            <div class="auth-container animate-fade-in">
                <!-- Header com Logo -->
                <div class="auth-header">
                    <div class="auth-logo">
                        <ion-icon name="cut-outline"></ion-icon>
                    </div>
                    <h1>Régua Máxima</h1>
                    <p>Seu estilo, nossa precisão</p>
                </div>

                <!-- Formulário de Login -->
                <div class="auth-form">
                    <form (ngSubmit)="login()">
                        <ion-list>
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
                                    type="password"
                                    label="Senha"
                                    labelPlacement="floating"
                                    [(ngModel)]="senha"
                                    name="senha"
                                    autocomplete="current-password"
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
                                Entrar
                            }
                        </ion-button>
                    </form>

                    <!-- Divider -->
                    @if (googleSignIn.isConfigured) {
                        <div class="auth-divider">
                            <span>ou continue com</span>
                        </div>

                        <!-- Botão do Google -->
                        <div class="google-button-container" #googleButton>
                            @if (!googleButtonRendered()) {
                                <ion-spinner name="dots" color="medium"></ion-spinner>
                            }
                        </div>
                    }
                </div>

                <!-- Footer -->
                <div class="auth-footer">
                    <ion-button 
                        fill="clear" 
                        expand="block" 
                        routerLink="/registrar"
                    >
                        Não tem conta? <strong>&nbsp;Registre-se</strong>
                    </ion-button>
                </div>
            </div>
        </ion-content>
    `,
    styles: [`
        ion-content {
            --padding-top: 0;
        }
        
        .barbershop-stripe {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10;
        }
        
        .auth-container {
            padding-top: 24px;
        }
        
        ion-list {
            margin: 0;
        }
    `]
})
export class LoginPage implements OnInit, OnDestroy {
    private authService = inject(AuthService);
    protected googleSignIn = inject(GoogleSignInService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;
    googleButtonRendered = signal(false);
    private credentialSub?: Subscription;
    private renderAttempts = 0;
    private readonly MAX_RENDER_ATTEMPTS = 20;

    email = '';
    senha = '';
    erro = signal('');
    carregando = signal(false);

    constructor() {
        addIcons({ cutOutline });
    }

    async ngOnInit(): Promise<void> {
        // Inicializa Google OAuth (tenta mesmo se isConfigured for false inicialmente,
        // pois o config pode ter falhado ao carregar - o initialize verifica internamente)
        try {
            await this.googleSignIn.initialize();
            if (this.googleSignIn.isConfigured) {
                this.setupGoogleCredentialListener();
                // Aguarda o ViewChild estar disponível e tenta renderizar
                this.tentarRenderizarBotaoGoogle();
            }
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
        }
    }

    ngOnDestroy(): void {
        this.credentialSub?.unsubscribe();
    }

    private setupGoogleCredentialListener(): void {
        this.credentialSub = this.googleSignIn.credential$.subscribe(async (token: string) => {
            await this.processarLoginGoogle(token);
        });
    }

    /**
     * Tenta renderizar o botão do Google com retry.
     * O ViewChild pode não estar disponível imediatamente devido ao @if.
     */
    private tentarRenderizarBotaoGoogle(): void {
        if (this.googleButtonRendered() || this.renderAttempts >= this.MAX_RENDER_ATTEMPTS) {
            return;
        }

        // Usa setTimeout para aguardar o próximo ciclo de detecção de mudanças
        setTimeout(() => {
            const element = this.googleButtonRef?.nativeElement;

            if (element && this.googleSignIn.isInitialized) {
                try {
                    this.googleSignIn.renderButton(element, {
                        theme: 'outline',
                        size: 'large',
                        text: 'continue_with',
                        shape: 'rectangular',
                        width: 280
                    });
                    this.googleButtonRendered.set(true);
                    this.cdr.detectChanges();
                } catch (e) {
                    console.error('Erro ao renderizar botão Google:', e);
                    this.renderAttempts++;
                    this.tentarRenderizarBotaoGoogle();
                }
            } else {
                // Elemento ainda não disponível, tenta novamente
                this.renderAttempts++;
                this.tentarRenderizarBotaoGoogle();
            }
        }, 50);
    }

    private processarLoginGoogle(idToken: string): void {
        this.erro.set('');
        this.carregando.set(true);

        this.authService.loginGoogle(idToken).subscribe({
            next: () => {
                this.router.navigate(['/tabs/home']);
            },
            error: (err: { error?: { message?: string } }) => {
                this.carregando.set(false);
                this.erro.set(err.error?.message || 'Erro ao fazer login com Google');
            }
        });
    }

    login(): void {
        if (!this.email || !this.senha) {
            this.erro.set('Preencha todos os campos');
            return;
        }

        this.erro.set('');
        this.carregando.set(true);

        this.authService.login(this.email, this.senha).subscribe({
            next: () => {
                this.router.navigate(['/tabs/home']);
            },
            error: (err: { error?: { message?: string } }) => {
                this.carregando.set(false);
                this.erro.set(err.error?.message || 'Erro ao fazer login');
            }
        });
    }
}

