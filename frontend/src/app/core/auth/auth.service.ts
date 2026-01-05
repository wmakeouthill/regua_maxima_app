import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable, from, switchMap, tap, of } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Interface para resposta de autenticação.
 */
export interface AuthResponse {
    accessToken: string | null;
    refreshToken: string | null;
    expiresIn: number;
    usuario: Usuario;
    requerSelecaoPerfil: boolean;
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
export const TIPOS_USUARIO: { valor: TipoUsuario; label: string; descricao: string; icone: string }[] = [
    {
        valor: 'CLIENTE',
        label: 'Cliente',
        descricao: 'Quero agendar serviços em barbearias',
        icone: 'person-outline'
    },
    {
        valor: 'BARBEIRO',
        label: 'Barbeiro',
        descricao: 'Sou profissional e quero oferecer meus serviços',
        icone: 'briefcase-outline'
    },
    {
        valor: 'ADMIN',
        label: 'Dono de Barbearia',
        descricao: 'Quero cadastrar e gerenciar minha barbearia',
        icone: 'storefront-outline'
    }
];

/**
 * Serviço de autenticação.
 * Gerencia login, logout, tokens e estado do usuário.
 * Suporta múltiplas roles por usuário.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);

    // Estado reativo com Signals
    private _currentUser = signal<Usuario | null>(null);
    private _accessToken = signal<string | null>(null);
    private _isLoading = signal(true);
    private _requerSelecaoPerfil = signal(false);

    // Computed states (readonly)
    currentUser = this._currentUser.asReadonly();
    isAuthenticated = computed(() => this._accessToken() !== null);
    isLoading = this._isLoading.asReadonly();
    requerSelecaoPerfil = this._requerSelecaoPerfil.asReadonly();

    // Computed: verifica se usuário tem múltiplas roles
    possuiMultiplasRoles = computed(() => {
        const roles = this._currentUser()?.roles ?? [];
        return roles.length > 1;
    });

    // Computed: lista de roles disponíveis (sem prefixo ROLE_)
    rolesDisponiveis = computed<TipoUsuario[]>(() => {
        const roles = this._currentUser()?.roles ?? [];
        return roles.map(r => r.replace('ROLE_', '') as TipoUsuario);
    });

    /**
     * Inicializa o serviço carregando tokens salvos.
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
     * @param roleAtiva Role desejada (opcional para usuários com múltiplas roles)
     */
    login(email: string, senha: string, roleAtiva?: TipoUsuario): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/login`,
            { email, senha, roleAtiva }
        ).pipe(
            switchMap(response => {
                if (response.requerSelecaoPerfil) {
                    // Usuário tem múltiplas roles, precisa selecionar
                    this._requerSelecaoPerfil.set(true);
                    this._currentUser.set(response.usuario);
                    return of(response);
                }

                return from(this.saveTokens(response)).pipe(
                    tap(() => {
                        this._accessToken.set(response.accessToken);
                        this._currentUser.set(response.usuario);
                        this._requerSelecaoPerfil.set(false);
                    }),
                    switchMap(() => of(response))
                );
            })
        );
    }

    /**
     * Troca a role ativa (para usuários com múltiplas roles).
     */
    trocarRole(role: TipoUsuario): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/trocar-role`,
            { role }
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
     * Adiciona nova role ao usuário.
     */
    adicionarRole(role: TipoUsuario): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/adicionar-role`,
            { role }
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
     * Registra novo usuário ou adiciona role a usuário existente.
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
     * Retorna o tipo de usuário atual (role ativa).
     */
    getTipoUsuario(): TipoUsuario | null {
        return this._currentUser()?.tipoUsuario ?? null;
    }

    /**
     * Verifica se o usuário é Admin.
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
     */
    loginGoogle(idToken: string, roleAtiva?: TipoUsuario): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/login/google`,
            { idToken, roleAtiva }
        ).pipe(
            switchMap(response => {
                if (response.requerSelecaoPerfil) {
                    this._requerSelecaoPerfil.set(true);
                    this._currentUser.set(response.usuario);
                    return of(response);
                }

                return from(this.saveTokens(response)).pipe(
                    tap(() => {
                        this._accessToken.set(response.accessToken);
                        this._currentUser.set(response.usuario);
                    }),
                    switchMap(() => of(response))
                );
            })
        );
    }

    /**
     * Renova o access token.
     */
    async refresh(): Promise<AuthResponse | null> {
        const { value: refreshToken } = await Preferences.get({ key: 'refresh_token' });

        if (!refreshToken) {
            return null;
        }

        try {
            const response = await this.http.post<AuthResponse>(
                `${environment.apiUrl}/auth/refresh`,
                { refreshToken }
            ).toPromise();

            if (response) {
                await this.saveTokens(response);
                this._accessToken.set(response.accessToken);
                this._currentUser.set(response.usuario);
            }

            return response ?? null;
        } catch (error) {
            await this.logout();
            return null;
        }
    }

    /**
     * Realiza logout.
     */
    async logout(): Promise<void> {
        await Promise.all([
            Preferences.remove({ key: 'access_token' }),
            Preferences.remove({ key: 'refresh_token' }),
            Preferences.remove({ key: 'user' })
        ]);

        this._accessToken.set(null);
        this._currentUser.set(null);
        this._requerSelecaoPerfil.set(false);
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
        return this.getUserRoles().includes(role) ||
            this.getUserRoles().includes(`ROLE_${role}`);
    }

    /**
     * Salva tokens no storage.
     */
    private async saveTokens(response: AuthResponse): Promise<void> {
        if (response.accessToken && response.refreshToken) {
            await Promise.all([
                Preferences.set({ key: 'access_token', value: response.accessToken }),
                Preferences.set({ key: 'refresh_token', value: response.refreshToken }),
                Preferences.set({ key: 'user', value: JSON.stringify(response.usuario) })
            ]);
        }
    }
}
