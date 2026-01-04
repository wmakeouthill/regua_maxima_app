import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Barbeiro,
    BarbeiroResumo,
    CriarBarbeiroDTO,
    AtualizarBarbeiroDTO
} from '../models/barbeiro.model';

/**
 * Serviço para gestão de barbeiros.
 * Gerencia estado local e comunicação com API.
 */
@Injectable({
    providedIn: 'root'
})
export class BarbeiroService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/barbeiros`;

    // ========== Estado Reativo ==========

    /** Meu perfil de barbeiro (se existir) */
    private readonly _meuPerfil = signal<Barbeiro | null>(null);

    /** Lista de barbeiros (para admin - meus barbeiros) */
    private readonly _meusBarbeiros = signal<BarbeiroResumo[]>([]);

    /** Solicitações pendentes (para admin) */
    private readonly _solicitacoes = signal<BarbeiroResumo[]>([]);

    /** Barbeiros próximos (para mapa) */
    private readonly _barbeirosProximos = signal<BarbeiroResumo[]>([]);

    /** Loading state */
    private readonly _carregando = signal(false);

    // ========== Computed Signals ==========

    /** Meu perfil de barbeiro */
    readonly meuPerfil = this._meuPerfil.asReadonly();

    /** Verifica se possui perfil */
    readonly possuiPerfil = computed(() => this._meuPerfil() !== null);

    /** Verifica se está vinculado a uma barbearia */
    readonly estaVinculado = computed(() => {
        const perfil = this._meuPerfil();
        return perfil?.statusVinculo === 'APROVADO';
    });

    /** Status atual do vínculo */
    readonly statusVinculo = computed(() => this._meuPerfil()?.statusVinculo);

    /** Meus barbeiros (admin) */
    readonly meusBarbeiros = this._meusBarbeiros.asReadonly();

    /** Solicitações pendentes (admin) */
    readonly solicitacoes = this._solicitacoes.asReadonly();

    /** Barbeiros próximos */
    readonly barbeirosProximos = this._barbeirosProximos.asReadonly();

    /** Estado de carregamento */
    readonly carregando = this._carregando.asReadonly();

    // ========== Endpoints do Barbeiro ==========

    /**
     * Carrega meu perfil de barbeiro.
     */
    carregarMeuPerfil(): Observable<Barbeiro> {
        this._carregando.set(true);

        return this.http.get<Barbeiro>(`${this.apiUrl}/meu-perfil`).pipe(
            tap(perfil => {
                this._meuPerfil.set(perfil);
                this._carregando.set(false);
            }),
            catchError(error => {
                this._carregando.set(false);
                if (error.status === 404) {
                    this._meuPerfil.set(null);
                }
                return throwError(() => error);
            })
        );
    }

    /**
     * Verifica se possui perfil de barbeiro.
     */
    verificarPerfil(): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/meu-perfil/existe`);
    }

    /**
     * Cria perfil de barbeiro.
     */
    criarPerfil(dto: CriarBarbeiroDTO): Observable<Barbeiro> {
        this._carregando.set(true);

        return this.http.post<Barbeiro>(`${this.apiUrl}/meu-perfil`, dto).pipe(
            tap(perfil => {
                this._meuPerfil.set(perfil);
                this._carregando.set(false);
            }),
            catchError(error => {
                this._carregando.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Atualiza perfil de barbeiro.
     */
    atualizarPerfil(dto: AtualizarBarbeiroDTO): Observable<Barbeiro> {
        this._carregando.set(true);

        return this.http.put<Barbeiro>(`${this.apiUrl}/meu-perfil`, dto).pipe(
            tap(perfil => {
                this._meuPerfil.set(perfil);
                this._carregando.set(false);
            }),
            catchError(error => {
                this._carregando.set(false);
                return throwError(() => error);
            })
        );
    }

    // ========== Vínculo com Barbearia ==========

    /**
     * Solicita vínculo com uma barbearia.
     */
    solicitarVinculo(barbeariaId: number): Observable<Barbeiro> {
        return this.http.post<Barbeiro>(`${this.apiUrl}/vinculo/solicitar/${barbeariaId}`, {}).pipe(
            tap(perfil => this._meuPerfil.set(perfil))
        );
    }

    /**
     * Cancela solicitação de vínculo pendente.
     */
    cancelarSolicitacao(): Observable<Barbeiro> {
        return this.http.delete<Barbeiro>(`${this.apiUrl}/vinculo/cancelar`).pipe(
            tap(perfil => this._meuPerfil.set(perfil))
        );
    }

    /**
     * Desvincula-se da barbearia atual.
     */
    desvincular(): Observable<Barbeiro> {
        return this.http.delete<Barbeiro>(`${this.apiUrl}/vinculo`).pipe(
            tap(perfil => this._meuPerfil.set(perfil))
        );
    }

    // ========== Endpoints do Admin ==========

    /**
     * Carrega barbeiros da minha barbearia (admin).
     */
    carregarMeusBarbeiros(): Observable<BarbeiroResumo[]> {
        this._carregando.set(true);

        return this.http.get<BarbeiroResumo[]>(`${this.apiUrl}/admin/meus-barbeiros`).pipe(
            tap(barbeiros => {
                this._meusBarbeiros.set(barbeiros);
                this._carregando.set(false);
            }),
            catchError(error => {
                this._carregando.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * Carrega solicitações pendentes (admin).
     */
    carregarSolicitacoes(): Observable<BarbeiroResumo[]> {
        return this.http.get<BarbeiroResumo[]>(`${this.apiUrl}/admin/solicitacoes`).pipe(
            tap(solicitacoes => this._solicitacoes.set(solicitacoes))
        );
    }

    /**
     * Aprova solicitação de vínculo (admin).
     */
    aprovarVinculo(barbeiroId: number): Observable<Barbeiro> {
        return this.http.post<Barbeiro>(`${this.apiUrl}/admin/aprovar/${barbeiroId}`, {}).pipe(
            tap(() => {
                // Remove das solicitações
                this._solicitacoes.update(list => list.filter(b => b.id !== barbeiroId));
                // Recarrega lista de barbeiros
                this.carregarMeusBarbeiros().subscribe();
            })
        );
    }

    /**
     * Rejeita solicitação de vínculo (admin).
     */
    rejeitarVinculo(barbeiroId: number): Observable<Barbeiro> {
        return this.http.post<Barbeiro>(`${this.apiUrl}/admin/rejeitar/${barbeiroId}`, {}).pipe(
            tap(() => {
                this._solicitacoes.update(list => list.filter(b => b.id !== barbeiroId));
            })
        );
    }

    /**
     * Desvincula barbeiro da barbearia (admin).
     */
    desvincularBarbeiro(barbeiroId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/admin/desvincular/${barbeiroId}`).pipe(
            tap(() => {
                this._meusBarbeiros.update(list => list.filter(b => b.id !== barbeiroId));
            })
        );
    }

    // ========== Endpoints Públicos ==========

    /**
     * Busca barbeiro por ID.
     */
    buscarPorId(id: number): Observable<Barbeiro> {
        return this.http.get<Barbeiro>(`${this.apiUrl}/${id}`);
    }

    /**
     * Busca barbeiros próximos.
     */
    buscarProximos(latitude: number, longitude: number, raioKm: number = 10): Observable<BarbeiroResumo[]> {
        const params = new HttpParams()
            .set('latitude', latitude.toString())
            .set('longitude', longitude.toString())
            .set('raioKm', raioKm.toString());

        return this.http.get<BarbeiroResumo[]>(`${this.apiUrl}/proximos`, { params }).pipe(
            tap(barbeiros => this._barbeirosProximos.set(barbeiros))
        );
    }

    /**
     * Busca barbeiros por termo (nome ou especialidade).
     */
    buscar(termo: string, page: number = 0, size: number = 20): Observable<any> {
        const params = new HttpParams()
            .set('termo', termo)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get(`${this.apiUrl}/buscar`, { params });
    }

    /**
     * Lista barbeiros de uma barbearia.
     */
    listarPorBarbearia(barbeariaId: number): Observable<BarbeiroResumo[]> {
        return this.http.get<BarbeiroResumo[]>(`${this.apiUrl}/barbearia/${barbeariaId}`);
    }

    // ========== Utilitários ==========

    /**
     * Limpa estado local.
     */
    limparEstado(): void {
        this._meuPerfil.set(null);
        this._meusBarbeiros.set([]);
        this._solicitacoes.set([]);
        this._barbeirosProximos.set([]);
    }
}
