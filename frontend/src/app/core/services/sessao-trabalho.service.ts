import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Status da sessão de trabalho.
 */
export type StatusSessao = 'ABERTA' | 'PAUSADA' | 'FECHADA';

/**
 * DTO de sessão de trabalho.
 */
export interface SessaoTrabalho {
    id: number;
    numeroSessao: number;
    barbeariaId: number;
    barbeariaNome: string;
    usuarioId: number;
    usuarioNome: string;
    status: StatusSessao;
    dataSessao: string;
    dataAbertura: string;
    dataFechamento: string | null;
    valorAbertura: number;
    valorFechamento: number | null;
    valorTotalVendas: number;
    quantidadeAtendimentos: number;
    valorEsperado: number;
    diferencaCaixa: number;
    observacoes: string | null;
}

/**
 * DTO para abrir sessão.
 */
export interface AbrirSessaoRequest {
    barbeariaId: number;
    valorAbertura: number;
    observacoes?: string;
}

/**
 * DTO para fechar sessão.
 */
export interface FecharSessaoRequest {
    valorFechamento: number;
    observacoes?: string;
}

/**
 * DTO público de status da barbearia.
 */
export interface StatusBarbearia {
    barbeariaId: number;
    barbeariaNome: string;
    status: StatusSessao;
    aberta: boolean;
    mensagem: string;
}

/**
 * Serviço para gestão de sessões de trabalho/caixa.
 */
@Injectable({
    providedIn: 'root'
})
export class SessaoTrabalhoService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/sessoes-trabalho`;

    // Estado reativo
    readonly sessaoAtual = signal<SessaoTrabalho | null>(null);
    readonly historicoSessoes = signal<SessaoTrabalho[]>([]);
    readonly carregando = signal(false);
    readonly erro = signal<string | null>(null);

    // Computed signals
    readonly sessaoAberta = computed(() => this.sessaoAtual()?.status === 'ABERTA');
    readonly sessaoPausada = computed(() => this.sessaoAtual()?.status === 'PAUSADA');
    readonly sessaoFechada = computed(() => !this.sessaoAtual() || this.sessaoAtual()?.status === 'FECHADA');
    readonly temSessaoAtiva = computed(() => !!this.sessaoAtual() && this.sessaoAtual()?.status !== 'FECHADA');

    // ========== Operações de Sessão ==========

    /**
     * Abre nova sessão de trabalho.
     */
    abrirSessao(dados: AbrirSessaoRequest): Observable<SessaoTrabalho> {
        this.carregando.set(true);
        this.erro.set(null);

        return this.http.post<SessaoTrabalho>(`${this.baseUrl}/abrir`, dados).pipe(
            tap(sessao => {
                this.sessaoAtual.set(sessao);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.carregando.set(false);
                this.erro.set(err.error?.message ?? 'Erro ao abrir sessão');
                return throwError(() => err);
            })
        );
    }

    /**
     * Pausa a sessão ativa.
     */
    pausarSessao(barbeariaId: number): Observable<SessaoTrabalho> {
        this.carregando.set(true);
        this.erro.set(null);

        return this.http.post<SessaoTrabalho>(`${this.baseUrl}/${barbeariaId}/pausar`, {}).pipe(
            tap(sessao => {
                this.sessaoAtual.set(sessao);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.carregando.set(false);
                this.erro.set(err.error?.message ?? 'Erro ao pausar sessão');
                return throwError(() => err);
            })
        );
    }

    /**
     * Retoma sessão pausada.
     */
    retomarSessao(barbeariaId: number): Observable<SessaoTrabalho> {
        this.carregando.set(true);
        this.erro.set(null);

        return this.http.post<SessaoTrabalho>(`${this.baseUrl}/${barbeariaId}/retomar`, {}).pipe(
            tap(sessao => {
                this.sessaoAtual.set(sessao);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.carregando.set(false);
                this.erro.set(err.error?.message ?? 'Erro ao retomar sessão');
                return throwError(() => err);
            })
        );
    }

    /**
     * Fecha a sessão ativa.
     */
    fecharSessao(barbeariaId: number, dados: FecharSessaoRequest): Observable<SessaoTrabalho> {
        this.carregando.set(true);
        this.erro.set(null);

        return this.http.post<SessaoTrabalho>(`${this.baseUrl}/${barbeariaId}/fechar`, dados).pipe(
            tap(sessao => {
                // Move para histórico
                this.historicoSessoes.update(lista => [sessao, ...lista]);
                this.sessaoAtual.set(null);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.carregando.set(false);
                this.erro.set(err.error?.message ?? 'Erro ao fechar sessão');
                return throwError(() => err);
            })
        );
    }

    // ========== Consultas ==========

    /**
     * Busca sessão ativa da barbearia.
     */
    buscarSessaoAtiva(barbeariaId: number): Observable<SessaoTrabalho | null> {
        this.carregando.set(true);
        this.erro.set(null);

        return this.http.get<SessaoTrabalho>(`${this.baseUrl}/${barbeariaId}/ativa`).pipe(
            tap(sessao => {
                this.sessaoAtual.set(sessao);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.carregando.set(false);
                if (err.status === 204) {
                    // Sem sessão ativa
                    this.sessaoAtual.set(null);
                    return [null];
                }
                this.erro.set(err.error?.message ?? 'Erro ao buscar sessão ativa');
                return throwError(() => err);
            })
        );
    }

    /**
     * Busca histórico de sessões.
     */
    buscarHistorico(barbeariaId: number, limite = 10): Observable<SessaoTrabalho[]> {
        this.carregando.set(true);

        return this.http.get<SessaoTrabalho[]>(
            `${this.baseUrl}/${barbeariaId}/historico`,
            { params: { limite: limite.toString() } }
        ).pipe(
            tap(sessoes => {
                this.historicoSessoes.set(sessoes);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.carregando.set(false);
                return throwError(() => err);
            })
        );
    }

    /**
     * Carrega dados iniciais (sessão ativa + histórico).
     */
    carregarDados(barbeariaId: number): void {
        this.buscarSessaoAtiva(barbeariaId).subscribe();
        this.buscarHistorico(barbeariaId).subscribe();
    }

    // ========== Status Público ==========

    /**
     * Verifica status da barbearia (público - para clientes).
     */
    verificarStatusBarbearia(barbeariaId: number): Observable<StatusBarbearia> {
        return this.http.get<StatusBarbearia>(`${this.baseUrl}/status/${barbeariaId}`);
    }

    /**
     * Verifica se barbearia está aberta (retorno simples).
     */
    isBarbeariaAberta(barbeariaId: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/aberta/${barbeariaId}`);
    }

    // ========== Utilitários ==========

    /**
     * Limpa estado do serviço.
     */
    limparEstado(): void {
        this.sessaoAtual.set(null);
        this.historicoSessoes.set([]);
        this.erro.set(null);
    }
}
