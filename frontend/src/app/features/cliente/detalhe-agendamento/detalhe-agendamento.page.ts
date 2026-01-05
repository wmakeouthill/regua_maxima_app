import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonChip, IonButtons, IonBackButton, IonText, IonList,
    AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline, timeOutline, cutOutline, personOutline,
    locationOutline, cashOutline, closeCircle, checkmarkCircle,
    callOutline, navigateOutline, alertCircleOutline
} from 'ionicons/icons';

import { AgendamentoService, Agendamento, StatusAgendamento } from '../../../core/services/agendamento.service';

@Component({
    selector: 'app-detalhe-agendamento',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, RouterLink,
        IonHeader, IonToolbar, IonTitle, IonContent,
        IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
        IonCard, IonCardHeader, IonCardTitle, IonCardContent,
        IonChip, IonButtons, IonBackButton, IonText, IonList,
        DatePipe, CurrencyPipe
    ],
    template: `
        <ion-header>
            <ion-toolbar color="primary">
                <ion-buttons slot="start">
                    <ion-back-button defaultHref="/tabs/cliente/agendamentos"></ion-back-button>
                </ion-buttons>
                <ion-title>Detalhes do Agendamento</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            @if (carregando()) {
                <div class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <p>Carregando...</p>
                </div>
            } @else if (agendamento()) {
                <!-- Status Badge -->
                <div class="status-container">
                    <ion-chip [color]="getStatusColor(agendamento()!.status)">
                        <ion-icon [name]="getStatusIcon(agendamento()!.status)"></ion-icon>
                        {{ getStatusLabel(agendamento()!.status) }}
                    </ion-chip>
                </div>

                <!-- Info da Barbearia -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>
                            <ion-icon name="location-outline"></ion-icon>
                            Barbearia
                        </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <h2>{{ agendamento()!.barbeariaNome }}</h2>
                        <p>{{ agendamento()!.barbeariaEndereco }}</p>
                        
                        <div class="action-buttons">
                            <ion-button fill="outline" size="small">
                                <ion-icon name="call-outline" slot="start"></ion-icon>
                                Ligar
                            </ion-button>
                            <ion-button fill="outline" size="small">
                                <ion-icon name="navigate-outline" slot="start"></ion-icon>
                                Como Chegar
                            </ion-button>
                        </div>
                    </ion-card-content>
                </ion-card>

                <!-- Data e Hora -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>
                            <ion-icon name="calendar-outline"></ion-icon>
                            Data e Hora
                        </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <div class="datetime-info">
                            <div class="date">
                                {{ getDataCompleta() | date:'EEEE':'':'pt-BR' | titlecase }}
                                <br>
                                <strong>{{ getDataCompleta() | date:'dd MMMM yyyy':'':'pt-BR' }}</strong>
                            </div>
                            <div class="time">
                                <strong>{{ agendamento()!.horaInicio }}</strong>
                            </div>
                        </div>
                    </ion-card-content>
                </ion-card>

                <!-- Serviço -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>
                            <ion-icon name="cut-outline"></ion-icon>
                            Serviço
                        </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <ion-list lines="none">
                            <ion-item>
                                <ion-label>
                                    <h2>{{ agendamento()!.servicoNome }}</h2>
                                    <p>{{ agendamento()!.duracaoMinutos }} minutos</p>
                                </ion-label>
                                <ion-text slot="end" color="primary">
                                    <strong>{{ agendamento()!.preco | currency:'BRL' }}</strong>
                                </ion-text>
                            </ion-item>
                        </ion-list>
                    </ion-card-content>
                </ion-card>

                <!-- Profissional -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>
                            <ion-icon name="person-outline"></ion-icon>
                            Profissional
                        </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <div class="barbeiro-info">
                            <div class="avatar">
                                {{ getInitiais(agendamento()!.barbeiroNome) }}
                            </div>
                            <div class="info">
                                <h3>{{ agendamento()!.barbeiroNome }}</h3>
                            </div>
                        </div>
                    </ion-card-content>
                </ion-card>

                <!-- Observações -->
                @if (agendamento()!.observacoesCliente) {
                    <ion-card>
                        <ion-card-header>
                            <ion-card-title>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                                Observações
                            </ion-card-title>
                        </ion-card-header>
                        <ion-card-content>
                            <p>{{ agendamento()!.observacoesCliente }}</p>
                        </ion-card-content>
                    </ion-card>
                }

                <!-- Motivo de Cancelamento -->
                @if (agendamento()!.motivoCancelamento) {
                    <ion-card color="danger">
                        <ion-card-header>
                            <ion-card-title>
                                <ion-icon name="close-circle"></ion-icon>
                                Motivo do Cancelamento
                            </ion-card-title>
                        </ion-card-header>
                        <ion-card-content>
                            <p>{{ agendamento()!.motivoCancelamento }}</p>
                        </ion-card-content>
                    </ion-card>
                }

                <!-- Ações -->
                @if (podeCancelar()) {
                    <div class="actions-container">
                        <ion-button 
                            expand="block" 
                            color="danger" 
                            fill="outline"
                            (click)="cancelarAgendamento()">
                            <ion-icon name="close-circle" slot="start"></ion-icon>
                            Cancelar Agendamento
                        </ion-button>
                    </div>
                }

            } @else {
                <div class="empty-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <p>Agendamento não encontrado</p>
                    <ion-button routerLink="/tabs/cliente/agendamentos">
                        Ver Meus Agendamentos
                    </ion-button>
                </div>
            }
        </ion-content>
    `,
    styles: [`
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 50vh;
            gap: 16px;
            color: var(--ion-color-medium);
        }

        .status-container {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
        }

        .status-container ion-chip {
            font-size: 14px;
            padding: 8px 16px;
        }

        ion-card {
            margin: 0 0 16px;
        }

        ion-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
        }

        ion-card-title ion-icon {
            font-size: 20px;
        }

        ion-card-content h2 {
            margin: 0 0 4px;
            font-size: 18px;
            font-weight: 600;
        }

        ion-card-content p {
            margin: 0;
            color: var(--ion-color-medium);
        }

        .action-buttons {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .datetime-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .datetime-info .date {
            color: var(--ion-color-medium);
        }

        .datetime-info .date strong {
            font-size: 18px;
            color: var(--ion-text-color);
        }

        .datetime-info .time {
            background: var(--ion-color-primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
        }

        .datetime-info .time strong {
            font-size: 24px;
        }

        .barbeiro-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .barbeiro-info .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--ion-color-primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 18px;
        }

        .barbeiro-info h3 {
            margin: 0;
            font-size: 16px;
        }

        .actions-container {
            padding: 16px 0;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 50vh;
            gap: 16px;
            text-align: center;
        }

        .empty-state ion-icon {
            font-size: 64px;
            color: var(--ion-color-medium);
        }

        .empty-state p {
            color: var(--ion-color-medium);
            font-size: 16px;
        }
    `]
})
export class DetalheAgendamentoPage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private agendamentoService = inject(AgendamentoService);
    private alertController = inject(AlertController);
    private toastController = inject(ToastController);

    readonly carregando = signal(true);
    readonly agendamento = signal<Agendamento | null>(null);

    constructor() {
        addIcons({
            calendarOutline, timeOutline, cutOutline, personOutline,
            locationOutline, cashOutline, closeCircle, checkmarkCircle,
            callOutline, navigateOutline, alertCircleOutline
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.carregarAgendamento(+id);
        } else {
            this.router.navigate(['/tabs/cliente/agendamentos']);
        }
    }

    private async carregarAgendamento(id: number) {
        this.carregando.set(true);
        try {
            // TODO: Implementar endpoint para buscar agendamento por ID
            // Mock por enquanto
            await new Promise(resolve => setTimeout(resolve, 500));

            this.agendamento.set({
                id,
                clienteId: 1,
                clienteNome: 'Cliente Teste',
                barbeiroId: 1,
                barbeiroNome: 'Carlos Silva',
                barbeariaId: 1,
                barbeariaNome: 'Barbearia Exemplo',
                barbeariaEndereco: 'Rua Exemplo, 123 - Centro',
                servicoId: 1,
                servicoNome: 'Corte + Barba',
                preco: 55,
                duracaoMinutos: 45,
                data: new Date().toISOString().split('T')[0],
                horaInicio: '10:00',
                horaFim: '10:45',
                status: 'CONFIRMADO' as StatusAgendamento,
                statusDescricao: 'Confirmado',
                observacoesCliente: undefined,
                motivoCancelamento: undefined,
                dataCriacao: new Date().toISOString(),
                isHoje: true,
                isFuturo: true,
                podeCancelar: true,
                podeConfirmar: false,
                podeIniciar: true,
                podeFinalizar: false
            });

        } catch (error) {
            console.error('Erro ao carregar agendamento:', error);
            const toast = await this.toastController.create({
                message: 'Erro ao carregar agendamento',
                duration: 3000,
                color: 'danger'
            });
            await toast.present();
        } finally {
            this.carregando.set(false);
        }
    }

    getStatusColor(status: StatusAgendamento): string {
        const cores: Record<StatusAgendamento, string> = {
            'PENDENTE': 'warning',
            'CONFIRMADO': 'success',
            'EM_ANDAMENTO': 'primary',
            'CONCLUIDO': 'success',
            'CANCELADO_CLIENTE': 'danger',
            'CANCELADO_BARBEIRO': 'danger',
            'CANCELADO_BARBEARIA': 'danger',
            'NAO_COMPARECEU': 'medium'
        };
        return cores[status] || 'medium';
    }

    getStatusLabel(status: StatusAgendamento): string {
        const labels: Record<StatusAgendamento, string> = {
            'PENDENTE': 'Aguardando Confirmação',
            'CONFIRMADO': 'Confirmado',
            'EM_ANDAMENTO': 'Em Atendimento',
            'CONCLUIDO': 'Concluído',
            'CANCELADO_CLIENTE': 'Cancelado por Você',
            'CANCELADO_BARBEIRO': 'Cancelado pelo Barbeiro',
            'CANCELADO_BARBEARIA': 'Cancelado pela Barbearia',
            'NAO_COMPARECEU': 'Não Compareceu'
        };
        return labels[status] || status;
    }

    getStatusIcon(status: StatusAgendamento): string {
        if (status.startsWith('CANCELADO') || status === 'NAO_COMPARECEU') {
            return 'close-circle';
        }
        if (status === 'CONCLUIDO' || status === 'CONFIRMADO') {
            return 'checkmark-circle';
        }
        return 'time-outline';
    }

    /**
     * Retorna a data completa do agendamento para uso no template.
     */
    getDataCompleta(): Date {
        const ag = this.agendamento();
        if (!ag) return new Date();
        return this.getDataCompletaFromAgendamento(ag);
    }

    /**
     * Converte data + horaInicio em um Date object.
     */
    private getDataCompletaFromAgendamento(ag: Agendamento): Date {
        return new Date(`${ag.data}T${ag.horaInicio}:00`);
    }

    getInitiais(nome: string): string {
        return nome
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    podeCancelar(): boolean {
        const ag = this.agendamento();
        if (!ag) return false;

        const statusCancelavel = ['PENDENTE', 'CONFIRMADO'];
        if (!statusCancelavel.includes(ag.status)) return false;

        // Verificar se está a mais de 2 horas do horário
        const dataAgendamento = this.getDataCompletaFromAgendamento(ag);
        const agora = new Date();
        const diff = dataAgendamento.getTime() - agora.getTime();
        const horas = diff / (1000 * 60 * 60);

        return horas > 2;
    }

    async cancelarAgendamento() {
        const alert = await this.alertController.create({
            header: 'Cancelar Agendamento',
            message: 'Tem certeza que deseja cancelar este agendamento?',
            inputs: [
                {
                    name: 'motivo',
                    type: 'textarea',
                    placeholder: 'Motivo do cancelamento (opcional)'
                }
            ],
            buttons: [
                { text: 'Não', role: 'cancel' },
                {
                    text: 'Sim, Cancelar',
                    handler: async (data) => {
                        try {
                            const ag = this.agendamento()!;
                            this.agendamentoService.cancelarAgendamento(ag.id, data.motivo || undefined).subscribe();

                            const toast = await this.toastController.create({
                                message: 'Agendamento cancelado com sucesso',
                                duration: 3000,
                                color: 'success'
                            });
                            await toast.present();

                            this.router.navigate(['/tabs/cliente/agendamentos']);
                        } catch (error) {
                            const toast = await this.toastController.create({
                                message: 'Erro ao cancelar agendamento',
                                duration: 3000,
                                color: 'danger'
                            });
                            await toast.present();
                        }
                    }
                }
            ]
        });
        await alert.present();
    }
}
