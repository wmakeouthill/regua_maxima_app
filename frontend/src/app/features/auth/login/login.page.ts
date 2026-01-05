import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
    IonContent, IonItem, IonInput, IonButton, IonSpinner,
    IonInputPasswordToggle, IonIcon, IonList, IonChip,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cutOutline, personOutline, storefrontOutline, briefcaseOutline, chevronForwardOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService, TipoUsuario, TIPOS_USUARIO } from '@core/auth/auth.service';
import { GoogleSignInService } from '@core/auth/google-signin.service';

/**
 * Página de login com seleção de perfil para usuários com múltiplas roles.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        IonContent, IonItem, IonInput, IonButton, IonSpinner,
        IonInputPasswordToggle, IonIcon, IonList, IonChip,
        IonHeader, IonToolbar, IonButtons, IonBackButton,
        IonCard, IonCardContent, FormsModule, RouterLink
    ],
    templateUrl: './login.page.html',
    styleUrl: './login.page.scss'
})
export class LoginPage implements OnInit, OnDestroy {
    private readonly authService = inject(AuthService);
    protected readonly googleSignIn = inject(GoogleSignInService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly cdr = inject(ChangeDetectorRef);

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

    // Seleção de perfil para múltiplas roles
    mostrarSelecaoPerfil = signal(false);
    rolesDisponiveis = signal<TipoUsuario[]>([]);
    tiposUsuario = TIPOS_USUARIO;

    constructor() {
        addIcons({ cutOutline, personOutline, storefrontOutline, briefcaseOutline, chevronForwardOutline });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const tipo = params['tipo'] as TipoUsuario;
            if (tipo && ['ADMIN', 'BARBEIRO', 'CLIENTE'].includes(tipo)) {
                this.tipoUsuarioSelecionado.set(tipo);
                this.initGoogleSignIn();
            } else {
                // Se não tiver tipo selecionado, redireciona para tela de escolha
                this.router.navigate(['/welcome'], { replaceUrl: true });
            }
        });
    }

    private async initGoogleSignIn(): Promise<void> {
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

    getIconePerfil(): string {
        const icones: Record<TipoUsuario, string> = {
            ADMIN: 'storefront-outline',
            BARBEIRO: 'briefcase-outline',
            CLIENTE: 'person-outline'
        };
        return icones[this.tipoUsuarioSelecionado()!] || 'person-outline';
    }

    getLabelPerfil(): string {
        const labels: Record<TipoUsuario, string> = {
            ADMIN: 'Dono de Barbearia',
            BARBEIRO: 'Barbeiro',
            CLIENTE: 'Cliente'
        };
        return labels[this.tipoUsuarioSelecionado()!] || '';
    }

    getCorPerfil(): string {
        const cores: Record<TipoUsuario, string> = {
            ADMIN: 'secondary',
            BARBEIRO: 'primary',
            CLIENTE: 'success'
        };
        return cores[this.tipoUsuarioSelecionado()!] || 'primary';
    }

    getInfoTipo(tipo: TipoUsuario) {
        return this.tiposUsuario.find(t => t.valor === tipo);
    }

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
        this.credentialSub = this.googleSignIn.credential$.subscribe((token: string) => {
            this.processarLoginGoogle(token);
        });
    }

    private tentarRenderizarBotaoGoogle(): void {
        if (this.googleButtonRendered() || this.renderAttempts >= this.MAX_RENDER_ATTEMPTS) {
            return;
        }

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
                this.renderAttempts++;
                this.tentarRenderizarBotaoGoogle();
            }
        }, 50);
    }

    private processarLoginGoogle(idToken: string): void {
        this.erro.set('');
        this.carregando.set(true);

        // Passa a role desejada (tipoUsuarioSelecionado) e flag para adicionar automaticamente se não existir
        const roleDesejada = this.tipoUsuarioSelecionado() || undefined;
        const adicionarRole = roleDesejada !== undefined;

        this.authService.loginGoogle(idToken, roleDesejada, adicionarRole).subscribe({
            next: (response) => {
                if (response.requerSelecaoPerfil) {
                    this.mostrarSelecaoPerfil.set(true);
                    this.rolesDisponiveis.set(this.authService.rolesDisponiveis());
                    this.carregando.set(false);
                } else {
                    this.redirecionarPorTipo();
                }
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

        // Passa a role desejada (tipoUsuarioSelecionado) e flag para adicionar automaticamente se não existir
        const roleDesejada = this.tipoUsuarioSelecionado() || undefined;
        const adicionarRole = roleDesejada !== undefined; // Adiciona role automaticamente se usuário selecionou um tipo

        this.authService.login(this.email, this.senha, roleDesejada, adicionarRole).subscribe({
            next: (response) => {
                if (response.requerSelecaoPerfil) {
                    // Usuário tem múltiplas roles, mostra seleção
                    this.mostrarSelecaoPerfil.set(true);
                    this.rolesDisponiveis.set(this.authService.rolesDisponiveis());
                    this.carregando.set(false);
                } else {
                    this.redirecionarPorTipo();
                }
            },
            error: (err: { error?: { message?: string } }) => {
                this.carregando.set(false);
                this.erro.set(err.error?.message || 'Erro ao fazer login');
            }
        });
    }

    /**
     * Seleciona um perfil quando usuário tem múltiplas roles.
     */
    selecionarPerfil(role: TipoUsuario): void {
        this.carregando.set(true);

        // Faz login novamente com a role selecionada
        this.authService.login(this.email, this.senha, role).subscribe({
            next: () => {
                this.mostrarSelecaoPerfil.set(false);
                this.redirecionarPorTipo();
            },
            error: (err: { error?: { message?: string } }) => {
                this.carregando.set(false);
                this.erro.set(err.error?.message || 'Erro ao selecionar perfil');
            }
        });
    }

    private redirecionarPorTipo(): void {
        const tipo = this.authService.getTipoUsuario();

        switch (tipo) {
            case 'ADMIN':
                this.router.navigate(['/tabs/admin/dashboard'], { replaceUrl: true });
                break;
            case 'BARBEIRO':
                this.router.navigate(['/tabs/barbeiro/fila'], { replaceUrl: true });
                break;
            case 'CLIENTE':
            default:
                this.router.navigate(['/tabs/cliente/explorar'], { replaceUrl: true });
                break;
        }
    }
}
