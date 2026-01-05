import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Status possíveis de um agendamento.
 */
export type StatusAgendamento =
    | 'PENDENTE'
    | 'CONFIRMADO'
    | 'EM_ANDAMENTO'
    | 'CONCLUIDO'
    | 'CANCELADO_CLIENTE'
    | 'CANCELADO_BARBEIRO'
    | 'CANCELADO_BARBEARIA'
    | 'NAO_COMPARECEU';

/**
 * Interface do Agendamento.
 */
export interface Agendamento {
    id: number;

    // Cliente
    clienteId: number;
    clienteNome: string;
    clienteTelefone?: string;
    clienteFotoUrl?: string;

    // Barbeiro
    barbeiroId: number;
    barbeiroNome: string;
    barbeiroFotoUrl?: string;

    // Barbearia
    barbeariaId: number;
    barbeariaNome: string;
    barbeariaEndereco?: string;

    // Serviço
    servicoId: number;
    servicoNome: string;
    servicoIcone?: string;
    duracaoMinutos: number;
    preco: number;

    // Data/Hora
    data: string; // ISO date
    horaInicio: string; // HH:mm
    horaFim: string; // HH:mm

    // Status
    status: StatusAgendamento;
    statusDescricao: string;

    // Observações
    observacoesCliente?: string;
    observacoesBarbeiro?: string;
    motivoCancelamento?: string;

    // Timestamps
    dataCriacao: string;
    dataConfirmacao?: string;
    dataInicioAtendimento?: string;
    dataConclusao?: string;
    dataCancelamento?: string;

    // Flags
    isHoje: boolean;
    isFuturo: boolean;
    podeCancelar: boolean;
    podeConfirmar: boolean;
    podeIniciar: boolean;
    podeFinalizar: boolean;
}

/**
 * DTO para criar agendamento.
 */
export interface CriarAgendamentoDTO {
    barbeiroId: number;
    servicoId: number;
    data: string; // ISO date
    horaInicio: string; // HH:mm
    observacoes?: string;
}

/**
 * Interface de horário disponível.
 */
export interface HorarioDisponivel {
    horario: string; // HH:mm
    horarioFormatado: string;
    disponivel: boolean;
}

/**
 * Serviço para gerenciamento de Agendamentos.
 * Usa signals para estado reativo.
 */
