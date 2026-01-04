import { Injectable, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { AppConfigService } from '@core/config/app-config.service';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleInitConfig) => void;
                    renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
                    prompt: () => void;
                    revoke: (email: string, callback: () => void) => void;
                };
            };
        };
    }
}

interface GoogleInitConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonConfig {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number;
    locale?: string;
}

interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
}

/**
 * Serviço de autenticação Google OAuth.
 * Usa Google Identity Services (GIS) para login.
 */
@Injectable({
    providedIn: 'root'
})
export class GoogleSignInService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly ngZone = inject(NgZone);
    private readonly appConfig = inject(AppConfigService);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private initialized = false;
    private readonly credentialSubject = new Subject<string>();

    /**
     * Verifica se o Google OAuth está configurado.
     * Usa o Client ID carregado do backend.
     */
    get isConfigured(): boolean {
        return !!this.appConfig.googleClientId;
    }

    /**
     * Verifica se o Google Sign-In foi inicializado com sucesso.
     */
    get isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Inicializa o Google Sign-In SDK.
     * Aguarda o carregamento das configurações se necessário.
     */
    async initialize(): Promise<void> {
        if (!this.isBrowser || this.initialized) {
            return;
        }

        // Aguarda o config carregar (com timeout)
        if (!this.appConfig.loaded()) {
            await this.waitForConfig();
        }

        if (!this.isConfigured) {
            console.warn('Google Client ID não configurado. OAuth desabilitado.');
            return;
        }

        return new Promise((resolve, reject) => {
            // Carrega o script do Google
            if (!document.getElementById('google-signin-script')) {
                const script = document.createElement('script');
                script.id = 'google-signin-script';
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => this.initializeGoogleApi(resolve, reject);
                script.onerror = () => reject(new Error('Falha ao carregar Google Sign-In'));
                document.head.appendChild(script);
            } else if (window.google?.accounts) {
                this.initializeGoogleApi(resolve, reject);
            } else {
                // Script já está carregando, espera
                const checkInterval = setInterval(() => {
                    if (window.google?.accounts) {
                        clearInterval(checkInterval);
                        this.initializeGoogleApi(resolve, reject);
                    }
                }, 100);

                // Timeout após 10 segundos
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout ao carregar Google Sign-In'));
                }, 10000);
            }
        });
    }

    /**
     * Aguarda o carregamento das configurações do app.
     */
    private waitForConfig(): Promise<void> {
        return new Promise((resolve) => {
            const maxAttempts = 50; // 5 segundos
            let attempts = 0;

            const check = () => {
                if (this.appConfig.loaded() || attempts >= maxAttempts) {
                    resolve();
                    return;
                }
                attempts++;
                setTimeout(check, 100);
            };

            check();
        });
    }

    private initializeGoogleApi(resolve: () => void, reject: (err: Error) => void): void {
        try {
            const clientId = this.appConfig.googleClientId;

            if (!clientId) {
                reject(new Error('Google Client ID não configurado no backend'));
                return;
            }

            // Firefox mobile ainda não suporta FedCM; desabilitamos para garantir
            // renderização do botão e fallback padrão.
            const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

            window.google!.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    this.ngZone.run(() => {
                        this.credentialSubject.next(response.credential);
                    });
                },
                auto_select: false,
                cancel_on_tap_outside: true,
                use_fedcm_for_prompt: !isFirefox // evita falha em Firefox mobile
            });

            this.initialized = true;
            resolve();
        } catch (error) {
            reject(error as Error);
        }
    }

    /**
     * Renderiza o botão do Google em um elemento.
     */
    renderButton(element: HTMLElement, config?: Partial<GoogleButtonConfig>): void {
        if (!this.isBrowser || !this.initialized || !window.google?.accounts) {
            console.warn('Google Sign-In não inicializado');
            return;
        }

        const defaultConfig: GoogleButtonConfig = {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            locale: 'pt-BR'
        };

        window.google.accounts.id.renderButton(element, { ...defaultConfig, ...config });
    }

    /**
     * Mostra o prompt One Tap do Google.
     */
    showOneTap(): void {
        if (!this.isBrowser || !this.initialized || !window.google?.accounts) {
            return;
        }

        window.google.accounts.id.prompt();
    }

    /**
     * Observable que emite o token quando o usuário faz login.
     */
    get credential$(): Observable<string> {
        return this.credentialSubject.asObservable();
    }

    /**
     * Revoga o acesso do usuário.
     */
    revoke(email: string): Promise<void> {
        return new Promise((resolve) => {
            if (!this.isBrowser || !window.google?.accounts) {
                resolve();
                return;
            }

            window.google.accounts.id.revoke(email, () => {
                resolve();
            });
        });
    }
}
