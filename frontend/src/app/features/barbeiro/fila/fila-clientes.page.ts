import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonSpinner, IonRefresher,
    IonRefresherContent, IonButtons, IonList, IonItem, IonLabel,
    AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    personOutline, timeOutline, checkmarkCircleOutline,
    cutOutline, refreshOutline, playOutline, happyOutline,
    closeCircleOutline, alertCircleOutline
} from 'ionicons/icons';
import { AtendimentoService, Atendimento } from '../../../core/services/atendimento.service';

/**
 * Página de Fila de Clientes do Barbeiro.
 * Versão integrada com backend real.
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
    private readonly atendimentoService = inject(AtendimentoService);
    private readonly alertController = inject(AlertController);
    private readonly toastController = inject(ToastController);

    // Polling
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    // Estado do serviço (reativos)
    readonly carregando = this.atendimentoService.carregando;
    readonly erro = this.atendimentoService.erro;
    readonly filaAtual = this.atendimentoService.filaAtual;

    // Computed do serviço
    readonly clienteAtual = this.atendimentoService.atendimentoAtual;
    readonly filaEspera = this.atendimentoService.filaEspera;
    readonly proximoCliente = this.atendimentoService.proximoCliente;
    readonly emAtendimento = this.atendimentoService.emAtendimento;

    // Computed locais
    readonly barbeiroNome = computed(() => this.filaAtual()?.barbeiroNome ?? 'Barbeiro');
    readonly atendimentosHoje = computed(() =>
        (this.filaAtual()?.totalAtendidosHoje ?? 0) + (this.clienteAtual() ? 1 : 0)
    );

    constructor() {
        addIcons({
            personOutline, timeOutline, checkmarkCircleOutline,
            cutOutline, refreshOutline, playOutline, happyOutline,
            closeCircleOutline, alertCircleOutline
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
        this.atendimentoService.buscarMinhaFila().subscribe({
            error: (err) => {
                console.error('Erro ao carregar fila:', err);
                this.mostrarToast('Erro ao carregar fila', 'danger');
            }
        });
    }

    iniciarPolling(): void {
        // Atualiza a cada 15 segundos
        this.pollingInterval = setInterval(() => {
            this.carregarFila();
        }, 15000);
    }

    pararPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    handleRefresh(event: CustomEvent): void {
        this.atendimentoService.buscarMinhaFila().subscribe({
            next: () => {
                (event.target as HTMLIonRefresherElement).complete();
            },
            error: () => {
                (event.target as HTMLIonRefresherElement).complete();
            }
        });
    }

    recarregar(): void {
        this.carregarFila();
    }

    iniciarAtendimento(atendimento: Atendimento): void {
        this.atendimentoService.iniciarAtendimento(atendimento.id).subscribe({
            next: () => {
                this.mostrarToast('Atendimento iniciado!', 'success');
            },
            error: (err) => {
                console.error('Erro ao iniciar atendimento:', err);
                this.mostrarToast(err.error?.message ?? 'Erro ao iniciar atendimento', 'danger');
            }
        });
    }

    finalizarAtendimento(): void {
        this.atendimentoService.finalizarAtendimento().subscribe({
            next: () => {
                this.mostrarToast('Atendimento finalizado!', 'success');
            },
            error: (err) => {
                console.error('Erro ao finalizar atendimento:', err);
                this.mostrarToast(err.error?.message ?? 'Erro ao finalizar atendimento', 'danger');
            }
        });
    }

    async cancelarAtendimento(atendimento: Atendimento): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Cancelar Atendimento',
            message: `Deseja cancelar o atendimento de ${atendimento.cliente.nome}?`,
            inputs: [
                {
                    name: 'motivo',
                    type: 'textarea',
                    placeholder: 'Motivo do cancelamento (opcional)'
                }
            ],
            buttons: [
                {
                    text: 'Não',
                    role: 'cancel'
                },
                {
                    text: 'Sim, Cancelar',
                    handler: (data) => {
                        this.atendimentoService.cancelarAtendimento(atendimento.id, data.motivo).subscribe({
                            next: () => {
                                this.mostrarToast('Atendimento cancelado', 'warning');
                            },
                            error: (err) => {
                                this.mostrarToast(err.error?.message ?? 'Erro ao cancelar', 'danger');
                            }
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    async marcarNaoCompareceu(atendimento: Atendimento): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Não Compareceu',
            message: `Marcar ${atendimento.cliente.nome} como não compareceu?`,
            buttons: [
                {
                    text: 'Não',
                    role: 'cancel'
                },
                {
                    text: 'Sim',
                    handler: () => {
                        this.atendimentoService.marcarNaoCompareceu(atendimento.id).subscribe({
                            next: () => {
                                this.mostrarToast('Cliente marcado como não compareceu', 'warning');
                            },
                            error: (err) => {
                                this.mostrarToast(err.error?.message ?? 'Erro ao marcar', 'danger');
                            }
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    getTempoEspera(horaChegada: string | Date): string {
        const chegada = typeof horaChegada === 'string' ? new Date(horaChegada) : horaChegada;
        const agora = new Date();
        const diffMs = agora.getTime() - chegada.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return `${diffMin} min`;

        const horas = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return `${horas}h${mins > 0 ? ` ${mins}m` : ''}`;
    }

    private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
        const toast = await this.toastController.create({
            message,
            duration: 2500,
            color,
            position: 'bottom'
        });
        await toast.present();
    }
}

