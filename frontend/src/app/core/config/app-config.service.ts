import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Interface para resposta de configurações públicas.
 */
export interface PublicConfig {
    googleClientId: string | null;
}

/**
 * Serviço para carregar configurações públicas do backend.
 * Carrega Google Client ID e outras configurações dinâmicas.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
    private http = inject(HttpClient);

    private _config = signal<PublicConfig | null>(null);
    private _loaded = signal(false);
    private _loading = signal(false);

    /** Configurações carregadas */
    config = this._config.asReadonly();

    /** Indica se as configurações foram carregadas */
    loaded = this._loaded.asReadonly();

    /**
     * Google Client ID carregado do backend.
     */
    get googleClientId(): string | null {
        return this._config()?.googleClientId || null;
    }

    /**
     * Carrega configurações públicas do backend.
     * Chamado durante inicialização do app.
     */
    async loadConfig(): Promise<void> {
        if (this._loaded() || this._loading()) {
            return;
        }

        this._loading.set(true);

        try {
            const config = await firstValueFrom(
                this.http.get<PublicConfig>(`${environment.apiUrl}/config/public`)
            );
            this._config.set(config);
            this._loaded.set(true);
            console.debug('[AppConfig] Configurações carregadas:', config);
        } catch (error) {
            console.warn('[AppConfig] Erro ao carregar configurações do backend:', error);
            // Define config vazia em caso de erro
            this._config.set({ googleClientId: null });
            this._loaded.set(true);
        } finally {
            this._loading.set(false);
        }
    }
}
