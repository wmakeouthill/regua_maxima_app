import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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
        IonRadioGroup, IonRadio, FormsModule, RouterLink
    ],
    templateUrl: './registrar.page.html',
    styleUrl: './registrar.page.scss'
})
export class RegistrarPage implements OnInit, OnDestroy, AfterViewChecked {
    private authService = inject(AuthService);
    protected googleSignIn = inject(GoogleSignInService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

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
        // Lê o tipo de usuário da query string se fornecido
        this.route.queryParams.subscribe(params => {
            const tipo = params['tipo'] as TipoUsuario;
            if (tipo && ['ADMIN', 'BARBEIRO', 'CLIENTE'].includes(tipo)) {
                this.tipoUsuario = tipo;
            }
        });

        // Inicializa Google OAuth
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
        } catch (e: unknown) {
            const error = e as { error?: { message?: string } };
            console.error('Erro no registro com Google:', e);
            this.erro.set(error?.error?.message || 'Erro ao registrar com Google');
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
