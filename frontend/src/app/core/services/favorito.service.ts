import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Tipo do favorito.
 */
export type TipoFavorito = 'BARBEARIA' | 'BARBEIRO';

/**
 * Interface de um favorito.
 */
export interface Favorito {
    id: number;
    tipo: TipoFavorito;
    idFavoritado: number;
    nome: string;
    foto: string | null;
    descricao: string | null;
    dataCriacao: string;
    // Campos de barbearia
    slug?: string;
    cidade?: string;
    estado?: string;
    // Campos de barbeiro
    especialidades?: string;
    anosExperiencia?: number;
}

/**
 * DTO para adicionar favorito.
 */
export interface AdicionarFavoritoDTO {
    tipo: TipoFavorito;
    barbeariaId?: number;
    barbeiroId?: number;
}

/**
 * IDs dos favoritos do usuário (para verificação rápida).
 */
export interface FavoritosIds {
    barbeariasIds: number[];
    barbeirosIds: number[];
}

/**
 * Resposta do toggle de favorito.
 */
export interface ToggleFavoritoResponse {
    favoritado: boolean;
    mensagem: string;
}

/**
 * Serviço para gestão de favoritos do cliente.
 */
@Injectable({
    providedIn: 'root'
})
export class FavoritoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/favoritos`;

    // ========== Estado Reativo ==========

    /** Lista de favoritos do usuário */
    private readonly _favoritos = signal<Favorito[]>([]);
    readonly favoritos = this._favoritos.asReadonly();

    /** IDs dos itens favoritados (para marcar corações) */
    private readonly _favoritosIds = signal<FavoritosIds>({ barbeariasIds: [], barbeirosIds: [] });
    readonly favoritosIds = this._favoritosIds.asReadonly();

    /** Barbearias favoritadas */
    readonly barbeariasFavoritas = computed(() =>
        this._favoritos().filter(f => f.tipo === 'BARBEARIA')
    );

    /** Barbeiros favoritados */
    readonly barbeirosFavoritos = computed(() =>
        this._favoritos().filter(f => f.tipo === 'BARBEIRO')
    );

    /** Total de favoritos */
    readonly totalFavoritos = computed(() => this._favoritos().length);

    /** Loading state */
    private readonly _carregando = signal(false);
    readonly carregando = this._carregando.asReadonly();

    // ========== Verificação de Favoritos ==========

    /**
     * Verifica se uma barbearia está nos favoritos.
     */
    isBarbeariaFavorita(barbeariaId: number): boolean {
        return this._favoritosIds().barbeariasIds.includes(barbeariaId);
    }

    /**
     * Verifica se um barbeiro está nos favoritos.
     */
    isBarbeiroFavorito(barbeiroId: number): boolean {
        return this._favoritosIds().barbeirosIds.includes(barbeiroId);
    }

    // ========== Carregar Favoritos ==========

    /**
     * Carrega todos os favoritos do usuário.
     */
    carregarFavoritos(): Observable<Favorito[]> {
        this._carregando.set(true);

        return this.http.get<Favorito[]>(this.apiUrl).pipe(
            tap(favoritos => {
                this._favoritos.set(favoritos);
                this._carregando.set(false);
            }),
            catchError(error => {
                this._carregando.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Carrega apenas barbearias favoritas.
     */
    carregarBarbeariasFavoritas(): Observable<Favorito[]> {
        return this.http.get<Favorito[]>(`${this.apiUrl}/barbearias`);
    }

    /**
     * Carrega apenas barbeiros favoritos.
     */
    carregarBarbeirosFavoritos(): Observable<Favorito[]> {
        return this.http.get<Favorito[]>(`${this.apiUrl}/barbeiros`);
    }

    /**
     * Carrega os IDs de todos os favoritos (para marcar corações).
     */
    carregarIdsFavoritos(): Observable<FavoritosIds> {
        return this.http.get<FavoritosIds>(`${this.apiUrl}/ids`).pipe(
            tap(ids => this._favoritosIds.set(ids))
        );
    }

    // ========== Toggle Favoritos ==========

    /**
     * Alterna favorito de barbearia (adiciona/remove).
     */
    toggleBarbeariaFavorita(barbeariaId: number): Observable<ToggleFavoritoResponse> {
        return this.http.post<ToggleFavoritoResponse>(
            `${this.apiUrl}/barbearias/${barbeariaId}/toggle`,
            {}
        ).pipe(
            tap(response => {
                const ids = this._favoritosIds();
                if (response.favoritado) {
                    this._favoritosIds.set({
                        ...ids,
                        barbeariasIds: [...ids.barbeariasIds, barbeariaId]
                    });
                } else {
                    this._favoritosIds.set({
                        ...ids,
                        barbeariasIds: ids.barbeariasIds.filter(id => id !== barbeariaId)
                    });
                }
            })
        );
    }

    /**
     * Alterna favorito de barbeiro (adiciona/remove).
     */
    toggleBarbeiroFavorito(barbeiroId: number): Observable<ToggleFavoritoResponse> {
        return this.http.post<ToggleFavoritoResponse>(
            `${this.apiUrl}/barbeiros/${barbeiroId}/toggle`,
            {}
        ).pipe(
            tap(response => {
                const ids = this._favoritosIds();
                if (response.favoritado) {
                    this._favoritosIds.set({
                        ...ids,
                        barbeirosIds: [...ids.barbeirosIds, barbeiroId]
                    });
                } else {
                    this._favoritosIds.set({
                        ...ids,
                        barbeirosIds: ids.barbeirosIds.filter(id => id !== barbeiroId)
                    });
                }
            })
        );
    }

    // ========== Adicionar Favorito ==========

    /**
     * Adiciona barbearia aos favoritos.
     */
    adicionarBarbeariaFavorita(barbeariaId: number): Observable<Favorito> {
        const dto: AdicionarFavoritoDTO = {
            tipo: 'BARBEARIA',
            barbeariaId
        };
        return this.http.post<Favorito>(this.apiUrl, dto).pipe(
            tap(favorito => {
                this._favoritos.update(lista => [...lista, favorito]);
                this._favoritosIds.update(ids => ({
                    ...ids,
                    barbeariasIds: [...ids.barbeariasIds, barbeariaId]
                }));
            })
        );
    }

    /**
     * Adiciona barbeiro aos favoritos.
     */
    adicionarBarbeiroFavorito(barbeiroId: number): Observable<Favorito> {
        const dto: AdicionarFavoritoDTO = {
            tipo: 'BARBEIRO',
            barbeiroId
        };
        return this.http.post<Favorito>(this.apiUrl, dto).pipe(
            tap(favorito => {
                this._favoritos.update(lista => [...lista, favorito]);
                this._favoritosIds.update(ids => ({
                    ...ids,
                    barbeirosIds: [...ids.barbeirosIds, barbeiroId]
                }));
            })
        );
    }

    // ========== Remover Favorito ==========

    /**
     * Remove barbearia dos favoritos.
     */
    removerBarbeariaFavorita(barbeariaId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/barbearias/${barbeariaId}`).pipe(
            tap(() => {
                this._favoritos.update(lista =>
                    lista.filter(f => !(f.tipo === 'BARBEARIA' && f.idFavoritado === barbeariaId))
                );
                this._favoritosIds.update(ids => ({
                    ...ids,
                    barbeariasIds: ids.barbeariasIds.filter(id => id !== barbeariaId)
                }));
            })
        );
    }

    /**
     * Remove barbeiro dos favoritos.
     */
    removerBarbeiroFavorito(barbeiroId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/barbeiros/${barbeiroId}`).pipe(
            tap(() => {
                this._favoritos.update(lista =>
                    lista.filter(f => !(f.tipo === 'BARBEIRO' && f.idFavoritado === barbeiroId))
                );
                this._favoritosIds.update(ids => ({
                    ...ids,
                    barbeirosIds: ids.barbeirosIds.filter(id => id !== barbeiroId)
                }));
            })
        );
    }

    // ========== Limpar Estado ==========

    /**
     * Limpa o estado local (para logout).
     */
    limparEstado(): void {
        this._favoritos.set([]);
        this._favoritosIds.set({ barbeariasIds: [], barbeirosIds: [] });
    }
}
