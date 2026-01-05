import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Status do atendimento.
 */
export type StatusAtendimento = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'NAO_COMPARECEU';

/**
 * DTO resumido de cliente.
 */
export interface ClienteResumo {
    id: number;
    nome: string;
}

/**
 * DTO resumido de serviço.
 */
export interface ServicoResumo {
    id: number;
    nome: string;
    duracaoMinutos: number;
}

/**
 * DTO de atendimento.
 */
export interface Atendimento {
    id: number;
    cliente: ClienteResumo;
    servico: ServicoResumo;
    barbeariaId: number | null;
    barbeariaNome: string | null;
    status: StatusAtendimento;
    dataAtendimento: string;
    horaChegada: string;
    horaInicioAtendimento: string | null;
    horaFimAtendimento: string | null;
    posicaoFila: number | null;
    tempoEsperaMinutos: number;
    duracaoAtendimentoMinutos: number;
    observacoes: string | null;
}

/**
 * DTO da fila do barbeiro.
 */
export interface FilaBarbeiro {
    barbeiroId: number;
    barbeiroNome: string;
    atendimentoAtual: Atendimento | null;
    filaEspera: Atendimento[];
    totalAguardando: number;
    totalAtendidosHoje: number;
    tempoMedioEsperaMinutos: number;
    tempoMedioAtendimentoMinutos: number;
}

/**
 * DTO para criar atendimento.
 */
export interface CriarAtendimento {
    clienteId: number;
    servicoId: number;
    barbeariaId?: number;
    observacoes?: string;
}

/**
 * Serviço para gestão de atendimentos/fila do barbeiro.
 */
@Injectable({
    providedIn: 'root'
})
export class AtendimentoService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/atendimentos`;

    // Estado reativo da fila
    readonly filaAtual = signal<FilaBarbeiro | null>(null);
    readonly carregando = signal(false);
    readonly erro = signal<string | null>(null);

    // Computed signals
    readonly atendimentoAtual = computed(() => this.filaAtual()?.atendimentoAtual ?? null);
    readonly filaEspera = computed(() => this.filaAtual()?.filaEspera ?? []);
    readonly proximoCliente = computed(() => this.filaEspera()[0] ?? null);
    readonly emAtendimento = computed(() => this.atendimentoAtual()?.status === 'EM_ATENDIMENTO');
    readonly totalAguardando = computed(() => this.filaAtual()?.totalAguardando ?? 0);
    readonly totalAtendidosHoje = computed(() => this.filaAtual()?.totalAtendidosHoje ?? 0);

    // ========== Operações do Barbeiro ==========

    /**
     * Busca a fila do barbeiro logado.
     */
    buscarMinhaFila(): Observable<FilaBarbeiro> {
        this.carregando.set(true);
        this.erro.set(null);

        return this.http.get<FilaBarbeiro>(`${this.baseUrl}/minha-fila`).pipe(
            tap(fila => {
                this.filaAtual.set(fila);
                this.carregando.set(false);
            }),
            catchError(err => {
                this.erro.set(err.error?.message ?? 'Erro ao buscar fila');
                this.carregando.set(false);
                return throwError(() => err);
            })
        );
    }

    /**
     * Busca a fila de um barbeiro específico (público).
     */
    buscarFilaDoBarbeiro(barbeiroId: number): Observable<FilaBarbeiro> {
        return this.http.get<FilaBarbeiro>(`${this.baseUrl}/fila/${barbeiroId}`);
    }

    /**
     * Adiciona cliente na fila.
     */
    adicionarNaFila(dados: CriarAtendimento): Observable<Atendimento> {
        return this.http.post<Atendimento>(`${this.baseUrl}/adicionar`, dados).pipe(
            tap(() => this.buscarMinhaFila().subscribe())
        );
    }

    /**
     * Inicia atendimento do próximo cliente da fila.
     */
    iniciarProximo(): Observable<Atendimento> {
        return this.http.post<Atendimento>(`${this.baseUrl}/iniciar-proximo`, {}).pipe(
            tap(() => this.buscarMinhaFila().subscribe())
        );
    }

    /**
     * Inicia atendimento de um cliente específico.
     */
    iniciarAtendimento(atendimentoId: number): Observable<Atendimento> {
        return this.http.post<Atendimento>(`${this.baseUrl}/${atendimentoId}/iniciar`, {}).pipe(
            tap(() => this.buscarMinhaFila().subscribe())
        );
    }

    /**
     * Finaliza o atendimento atual.
     */
    finalizarAtendimento(): Observable<Atendimento> {
        return this.http.post<Atendimento>(`${this.baseUrl}/finalizar`, {}).pipe(
            tap(() => this.buscarMinhaFila().subscribe())
        );
    }

    /**
     * Cancela um atendimento.
     */
    cancelarAtendimento(atendimentoId: number, motivo?: string): Observable<Atendimento> {
        return this.http.post<Atendimento>(`${this.baseUrl}/${atendimentoId}/cancelar`, { motivo }).pipe(
            tap(() => this.buscarMinhaFila().subscribe())
        );
    }

    /**
     * Marca cliente como não compareceu.
     */
    marcarNaoCompareceu(atendimentoId: number): Observable<Atendimento> {
        return this.http.post<Atendimento>(`${this.baseUrl}/${atendimentoId}/nao-compareceu`, {}).pipe(
            tap(() => this.buscarMinhaFila().subscribe())
        );
    }

    // ========== Operações do Cliente ==========

    /**
     * Busca atendimento ativo do cliente logado.
     */
    buscarMeuAtendimentoAtivo(): Observable<Atendimento | null> {
        return this.http.get<Atendimento>(`${this.baseUrl}/meu-atendimento`).pipe(
            catchError(() => {
                // 204 No Content retorna null
                return [null];
            })
        );
    }

    /**
     * Busca histórico de atendimentos do cliente.
     */
    buscarMeuHistorico(page = 0, size = 20): Observable<{ content: Atendimento[]; totalElements: number }> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<{ content: Atendimento[]; totalElements: number }>(
            `${this.baseUrl}/meu-historico`, { params }
        );
    }

    // ========== Utilitários ==========

    /**
     * Formata tempo de espera.
     */
    formatarTempoEspera(horaChegada: string): string {
        const chegada = new Date(horaChegada);
        const agora = new Date();
        const diffMs = agora.getTime() - chegada.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return `${diffMin} min`;

        const horas = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return `${horas}h${mins > 0 ? ` ${mins}m` : ''}`;
    }

    /**
     * Limpa estado da fila.
     */
    limparEstado(): void {
        this.filaAtual.set(null);
        this.erro.set(null);
    }
}
