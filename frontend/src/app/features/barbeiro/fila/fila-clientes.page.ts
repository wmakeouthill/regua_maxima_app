import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonSpinner, IonRefresher,
    IonRefresherContent, IonButtons, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    personOutline, timeOutline, checkmarkCircleOutline,
    cutOutline, refreshOutline, playOutline, happyOutline
} from 'ionicons/icons';

/**
 * Status do atendimento
 */
type StatusAtendimento = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';

/**
 * Interface para item da fila
 */
interface AtendimentoFila {
    id: string;
    cliente: {
        id: string;
        nome: string;
    };
    servico: {
        id: string;
        nome: string;
        duracao: number;
    };
    horaChegada: Date;
    status: StatusAtendimento;
}

/**
 * Página de Fila de Clientes do Barbeiro.
 * Versão simplificada focada no atendimento.
 */
@Component({
    selector: 'app-fila-clientes',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
        IonIcon, IonButton, IonSpinner, IonRefresher,
        IonRefresherContent, IonButtons, IonList, IonItem, IonLabel
    ],
    templateUrl: './fila-clientes.page.html',
    styleUrl: './fila-clientes.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilaClientesPage implements OnInit, OnDestroy {
    // Estado
    readonly carregando = signal(false);
    readonly barbeiroNome = signal('Ricardo Souza');
    readonly atendimentos = signal<AtendimentoFila[]>([]);

    // Polling
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    // Computed
    readonly clienteAtual = computed(() =>
        this.atendimentos().find(a => a.status === 'EM_ATENDIMENTO')
    );

    readonly filaEspera = computed(() =>
        this.atendimentos().filter(a => a.status === 'AGUARDANDO')
    );

    readonly proximoCliente = computed(() =>
        this.filaEspera()[0] ?? null
    );

    readonly emAtendimento = computed(() => !!this.clienteAtual());

    readonly atendimentosHoje = computed(() =>
        this.atendimentos().filter(a => a.status === 'CONCLUIDO').length +
        (this.clienteAtual() ? 1 : 0)
    );

    constructor() {
        addIcons({
            personOutline, timeOutline, checkmarkCircleOutline,
            cutOutline, refreshOutline, playOutline, happyOutline
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
                    cliente: { id: 'c1', nome: 'Carlos Oliveira' },
                    servico: { id: 's1', nome: 'Corte Degradê', duracao: 30 },
                    horaChegada: new Date(Date.now() - 25 * 60000),
                    status: 'EM_ATENDIMENTO'
                },
                {
                    id: '2',
                    cliente: { id: 'c2', nome: 'João Silva' },
                    servico: { id: 's1', nome: 'Corte Degradê', duracao: 30 },
                    horaChegada: new Date(Date.now() - 15 * 60000),
                    status: 'AGUARDANDO'
                },
                {
                    id: '3',
                    cliente: { id: 'c3', nome: 'Pedro Santos' },
                    servico: { id: 's2', nome: 'Barba Completa', duracao: 20 },
                    horaChegada: new Date(Date.now() - 5 * 60000),
                    status: 'AGUARDANDO'
                }
            ]);
            this.carregando.set(false);
        }, 500);
    }

    iniciarPolling(): void {
        this.pollingInterval = setInterval(() => {
            this.carregarFila();
        }, 10000);
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

    iniciarAtendimento(atendimento: AtendimentoFila): void {
        // TODO: Chamar serviço
        console.log('Iniciando atendimento:', atendimento.id);
        this.atendimentos.update(lista =>
            lista.map(a => a.id === atendimento.id
                ? { ...a, status: 'EM_ATENDIMENTO' as StatusAtendimento }
                : a
            )
        );
    }

    finalizarAtendimento(): void {
        const atual = this.clienteAtual();
        if (!atual) return;

        // TODO: Chamar serviço
        console.log('Finalizando atendimento:', atual.id);
        this.atendimentos.update(lista =>
            lista.map(a => a.id === atual.id
                ? { ...a, status: 'CONCLUIDO' as StatusAtendimento }
                : a
            ).filter(a => a.status !== 'CONCLUIDO')
        );
    }

    getTempoEspera(horaChegada: Date): string {
        const agora = new Date();
        const diffMs = agora.getTime() - horaChegada.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return `${diffMin} min`;
        const horas = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return `${horas}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
}
