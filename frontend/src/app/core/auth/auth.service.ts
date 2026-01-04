import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable, from, switchMap, tap, of } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Interface para resposta de autenticação.
 */
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    usuario: Usuario;
}

/**
 * Interface do usuário.
 */
export interface Usuario {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
    roles: string[];
    tipoUsuario: TipoUsuario;
    tipoUsuarioDescricao: string;
    emailVerificado: boolean;
    dataCriacao: string;
}

/**
 * Tipos de usuário disponíveis no sistema.
 */
export type TipoUsuario = 'ADMIN' | 'CLIENTE' | 'BARBEIRO';

/**
 * Opções de tipo de usuário para seleção no registro.
 */
export const TIPOS_USUARIO: { valor: TipoUsuario; label: string; descricao: string }[] = [
    {
        valor: 'CLIENTE',
        label: 'Cliente',
        descricao: 'Quero agendar serviços em barbearias'
    },
    {
        valor: 'BARBEIRO',
        label: 'Barbeiro',
        descricao: 'Sou profissional e quero oferecer meus serviços'
    },
    {
        valor: 'ADMIN',
        label: 'Dono de Barbearia',
        descricao: 'Quero cadastrar e gerenciar minha barbearia'
    }
];

/**
 * Serviço de autenticação.
 * Gerencia login, logout, tokens e estado do usuário.
 * Usa Signals para reatividade (Zoneless compatible).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);

    // Estado reativo com Signals
    private _currentUser = signal<Usuario | null>(null);
    private _accessToken = signal<string | null>(null);
    private _isLoading = signal(true);

    // Computed states (readonly)
    currentUser = this._currentUser.asReadonly();
    isAuthenticated = computed(() => this._accessToken() !== null);
    isLoading = this._isLoading.asReadonly();

    /**
     * Inicializa o serviço carregando tokens salvos.
     * Chamado no APP_INITIALIZER.
     */
    async initialize(): Promise<void> {
        try {
            const { value: token } = await Preferences.get({ key: 'access_token' });
            const { value: userJson } = await Preferences.get({ key: 'user' });

            if (token && userJson) {
                this._accessToken.set(token);
                this._currentUser.set(JSON.parse(userJson));
            }
        } catch (error) {
            console.error('Erro ao inicializar auth:', error);
        } finally {
            this._isLoading.set(false);
        }
    }

    /**
     * Realiza login do usuário.
     */
    login(email: string, senha: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/login`,
            { email, senha }
        ).pipe(
            switchMap(response =>
                from(this.saveTokens(response)).pipe(
                    tap(() => {
                        this._accessToken.set(response.accessToken);
                        this._currentUser.set(response.usuario);
                    }),
                    switchMap(() => of(response))
                )
            )
        );
    }

    /**
     * Registra novo usuário com tipo específico.
     * @param nome Nome do usuário
     * @param email Email do usuário
     * @param senha Senha do usuário
     * @param tipoUsuario Tipo: ADMIN, CLIENTE ou BARBEIRO
     * @param telefone Telefone opcional
     */
    registrar(
        nome: string,
        email: string,
        senha: string,
        tipoUsuario: TipoUsuario,
        telefone?: string
    ): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/registrar`,
            { nome, email, senha, telefone, tipoUsuario }
        ).pipe(
            switchMap(response =>
                from(this.saveTokens(response)).pipe(
                    tap(() => {
                        this._accessToken.set(response.accessToken);
                        this._currentUser.set(response.usuario);
                    }),
                    switchMap(() => of(response))
                )
            )
        );
    }

    /**
     * Retorna o tipo de usuário atual.
     */
    getTipoUsuario(): TipoUsuario | null {
        return this._currentUser()?.tipoUsuario ?? null;
    }

    /**
     * Verifica se o usuário é Admin (Dono de Barbearia).
     */
    isAdmin(): boolean {
        return this.getTipoUsuario() === 'ADMIN';
    }

    /**
     * Verifica se o usuário é Barbeiro.
     */
    isBarbeiro(): boolean {
        return this.getTipoUsuario() === 'BARBEIRO';
    }

    /**
     * Verifica se o usuário é Cliente.
     */
    isCliente(): boolean {
        return this.getTipoUsuario() === 'CLIENTE';
    }

    /**
     * Realiza login com Google OAuth.
     * @param idToken Token JWT retornado pelo Google Sign-In
     */
    loginGoogle(idToken: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/login/google`,
            { idToken }
        ).pipe(
            switchMap(response =>
                from(this.saveTokens(response)).pipe(
                    tap(() => {
                        this._accessToken.set(response.accessToken);
                        this._currentUser.set(response.usuario);
                    }),
                    switchMap(() => of(response))
                )
            )
        );
    }

    /**
     * Renova o access token usando refresh token.
     */
    async refresh(): Promise<AuthResponse | null> {
        try {
            const { value: refreshToken } = await Preferences.get({ key: 'refresh_token' });

            if (!refreshToken) {
                await this.logout();
                return null;
            }

            const response = await this.http.post<AuthResponse>(
                `${environment.apiUrl}/auth/refresh`,
                { refreshToken }
            ).toPromise();

            if (response) {
                await this.saveTokens(response);
                this._accessToken.set(response.accessToken);
                this._currentUser.set(response.usuario);
            }

            return response || null;
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            await this.logout();
            return null;
        }
    }

    /**
     * Realiza logout do usuário.
     */
    async logout(): Promise<void> {
        await Promise.all([
            Preferences.remove({ key: 'access_token' }),
            Preferences.remove({ key: 'refresh_token' }),
            Preferences.remove({ key: 'user' })
        ]);

        this._accessToken.set(null);
        this._currentUser.set(null);
    }

    /**
     * Retorna o access token atual.
     */
    getAccessToken(): string | null {
        return this._accessToken();
    }

    /**
     * Retorna as roles do usuário.
     */
    getUserRoles(): string[] {
        return this._currentUser()?.roles ?? [];
    }

    /**
     * Verifica se usuário tem uma role específica.
     */
    hasRole(role: string): boolean {
        return this.getUserRoles().includes(role);
    }

    /**
     * Salva tokens no storage.
     */
    private async saveTokens(response: AuthResponse): Promise<void> {
        await Promise.all([
            Preferences.set({ key: 'access_token', value: response.accessToken }),
            Preferences.set({ key: 'refresh_token', value: response.refreshToken }),
            Preferences.set({ key: 'user', value: JSON.stringify(response.usuario) })
        ]);
    }
}
