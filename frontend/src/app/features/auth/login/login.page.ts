import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
    IonContent, IonItem, IonInput, IonButton, IonSpinner,
    IonInputPasswordToggle, IonIcon, IonList, IonChip,
    IonHeader, IonToolbar, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cutOutline, personOutline, storefrontOutline, briefcaseOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService, TipoUsuario } from '@core/auth/auth.service';
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
        IonInputPasswordToggle, IonIcon, IonList, IonChip,
        IonHeader, IonToolbar, IonButtons, IonBackButton, FormsModule, RouterLink
    ],
    templateUrl: './login.page.html',
    styleUrl: './login.page.scss'
})
export class LoginPage implements OnInit, OnDestroy {
    private authService = inject(AuthService);
    protected googleSignIn = inject(GoogleSignInService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
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
    tipoUsuarioSelecionado = signal<TipoUsuario | null>(null);

    constructor() {
        addIcons({ cutOutline, personOutline, storefrontOutline, briefcaseOutline });
    }

    async ngOnInit(): Promise<void> {
        // Lê o tipo de usuário da query string
        this.route.queryParams.subscribe(params => {
            const tipo = params['tipo'] as TipoUsuario;
            if (tipo && ['ADMIN', 'BARBEIRO', 'CLIENTE'].includes(tipo)) {
                this.tipoUsuarioSelecionado.set(tipo);
            }
        });

        // Inicializa Google OAuth
        try {
            await this.googleSignIn.initialize();
            if (this.googleSignIn.isConfigured) {
                this.setupGoogleCredentialListener();
                this.tentarRenderizarBotaoGoogle();
            }
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
        }
    }

    /**
     * Retorna o ícone correspondente ao tipo de perfil selecionado
     */
    getIconePerfil(): string {
        const icones: Record<TipoUsuario, string> = {
            ADMIN: 'storefront-outline',
            BARBEIRO: 'briefcase-outline',
            CLIENTE: 'person-outline'
        };
        return icones[this.tipoUsuarioSelecionado()!] || 'person-outline';
    }

    /**
     * Retorna o label do tipo de perfil selecionado
     */
    getLabelPerfil(): string {
        const labels: Record<TipoUsuario, string> = {
            ADMIN: 'Dono de Barbearia',
            BARBEIRO: 'Barbeiro',
            CLIENTE: 'Cliente'
        };
        return labels[this.tipoUsuarioSelecionado()!] || '';
    }

    /**
     * Retorna a cor do chip baseado no tipo de perfil
     */
    getCorPerfil(): string {
        const cores: Record<TipoUsuario, string> = {
            ADMIN: 'secondary',
            BARBEIRO: 'primary',
            CLIENTE: 'success'
        };
        return cores[this.tipoUsuarioSelecionado()!] || 'primary';
    }

    /**
     * Navega para a página de registro passando o tipo de usuário
     */
    irParaRegistro(): void {
        const tipo = this.tipoUsuarioSelecionado();
        if (tipo) {
            this.router.navigate(['/registrar'], { queryParams: { tipo } });
        } else {
            this.router.navigate(['/registrar']);
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