@Injectable({ providedIn: 'root' })
export class AgendamentoService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/agendamentos`;

    // ========== Estado Reativo ==========

    // Próximos agendamentos do cliente
    private readonly _meusAgendamentos = signal<Agendamento[]>([]);
    readonly meusAgendamentos = this._meusAgendamentos.asReadonly();

    // Agenda do barbeiro
    private readonly _agendaBarbeiro = signal<Agendamento[]>([]);
    readonly agendaBarbeiro = this._agendaBarbeiro.asReadonly();

    // Agendamentos pendentes (para confirmação)
    private readonly _pendentes = signal<Agendamento[]>([]);
    readonly pendentes = this._pendentes.asReadonly();

    // Horários disponíveis
    private readonly _horariosDisponiveis = signal<HorarioDisponivel[]>([]);
    readonly horariosDisponiveis = this._horariosDisponiveis.asReadonly();

    // Loading states
    private readonly _carregando = signal(false);
    readonly carregando = this._carregando.asReadonly();

    // ========== Computed ==========

    readonly temAgendamentosHoje = computed(() =>
        this._meusAgendamentos().some(a => a.isHoje)
    );

    readonly proximoAgendamento = computed(() =>
        this._meusAgendamentos().find(a => a.isFuturo && a.status === 'CONFIRMADO')
    );

    readonly totalPendentes = computed(() => this._pendentes().length);

    readonly horariosDisponiveisFiltrados = computed(() =>
        this._horariosDisponiveis().filter(h => h.disponivel)
    );

    // ========== Endpoints do Cliente ==========

    /**
     * Cria um novo agendamento.
     */
    criarAgendamento(dto: CriarAgendamentoDTO): Observable<Agendamento> {
        return this.http.post<Agendamento>(this.baseUrl, dto).pipe(
            tap(agendamento => {
                this._meusAgendamentos.update(lista => [agendamento, ...lista]);
            })
        );
    }

    /**
     * Busca próximos agendamentos do cliente.
     */
    buscarMeusAgendamentos(): Observable<Agendamento[]> {
        this._carregando.set(true);
        return this.http.get<Agendamento[]>(`${this.baseUrl}/meus`).pipe(
            tap(agendamentos => {
                this._meusAgendamentos.set(agendamentos);
                this._carregando.set(false);
            })
        );
    }

    /**
     * Cancela agendamento pelo cliente.
     */
    cancelarAgendamento(id: number, motivo?: string): Observable<Agendamento> {
        return this.http.post<Agendamento>(`${this.baseUrl}/${id}/cancelar`, { motivo }).pipe(
            tap(agendamento => {
                this._meusAgendamentos.update(lista =>
                    lista.map(a => a.id === id ? agendamento : a)
                );
            })
        );
    }

    // ========== Endpoints do Barbeiro ==========

    /**
     * Busca agenda do barbeiro para uma data.
     */
    buscarAgendaDia(data?: string): Observable<Agendamento[]> {
        this._carregando.set(true);
        let params = new HttpParams();
        if (data) {
            params = params.set('data', data);
        }

        return this.http.get<Agendamento[]>(`${this.baseUrl}/barbeiro/agenda`, { params }).pipe(
            tap(agendamentos => {
                this._agendaBarbeiro.set(agendamentos);
                this._carregando.set(false);
            })
        );
    }

    /**
     * Busca próximos agendamentos do barbeiro.
     */
    buscarProximosAgendamentosBarbeiro(): Observable<Agendamento[]> {
        return this.http.get<Agendamento[]>(`${this.baseUrl}/barbeiro/proximos`);
    }

    /**
     * Busca agendamentos pendentes de confirmação.
     */
    buscarPendentes(): Observable<Agendamento[]> {
        return this.http.get<Agendamento[]>(`${this.baseUrl}/barbeiro/pendentes`).pipe(
            tap(agendamentos => this._pendentes.set(agendamentos))
        );
    }

    /**
     * Confirma um agendamento.
     */
    confirmarAgendamento(id: number): Observable<Agendamento> {
        return this.http.post<Agendamento>(`${this.baseUrl}/${id}/confirmar`, {}).pipe(
            tap(agendamento => {
                this._pendentes.update(lista => lista.filter(a => a.id !== id));
                this._agendaBarbeiro.update(lista =>
                    lista.map(a => a.id === id ? agendamento : a)
                );
            })
        );
    }

    /**
     * Inicia o atendimento.
     */
    iniciarAtendimento(id: number): Observable<Agendamento> {
        return this.http.post<Agendamento>(`${this.baseUrl}/${id}/iniciar`, {}).pipe(
            tap(agendamento => {
                this._agendaBarbeiro.update(lista =>
                    lista.map(a => a.id === id ? agendamento : a)
                );
            })
        );
    }

    /**
     * Conclui o agendamento.
     */
    concluirAgendamento(id: number): Observable<Agendamento> {
        return this.http.post<Agendamento>(`${this.baseUrl}/${id}/concluir`, {}).pipe(
            tap(agendamento => {
                this._agendaBarbeiro.update(lista =>
                    lista.map(a => a.id === id ? agendamento : a)
                );
            })
        );
    }

    /**
     * Marca como não compareceu.
     */
    marcarNaoCompareceu(id: number): Observable<Agendamento> {
        return this.http.post<Agendamento>(`${this.baseUrl}/${id}/nao-compareceu`, {}).pipe(
            tap(agendamento => {
                this._agendaBarbeiro.update(lista =>
                    lista.map(a => a.id === id ? agendamento : a)
                );
            })
        );
    }

    /**
     * Cancela pelo barbeiro.
     */
    cancelarPeloBarbeiro(id: number, motivo?: string): Observable<Agendamento> {
        return this.http.post<Agendamento>(`${this.baseUrl}/${id}/cancelar-barbeiro`, { motivo }).pipe(
            tap(agendamento => {
                this._agendaBarbeiro.update(lista =>
                    lista.map(a => a.id === id ? agendamento : a)
                );
            })
        );
    }

    // ========== Disponibilidade ==========

    /**
     * Busca horários disponíveis para agendamento.
     */
    buscarHorariosDisponiveis(barbeiroId: number, servicoId: number, data: string): Observable<HorarioDisponivel[]> {
        const params = new HttpParams()
            .set('barbeiroId', barbeiroId.toString())
            .set('servicoId', servicoId.toString())
            .set('data', data);

        return this.http.get<HorarioDisponivel[]>(`${this.baseUrl}/disponibilidade`, { params }).pipe(
            tap(horarios => this._horariosDisponiveis.set(horarios))
        );
    }

    /**
     * Busca agendamento por ID.
     */
    buscarPorId(id: number): Observable<Agendamento> {
        return this.http.get<Agendamento>(`${this.baseUrl}/${id}`);
    }

    // ========== Helpers ==========

    /**
     * Retorna a cor do status para exibição.
     */
    getCorStatus(status: StatusAgendamento): string {
        const cores: Record<StatusAgendamento, string> = {
            PENDENTE: 'warning',
            CONFIRMADO: 'primary',
            EM_ANDAMENTO: 'secondary',
            CONCLUIDO: 'success',
            CANCELADO_CLIENTE: 'danger',
            CANCELADO_BARBEIRO: 'danger',
            CANCELADO_BARBEARIA: 'danger',
            NAO_COMPARECEU: 'medium'
        };
        return cores[status] || 'medium';
    }

    /**
     * Retorna o ícone do status.
     */
    getIconeStatus(status: StatusAgendamento): string {
        const icones: Record<StatusAgendamento, string> = {
            PENDENTE: 'time-outline',
            CONFIRMADO: 'checkmark-circle-outline',
            EM_ANDAMENTO: 'cut-outline',
            CONCLUIDO: 'checkmark-done-outline',
            CANCELADO_CLIENTE: 'close-circle-outline',
            CANCELADO_BARBEIRO: 'close-circle-outline',
            CANCELADO_BARBEARIA: 'close-circle-outline',
            NAO_COMPARECEU: 'alert-circle-outline'
        };
        return icones[status] || 'help-outline';
    }

    /**
     * Formata data para exibição.
     */
    formatarData(dataISO: string): string {
        const data = new Date(dataISO);
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        if (data.toDateString() === hoje.toDateString()) {
            return 'Hoje';
        }
        if (data.toDateString() === amanha.toDateString()) {
            return 'Amanhã';
        }

        return data.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
        });
    }

    /**
     * Limpa o estado.
     */
    limparEstado(): void {
        this._meusAgendamentos.set([]);
        this._agendaBarbeiro.set([]);
        this._pendentes.set([]);
        this._horariosDisponiveis.set([]);
    }
}
