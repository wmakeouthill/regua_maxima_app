import { Component, OnInit, OnDestroy, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonIcon, IonButton, IonSpinner, IonRefresher,
    IonRefresherContent, IonButtons, IonChip, IonList,
    IonItem, IonLabel, IonAvatar, IonItemSliding, IonItemOptions,
    IonItemOption, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    personOutline, timeOutline, checkmarkCircleOutline,
    closeCircleOutline, cutOutline, refreshOutline,
    alertCircleOutline, businessOutline, settingsOutline, swapHorizontalOutline,
    personAddOutline
} from 'ionicons/icons';
import { AtendimentoService, Atendimento, StatusAtendimento } from '@core/services/atendimento.service';

/**
 * Página de Fila de Atendimentos do Admin.
 * Exibe lista de clientes aguardando atendimento em tempo real.
 */
@Component({
    selector: 'app-fila-atendimentos',
    standalone: true,
    imports: [
        RouterLink,
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
    private readonly atendimentoService = inject(AtendimentoService);
    private readonly toastController = inject(ToastController);

    // Estado do serviço
    readonly carregando = this.atendimentoService.carregando;
    readonly erro = this.atendimentoService.erro;
    readonly cadastroIncompleto = this.atendimentoService.cadastroIncompleto;
    readonly semPermissao = this.atendimentoService.semPermissao;

    // Intervalos de polling
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    // Computed - usando o serviço diretamente
    readonly atendimentoAtual = this.atendimentoService.atendimentoAtual;
    readonly filaEspera = this.atendimentoService.filaEspera;
    readonly quantidadeAguardando = this.atendimentoService.totalAguardando;
    readonly quantidadeHoje = this.atendimentoService.totalAtendidosHoje;
    readonly emAtendimento = this.atendimentoService.emAtendimento;

    // Atendimentos combinados para exibição
    readonly atendimentos = computed(() => {
        const atual = this.atendimentoAtual();
        const fila = this.filaEspera();
        if (atual) {
            return [atual, ...fila];
        }
        return fila;
    });

    readonly atendimentosAguardando = computed(() =>
        this.atendimentos().filter(a => a.status === 'AGUARDANDO')
    );

    readonly atendimentosEmAtendimento = computed(() =>
        this.atendimentos().filter(a => a.status === 'EM_ATENDIMENTO')
    );

    constructor() {
        addIcons({
            personOutline, timeOutline, checkmarkCircleOutline,
            closeCircleOutline, cutOutline, refreshOutline,
            alertCircleOutline, businessOutline, settingsOutline, swapHorizontalOutline,
            personAddOutline
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
        // O serviço já trata o 404 e seta cadastroIncompleto
        this.atendimentoService.buscarMinhaFila().subscribe();
    }

    iniciarPolling(): void {
        this.pollingInterval = setInterval(() => {
            this.carregarFila();
        }, 10000); // 10 segundos
    }

    pararPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    handleRefresh(event: CustomEvent): void {
        this.atendimentoService.buscarMinhaFila().subscribe({
            next: () => (event.target as HTMLIonRefresherElement).complete(),
            error: () => (event.target as HTMLIonRefresherElement).complete()
        });
    }

    recarregar(): void {
        this.carregarFila();
    }

    getStatusColor(status: StatusAtendimento): string {
        const cores: Record<StatusAtendimento, string> = {
            'AGUARDANDO': 'warning',
            'EM_ATENDIMENTO': 'primary',
            'CONCLUIDO': 'success',
            'CANCELADO': 'danger',
            'NAO_COMPARECEU': 'medium'
        };
        return cores[status];
    }

    getStatusLabel(status: StatusAtendimento): string {
        const labels: Record<StatusAtendimento, string> = {
            'AGUARDANDO': 'Aguardando',
            'EM_ATENDIMENTO': 'Atendendo',
            'CONCLUIDO': 'Concluído',
            'CANCELADO': 'Cancelado',
            'NAO_COMPARECEU': 'Não Compareceu'
        };
        return labels[status];
    }

    async iniciarAtendimento(atendimento: Atendimento): Promise<void> {
        this.atendimentoService.iniciarAtendimento(atendimento.id).subscribe({
            next: async () => {
                const toast = await this.toastController.create({
                    message: `Atendimento de ${atendimento.cliente.nome} iniciado!`,
                    duration: 2000,
                    color: 'success'
                });
                await toast.present();
            },
            error: async (err) => {
                const toast = await this.toastController.create({
                    message: err.error?.message || 'Erro ao iniciar atendimento',
                    duration: 3000,
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    async finalizarAtendimento(atendimento: Atendimento): Promise<void> {
        this.atendimentoService.finalizarAtendimento().subscribe({
            next: async () => {
                const toast = await this.toastController.create({
                    message: 'Atendimento finalizado!',
                    duration: 2000,
                    color: 'success'
                });
                await toast.present();
            },
            error: async (err) => {
                const toast = await this.toastController.create({
                    message: err.error?.message || 'Erro ao finalizar atendimento',
                    duration: 3000,
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    async cancelarAtendimento(atendimento: Atendimento): Promise<void> {
        this.atendimentoService.cancelarAtendimento(atendimento.id).subscribe({
            next: async () => {
                const toast = await this.toastController.create({
                    message: 'Atendimento cancelado',
                    duration: 2000,
                    color: 'warning'
                });
                await toast.present();
            },
            error: async (err) => {
                const toast = await this.toastController.create({
                    message: err.error?.message || 'Erro ao cancelar atendimento',
                    duration: 3000,
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    ligarCliente(_atendimento: Atendimento): void {
        // Cliente não tem telefone neste DTO resumido
        // Implementar buscando dados completos do cliente se necessário
    }
}
