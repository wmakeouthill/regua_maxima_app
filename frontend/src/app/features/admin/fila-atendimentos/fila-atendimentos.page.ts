import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonIcon, IonButton, IonSpinner, IonRefresher,
    IonRefresherContent, IonButtons, IonChip, IonList,
    IonItem, IonLabel, IonAvatar, IonItemSliding, IonItemOptions,
    IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    personOutline, timeOutline, checkmarkCircleOutline,
    closeCircleOutline, cutOutline, refreshOutline,
    callOutline
} from 'ionicons/icons';

/**
 * Status possíveis de um atendimento na fila
 */
type StatusAtendimento = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';

/**
 * Interface para um item da fila de atendimentos
 */
interface AtendimentoFila {
    id: string;
    cliente: {
        id: string;
        nome: string;
        telefone?: string;
        fotoUrl?: string;
    };
    servico: {
        id: string;
        nome: string;
        duracao: number;
        preco: number;
    };
    barbeiro?: {
        id: string;
        nome: string;
    };
    horaChegada: Date;
    status: StatusAtendimento;
    posicao: number;
}

/**
 * Página de Fila de Atendimentos do Admin.
 * Exibe lista de clientes aguardando atendimento em tempo real.
 */
@Component({
    selector: 'app-fila-atendimentos',
    standalone: true,
    imports: [
        DatePipe,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardContent, IonIcon, IonButton, IonSpinner, IonRefresher,
        IonRefresherContent, IonButtons, IonChip, IonList,
        IonItem, IonLabel, IonAvatar, IonItemSliding, IonItemOptions,
        IonItemOption
    ],
    templateUrl: './fila-atendimentos.page.html',
    styleUrl: './fila-atendimentos.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilaAtendimentosPage implements OnInit, OnDestroy {
    // Estado
    readonly carregando = signal(false);
    readonly atendimentos = signal<AtendimentoFila[]>([]);

    // Intervalos de polling
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    // Computed
    readonly atendimentosAguardando = computed(() =>
        this.atendimentos().filter(a => a.status === 'AGUARDANDO')
    );

    readonly atendimentosEmAtendimento = computed(() =>
        this.atendimentos().filter(a => a.status === 'EM_ATENDIMENTO')
    );

    readonly quantidadeAguardando = computed(() => this.atendimentosAguardando().length);
    readonly quantidadeEmAtendimento = computed(() => this.atendimentosEmAtendimento().length);
    readonly quantidadeHoje = computed(() => this.atendimentos().length);

    constructor() {
        addIcons({
            personOutline, timeOutline, checkmarkCircleOutline,
            closeCircleOutline, cutOutline, refreshOutline,
            callOutline
        });
    }

    ngOnInit(): void {
        this.carregarFila();
        this.iniciarPolling();
    }

    ngOnDestroy(): void {
        this.pararPolling();
    }

    carregarFila(): void {
        this.carregando.set(true);

        // TODO: Integrar com AtendimentoService real
        setTimeout(() => {
            this.atendimentos.set([
                {
                    id: '1',
                    cliente: { id: 'c1', nome: 'João Silva', telefone: '11999998888' },
                    servico: { id: 's1', nome: 'Corte Degradê', duracao: 30, preco: 45 },
                    horaChegada: new Date(),
                    status: 'AGUARDANDO',
                    posicao: 1
                },
                {
                    id: '2',
                    cliente: { id: 'c2', nome: 'Pedro Santos' },
                    servico: { id: 's2', nome: 'Barba Completa', duracao: 20, preco: 35 },
                    horaChegada: new Date(Date.now() - 10 * 60000),
                    status: 'AGUARDANDO',
                    posicao: 2
                },
                {
                    id: '3',
                    cliente: { id: 'c3', nome: 'Carlos Oliveira', telefone: '11988887777' },
                    servico: { id: 's1', nome: 'Corte Degradê', duracao: 30, preco: 45 },
                    barbeiro: { id: 'b1', nome: 'Ricardo' },
                    horaChegada: new Date(Date.now() - 25 * 60000),
                    status: 'EM_ATENDIMENTO',
                    posicao: 0
                }
            ]);
            this.carregando.set(false);
        }, 500);
    }

    iniciarPolling(): void {
        this.pollingInterval = setInterval(() => {
            this.carregarFila();
        }, 5000);
    }

    pararPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    handleRefresh(event: CustomEvent): void {
        this.carregarFila();
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 500);
    }

    recarregar(): void {
        this.carregarFila();
    }

    getStatusColor(status: StatusAtendimento): string {
        const cores: Record<StatusAtendimento, string> = {
            'AGUARDANDO': 'warning',
            'EM_ATENDIMENTO': 'primary',
            'CONCLUIDO': 'success',
            'CANCELADO': 'danger'
        };
        return cores[status];
    }

    getStatusLabel(status: StatusAtendimento): string {
        const labels: Record<StatusAtendimento, string> = {
            'AGUARDANDO': 'Aguardando',
            'EM_ATENDIMENTO': 'Atendendo',
            'CONCLUIDO': 'Concluído',
            'CANCELADO': 'Cancelado'
        };
        return labels[status];
    }

    iniciarAtendimento(atendimento: AtendimentoFila): void {
        // TODO: Chamar serviço para iniciar atendimento
        console.log('Iniciar atendimento:', atendimento.id);
        this.atendimentos.update(lista =>
            lista.map(a => a.id === atendimento.id
                ? { ...a, status: 'EM_ATENDIMENTO' as StatusAtendimento }
                : a
            )
        );
    }

    finalizarAtendimento(atendimento: AtendimentoFila): void {
        // TODO: Chamar serviço para finalizar
        console.log('Finalizar atendimento:', atendimento.id);
        this.atendimentos.update(lista =>
            lista.filter(a => a.id !== atendimento.id)
        );
    }

    cancelarAtendimento(atendimento: AtendimentoFila): void {
        // TODO: Confirmar e chamar serviço
        console.log('Cancelar atendimento:', atendimento.id);
        this.atendimentos.update(lista =>
            lista.filter(a => a.id !== atendimento.id)
        );
    }

    ligarCliente(atendimento: AtendimentoFila): void {
        if (atendimento.cliente.telefone) {
            window.open(`tel:${atendimento.cliente.telefone}`, '_system');
        }
    }
}
