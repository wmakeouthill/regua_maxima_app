import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Barbearia,
    BarbeariaResumo,
    Servico,
    CriarBarbeariaDTO,
    AtualizarBarbeariaDTO,
    BarbeariaTema,
    CriarServicoDTO,
    AtualizarServicoDTO,
    PageResponse
} from '../models/barbearia.model';

/**
 * Serviço para gestão de barbearias.
 * Gerencia estado local e comunicação com API.
 */
@Injectable({
    providedIn: 'root'
})
export class BarbeariaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/barbearias`;

    // ========== Estado Reativo ==========

    /** Barbearia do admin logado */
    private readonly _minhaBarbearia = signal<Barbearia | null>(null);
    readonly minhaBarbearia = this._minhaBarbearia.asReadonly();

    /** Indica se o admin possui barbearia */
    readonly possuiBarbearia = computed(() => this._minhaBarbearia() !== null);

    /** Serviços da barbearia do admin */
    readonly meusServicos = computed(() => this._minhaBarbearia()?.servicos ?? []);

    /** Tema da barbearia */
    readonly tema = computed<BarbeariaTema | null>(() => {
        const barbearia = this._minhaBarbearia();
        if (barbearia?.temaConfig) {
            try {
                return JSON.parse(barbearia.temaConfig);
            } catch {
                return null;
            }
        }
        return null;
    });

    /** Loading state */
    private readonly _carregando = signal(false);
    readonly carregando = this._carregando.asReadonly();

    // ========== Endpoints Públicos ==========

    /**
     * Lista barbearias com paginação.
     */
    listar(page = 0, size = 20): Observable<PageResponse<BarbeariaResumo>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<BarbeariaResumo>>(this.apiUrl, { params });
    }

    /**
     * Busca barbearia por slug.
     */
    buscarPorSlug(slug: string): Observable<Barbearia> {
        return this.http.get<Barbearia>(`${this.apiUrl}/${slug}`);
    }

    /**
     * Busca barbearias por nome.
     */
    buscarPorNome(nome: string, page = 0, size = 20): Observable<PageResponse<BarbeariaResumo>> {
        const params = new HttpParams()
            .set('nome', nome)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<BarbeariaResumo>>(`${this.apiUrl}/busca`, { params });
    }

    /**
     * Busca genérica (alias para buscarPorNome).
     */
    buscar(termo: string, page = 0, size = 20): Observable<PageResponse<BarbeariaResumo>> {
        return this.buscarPorNome(termo, page, size);
    }

    /**
     * Busca barbearias por cidade.
     */
    buscarPorCidade(cidade: string, page = 0, size = 20): Observable<PageResponse<BarbeariaResumo>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<BarbeariaResumo>>(`${this.apiUrl}/cidade/${cidade}`, { params });
    }

    /**
     * Busca barbearias próximas por geolocalização.
     */
    buscarProximas(latitude: number, longitude: number, raioKm = 10): Observable<BarbeariaResumo[]> {
        const params = new HttpParams()
            .set('latitude', latitude.toString())
            .set('longitude', longitude.toString())
            .set('raioKm', raioKm.toString());

        return this.http.get<BarbeariaResumo[]>(`${this.apiUrl}/proximas`, { params });
    }

    /**
     * Lista serviços de uma barbearia.
     */
    listarServicos(barbeariaId: number): Observable<Servico[]> {
        return this.http.get<Servico[]>(`${this.apiUrl}/${barbeariaId}/servicos`);
    }

    // ========== Endpoints de Admin ==========

    /**
     * Cria nova barbearia.
     */
    criar(dto: CriarBarbeariaDTO): Observable<Barbearia> {
        this._carregando.set(true);
        return this.http.post<Barbearia>(this.apiUrl, dto).pipe(
            tap(barbearia => {
                this._minhaBarbearia.set(barbearia);
                this._carregando.set(false);
            }),
            catchError(err => {
                this._carregando.set(false);
                return throwError(() => err);
            })
        );
    }

    /**
     * Busca minha barbearia.
     */
    buscarMinha(): Observable<Barbearia> {
        this._carregando.set(true);
        return this.http.get<Barbearia>(`${this.apiUrl}/minha`).pipe(
            tap(barbearia => {
                this._minhaBarbearia.set(barbearia);
                this._carregando.set(false);
            }),
            catchError(err => {
                this._carregando.set(false);
                if (err.status === 404) {
                    this._minhaBarbearia.set(null);
                }
                return throwError(() => err);
            })
        );
    }

    /**
     * Atualiza minha barbearia.
     */
    atualizar(dto: AtualizarBarbeariaDTO): Observable<Barbearia> {
        this._carregando.set(true);
        return this.http.put<Barbearia>(`${this.apiUrl}/minha`, dto).pipe(
            tap(barbearia => {
                this._minhaBarbearia.set(barbearia);
                this._carregando.set(false);
            }),
            catchError(err => {
                this._carregando.set(false);
                return throwError(() => err);
            })
        );
    }

    /**
     * Atualiza tema da barbearia.
     */
    atualizarTema(tema: BarbeariaTema): Observable<Barbearia> {
        this._carregando.set(true);
        return this.http.put<Barbearia>(`${this.apiUrl}/minha/tema`, tema).pipe(
            tap(barbearia => {
                this._minhaBarbearia.set(barbearia);
                this._carregando.set(false);
            }),
            catchError(err => {
                this._carregando.set(false);
                return throwError(() => err);
            })
        );
    }

    /**
     * Desativa a barbearia.
     */
    desativar(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/minha`).pipe(
            tap(() => {
                const atual = this._minhaBarbearia();
                if (atual) {
                    this._minhaBarbearia.set({ ...atual, ativo: false });
                }
            })
        );
    }

    /**
     * Ativa a barbearia.
     */
    ativar(): Observable<{ mensagem: string }> {
        return this.http.post<{ mensagem: string }>(`${this.apiUrl}/minha/ativar`, {}).pipe(
            tap(() => {
                const atual = this._minhaBarbearia();
                if (atual) {
                    this._minhaBarbearia.set({ ...atual, ativo: true });
                }
            })
        );
    }

    // ========== Endpoints de Serviços (Admin) ==========

    /**
     * Lista meus serviços.
     */
    listarMeusServicos(): Observable<Servico[]> {
        return this.http.get<Servico[]>(`${this.apiUrl}/minha/servicos`);
    }

    /**
     * Adiciona serviço.
     */
    adicionarServico(dto: CriarServicoDTO): Observable<Servico> {
        return this.http.post<Servico>(`${this.apiUrl}/minha/servicos`, dto).pipe(
            tap(servico => {
                const atual = this._minhaBarbearia();
                if (atual) {
                    const servicos = [...(atual.servicos ?? []), servico];
                    this._minhaBarbearia.set({ ...atual, servicos });
                }
            })
        );
    }

    /**
     * Atualiza serviço.
     */
    atualizarServico(servicoId: number, dto: AtualizarServicoDTO): Observable<Servico> {
        return this.http.put<Servico>(`${this.apiUrl}/minha/servicos/${servicoId}`, dto).pipe(
            tap(servicoAtualizado => {
                const atual = this._minhaBarbearia();
                if (atual?.servicos) {
                    const servicos = atual.servicos.map(s =>
                        s.id === servicoId ? servicoAtualizado : s
                    );
                    this._minhaBarbearia.set({ ...atual, servicos });
                }
            })
        );
    }

    /**
     * Remove serviço.
     */
    removerServico(servicoId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/minha/servicos/${servicoId}`).pipe(
            tap(() => {
                const atual = this._minhaBarbearia();
                if (atual?.servicos) {
                    const servicos = atual.servicos.filter(s => s.id !== servicoId);
                    this._minhaBarbearia.set({ ...atual, servicos });
                }
            })
        );
    }

    // ========== Métodos Auxiliares ==========

    /**
     * Limpa o estado local.
     */
    limpar(): void {
        this._minhaBarbearia.set(null);
        this._carregando.set(false);
    }

    /**
     * Formata preço para exibição.
     */
    formatarPreco(valor: number): string {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /**
     * Formata duração para exibição.
     */
    formatarDuracao(minutos: number): string {
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
}
