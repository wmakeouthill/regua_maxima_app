import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

// ========================================================
// Régua Máxima - Serviço de Avaliações
// ========================================================

// DTOs
export interface AvaliacaoDTO {
    id: number;
    clienteNome: string;
    clienteFoto: string | null;
    tipo: 'BARBEARIA' | 'BARBEIRO' | 'ATENDIMENTO';
    barbeariaId: number | null;
    barbeariaNome: string | null;
    barbeiroId: number | null;
    barbeiroNome: string | null;
    agendamentoId: number | null;
    nota: number;
    comentario: string | null;
    resposta: string | null;
    dataResposta: string | null;
    anonima: boolean;
    dataCriacao: string;
}

export interface CriarAvaliacaoDTO {
    tipo: 'BARBEARIA' | 'BARBEIRO' | 'ATENDIMENTO';
    barbeariaId?: number;
    barbeiroId?: number;
    agendamentoId?: number;
    nota: number;
    comentario?: string;
    anonima?: boolean;
}

export interface ResponderAvaliacaoDTO {
    resposta: string;
}

export interface ResumoAvaliacoesDTO {
    media: number;
    total: number;
    distribuicao: { [key: number]: number };
}

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class AvaliacaoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/avaliacoes`;

    // Signals para cache local
    private readonly _minhasAvaliacoes = signal<AvaliacaoDTO[]>([]);
    private readonly _resumoBarbearia = signal<Map<number, ResumoAvaliacoesDTO>>(new Map());
    private readonly _resumoBarbeiro = signal<Map<number, ResumoAvaliacoesDTO>>(new Map());
    private readonly _avaliacoesAgendamento = signal<Map<number, boolean>>(new Map());
    private readonly _carregando = signal(false);

    // Computed
    readonly minhasAvaliacoes = computed(() => this._minhasAvaliacoes());
    readonly carregando = computed(() => this._carregando());

    // ========================================================
    // Criar avaliação
    // ========================================================
    async criarAvaliacao(dto: CriarAvaliacaoDTO): Promise<AvaliacaoDTO> {
        try {
            this._carregando.set(true);
            const avaliacao = await firstValueFrom(
                this.http.post<AvaliacaoDTO>(this.apiUrl, dto)
            );

            // Atualiza lista local
            this._minhasAvaliacoes.update(list => [avaliacao, ...list]);

            // Marca agendamento como avaliado
            if (dto.agendamentoId) {
                this._avaliacoesAgendamento.update(map => {
                    const newMap = new Map(map);
                    newMap.set(dto.agendamentoId!, true);
                    return newMap;
                });
            }

            // Invalida cache de resumo
            if (dto.barbeariaId) {
                this._resumoBarbearia.update(map => {
                    const newMap = new Map(map);
                    newMap.delete(dto.barbeariaId!);
                    return newMap;
                });
            }
            if (dto.barbeiroId) {
                this._resumoBarbeiro.update(map => {
                    const newMap = new Map(map);
                    newMap.delete(dto.barbeiroId!);
                    return newMap;
                });
            }

            return avaliacao;
        } finally {
            this._carregando.set(false);
        }
    }

    // ========================================================
    // Responder avaliação (para barbeiros/admins)
    // ========================================================
    async responderAvaliacao(avaliacaoId: number, resposta: string): Promise<AvaliacaoDTO> {
        const dto: ResponderAvaliacaoDTO = { resposta };
        return firstValueFrom(
            this.http.post<AvaliacaoDTO>(`${this.apiUrl}/${avaliacaoId}/responder`, dto)
        );
    }

    // ========================================================
    // Listar avaliações de barbearia (paginado)
    // ========================================================
    async listarAvaliacoesBarbearia(
        barbeariaId: number,
        page: number = 0,
        size: number = 10
    ): Promise<PagedResponse<AvaliacaoDTO>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return firstValueFrom(
            this.http.get<PagedResponse<AvaliacaoDTO>>(
                `${this.apiUrl}/barbearias/${barbeariaId}`,
                { params }
            )
        );
    }

    // ========================================================
    // Listar avaliações de barbeiro (paginado)
    // ========================================================
    async listarAvaliacoesBarbeiro(
        barbeiroId: number,
        page: number = 0,
        size: number = 10
    ): Promise<PagedResponse<AvaliacaoDTO>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return firstValueFrom(
            this.http.get<PagedResponse<AvaliacaoDTO>>(
                `${this.apiUrl}/barbeiros/${barbeiroId}`,
                { params }
            )
        );
    }

    // ========================================================
    // Últimas avaliações de barbearia (para exibição rápida)
    // ========================================================
    async listarUltimasAvaliacoesBarbearia(barbeariaId: number): Promise<AvaliacaoDTO[]> {
        return firstValueFrom(
            this.http.get<AvaliacaoDTO[]>(`${this.apiUrl}/barbearias/${barbeariaId}/ultimas`)
        );
    }

    // ========================================================
    // Resumo de avaliações (média, total, distribuição)
    // ========================================================
    async obterResumoBarbearia(barbeariaId: number): Promise<ResumoAvaliacoesDTO> {
        const cached = this._resumoBarbearia().get(barbeariaId);
        if (cached) {
            return cached;
        }

        const resumo = await firstValueFrom(
            this.http.get<ResumoAvaliacoesDTO>(`${this.apiUrl}/barbearias/${barbeariaId}/resumo`)
        );

        this._resumoBarbearia.update(map => {
            const newMap = new Map(map);
            newMap.set(barbeariaId, resumo);
            return newMap;
        });

        return resumo;
    }

    async obterResumoBarbeiro(barbeiroId: number): Promise<ResumoAvaliacoesDTO> {
        const cached = this._resumoBarbeiro().get(barbeiroId);
        if (cached) {
            return cached;
        }

        const resumo = await firstValueFrom(
            this.http.get<ResumoAvaliacoesDTO>(`${this.apiUrl}/barbeiros/${barbeiroId}/resumo`)
        );

        this._resumoBarbeiro.update(map => {
            const newMap = new Map(map);
            newMap.set(barbeiroId, resumo);
            return newMap;
        });

        return resumo;
    }

    // ========================================================
    // Minhas avaliações (cliente)
    // ========================================================
    async carregarMinhasAvaliacoes(): Promise<void> {
        try {
            this._carregando.set(true);
            const avaliacoes = await firstValueFrom(
                this.http.get<AvaliacaoDTO[]>(`${this.apiUrl}/minhas`)
            );
            this._minhasAvaliacoes.set(avaliacoes);
        } finally {
            this._carregando.set(false);
        }
    }

    // ========================================================
    // Verificar se agendamento já foi avaliado
    // ========================================================
    async verificarAgendamentoAvaliado(agendamentoId: number): Promise<boolean> {
        const cached = this._avaliacoesAgendamento().get(agendamentoId);
        if (cached !== undefined) {
            return cached;
        }

        const avaliado = await firstValueFrom(
            this.http.get<boolean>(`${this.apiUrl}/agendamentos/${agendamentoId}/avaliado`)
        );

        this._avaliacoesAgendamento.update(map => {
            const newMap = new Map(map);
            newMap.set(agendamentoId, avaliado);
            return newMap;
        });

        return avaliado;
    }

    // ========================================================
    // Pendentes de resposta (para admin/barbeiro)
    // ========================================================
    async listarPendentesResposta(barbeariaId: number): Promise<AvaliacaoDTO[]> {
        return firstValueFrom(
            this.http.get<AvaliacaoDTO[]>(`${this.apiUrl}/pendentes/${barbeariaId}`)
        );
    }

    // ========================================================
    // Helpers
    // ========================================================
    getNotaDescricao(nota: number): string {
        switch (nota) {
            case 5: return 'Excelente';
            case 4: return 'Muito bom';
            case 3: return 'Bom';
            case 2: return 'Regular';
            case 1: return 'Ruim';
            default: return '';
        }
    }

    getNotaCor(nota: number): string {
        if (nota >= 4.5) return 'success';
        if (nota >= 3.5) return 'primary';
        if (nota >= 2.5) return 'warning';
        return 'danger';
    }

    formatarDataRelativa(data: string): string {
        const agora = new Date();
        const dataAvaliacao = new Date(data);
        const diffMs = agora.getTime() - dataAvaliacao.getTime();
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDias === 0) return 'Hoje';
        if (diffDias === 1) return 'Ontem';
        if (diffDias < 7) return `${diffDias} dias atrás`;
        if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas atrás`;
        if (diffDias < 365) return `${Math.floor(diffDias / 30)} meses atrás`;
        return `${Math.floor(diffDias / 365)} anos atrás`;
    }

    limparCache(): void {
        this._minhasAvaliacoes.set([]);
        this._resumoBarbearia.set(new Map());
        this._resumoBarbeiro.set(new Map());
        this._avaliacoesAgendamento.set(new Map());
    }
}
