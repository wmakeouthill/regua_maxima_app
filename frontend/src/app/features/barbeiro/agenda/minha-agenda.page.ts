import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent,
    IonIcon, IonButton, IonGrid, IonRow, IonCol,
    IonList, IonItem, IonLabel, IonButtons, IonChip, IonBadge,
    IonRefresher, IonRefresherContent, IonSpinner, IonSegment, IonSegmentButton,
    IonItemSliding, IonItemOptions, IonItemOption,
    AlertController, ToastController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
    calendarOutline, personOutline, starOutline,
    locationOutline, briefcaseOutline, timeOutline,
    notificationsOutline, checkmarkCircleOutline, linkOutline,
    playOutline, checkmarkOutline, closeOutline, alertCircleOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';
import { AgendamentoService, Agendamento, StatusAgendamento } from '@core/services/agendamento.service';

/**
 * Página principal do Barbeiro.
 * Exibe agenda do dia e status do perfil.
 */
@Component({
    selector: 'app-barbeiro-agenda',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, FormsModule, RouterLink, CurrencyPipe,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardContent,
        IonIcon, IonButton, IonGrid, IonRow, IonCol,
        IonList, IonItem, IonLabel, IonButtons, IonChip, IonBadge,
        IonRefresher, IonRefresherContent, IonSpinner, IonSegment, IonSegmentButton,
        IonItemSliding, IonItemOptions, IonItemOption
    ],
    template: `
        <ion-header>
            <ion-toolbar color="tertiary">
                <ion-title>Minha Agenda</ion-title>
                <ion-buttons slot="end">
                    @if (totalPendentes() > 0) {
                        <ion-badge color="warning">{{ totalPendentes() }}</ion-badge>
                    }
                    <ion-button>
                        <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            <!-- Welcome Section -->
            <div class="welcome-section">
                <div class="welcome-avatar">
                    <ion-icon name="person-outline"></ion-icon>
                </div>
                <div class="welcome-content">
                    <h1>{{ getPrimeiroNome() }}</h1>
                    <ion-chip color="light">
                        <ion-icon name="briefcase-outline"></ion-icon>
                        Barbeiro
                    </ion-chip>
                </div>
            </div>

            <!-- Stats do Dia -->
            <ion-grid>
                <ion-row>
                    <ion-col size="4">
                        <ion-card class="stat-card">
                            <ion-card-content>
                                <div class="stat-value">{{ agendamentosHoje().length }}</div>
                                <div class="stat-label">Hoje</div>
                            </ion-card-content>
                        </ion-card>
                    </ion-col>
                    <ion-col size="4">
                        <ion-card class="stat-card" [class.highlight]="totalPendentes() > 0">
                            <ion-card-content>
                                <div class="stat-value">{{ totalPendentes() }}</div>
                                <div class="stat-label">Pendentes</div>
                            </ion-card-content>
                        </ion-card>
                    </ion-col>
                    <ion-col size="4">
                        <ion-card class="stat-card">
                            <ion-card-content>
                                <div class="stat-value">⭐ 0</div>
                                <div class="stat-label">Avaliação</div>
                            </ion-card-content>
                        </ion-card>
                    </ion-col>
                </ion-row>
            </ion-grid>

            <!-- Segment de Visualização -->
            <ion-segment [(ngModel)]="visualizacao" class="view-segment">
                <ion-segment-button value="hoje">
                    <ion-label>Hoje</ion-label>
                </ion-segment-button>
                <ion-segment-button value="pendentes">
                    <ion-label>Pendentes</ion-label>
                    @if (totalPendentes() > 0) {
                        <ion-badge color="warning">{{ totalPendentes() }}</ion-badge>
                    }
                </ion-segment-button>
                <ion-segment-button value="semana">
                    <ion-label>Semana</ion-label>
                </ion-segment-button>
            </ion-segment>

            @if (carregando()) {
                <div class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <p>Carregando agenda...</p>
                </div>
            } @else {
                <!-- Agendamentos -->
                @if (agendamentosFiltrados().length > 0) {
                    <ion-list>
                        @for (agendamento of agendamentosFiltrados(); track agendamento.id) {
                            <ion-item-sliding>
                                <ion-item [button]="true" detail>
                                    <div class="time-badge" slot="start">
                                        {{ agendamento.horaInicio }}
                                    </div>
                                    <ion-label>
                                        <h2>{{ agendamento.clienteNome }}</h2>
                                        <p>{{ agendamento.servicoNome }} • {{ agendamento.duracaoMinutos }}min</p>
                                        <p>{{ agendamento.preco | currency:'BRL' }}</p>
                                    </ion-label>
                                    <ion-chip [color]="getStatusColor(agendamento.status)" slot="end">
                                        {{ getStatusLabel(agendamento.status) }}
                                    </ion-chip>
                                </ion-item>

                                <ion-item-options side="end">
                                    @if (agendamento.status === 'PENDENTE') {
                                        <ion-item-option color="success" (click)="confirmarAgendamento(agendamento)">
                                            <ion-icon name="checkmark-outline" slot="icon-only"></ion-icon>
                                        </ion-item-option>
                                    }
                                    @if (agendamento.status === 'CONFIRMADO') {
                                        <ion-item-option color="primary" (click)="iniciarAtendimento(agendamento)">
                                            <ion-icon name="play-outline" slot="icon-only"></ion-icon>
                                        </ion-item-option>
                                    }
                                    @if (agendamento.status === 'EM_ANDAMENTO') {
                                        <ion-item-option color="success" (click)="concluirAtendimento(agendamento)">
                                            <ion-icon name="checkmark-circle-outline" slot="icon-only"></ion-icon>
                                        </ion-item-option>
                                    }
                                    @if (podeRecusar(agendamento)) {
                                        <ion-item-option color="danger" (click)="recusarAgendamento(agendamento)">
                                            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
                                        </ion-item-option>
                                    }
                                </ion-item-options>
                            </ion-item-sliding>
                        }
                    </ion-list>
                } @else {
                    <ion-card class="empty-card">
                        <ion-card-content>
                            <ion-icon name="calendar-outline"></ion-icon>
                            @if (visualizacao === 'pendentes') {
                                <h4>Nenhum agendamento pendente</h4>
                                <p>Todos os agendamentos foram confirmados!</p>
                            } @else if (visualizacao === 'hoje') {
                                <h4>Nenhum agendamento hoje</h4>
                                <p>Sua agenda está livre. Bom descanso!</p>
                            } @else {
                                <h4>Nenhum agendamento esta semana</h4>
                                <p>Divulgue seus serviços para receber mais clientes!</p>
                            }
                        </ion-card-content>
                    </ion-card>
                }
            }

            <!-- Menu Rápido -->
            <div class="section-header">
                <h3>Menu Rápido</h3>
            </div>

            <ion-list>
                <ion-item button detail routerLink="/tabs/barbeiro/perfil">
                    <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>
                        <h2>Meu Perfil</h2>
                        <p>Bio, especialidades e fotos</p>
                    </ion-label>
                </ion-item>

                <ion-item button detail routerLink="/tabs/barbeiro/fila">
                    <ion-icon name="time-outline" slot="start" color="secondary"></ion-icon>
                    <ion-label>
                        <h2>Fila de Espera</h2>
                        <p>Gerenciar atendimentos sem agendamento</p>
                    </ion-label>
                </ion-item>

                <ion-item button detail routerLink="/tabs/barbeiro/vincular">
                    <ion-icon name="briefcase-outline" slot="start" color="tertiary"></ion-icon>
                    <ion-label>
                        <h2>Vincular a Barbearia</h2>
                        <p>Trabalhar em uma barbearia</p>
                    </ion-label>
                </ion-item>
            </ion-list>
        </ion-content>
    `,
    styles: [`
        .welcome-section {
            background: linear-gradient(135deg, var(--ion-color-tertiary) 0%, var(--ion-color-tertiary-shade) 100%);
            padding: 24px 16px;
            color: white;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .welcome-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .welcome-avatar ion-icon {
            font-size: 32px;
        }

        .welcome-content h1 {
            margin: 0 0 8px;
            font-size: 22px;
            font-weight: 700;
        }

        .welcome-content ion-chip {
            margin: 0;
        }

        .stat-card {
            text-align: center;
            margin: 8px 0;
        }

        .stat-card.highlight {
            background: var(--ion-color-warning-tint);
        }

        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--ion-color-dark);
        }

        .stat-label {
            font-size: 11px;
            color: var(--ion-color-medium);
        }

        .view-segment {
            margin: 16px;
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 48px 16px;
            gap: 16px;
            color: var(--ion-color-medium);
        }

        .time-badge {
            background: var(--ion-color-primary);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            min-width: 50px;
            text-align: center;
        }

        .section-header {
            padding: 16px 16px 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .section-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--ion-color-dark);
        }

        .empty-card {
            margin: 16px;
            text-align: center;
        }

        .empty-card ion-icon {
            font-size: 48px;
            color: var(--ion-color-medium);
            margin-bottom: 8px;
        }

        .empty-card h4 {
            margin: 0 0 4px;
            color: var(--ion-color-dark);
        }

        .empty-card p {
            margin: 0;
            color: var(--ion-color-medium);
            font-size: 14px;
        }

        ion-list {
            padding: 0 16px;
        }

        ion-item {
            --padding-start: 0;
            margin-bottom: 4px;
        }

        ion-item ion-icon[slot="start"] {
            margin-right: 16px;
        }

        ion-buttons ion-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 10px;
        }
    `]
})
export class MinhaAgendaPage implements OnInit {
    private authService = inject(AuthService);
    private agendamentoService = inject(AgendamentoService);
    private alertController = inject(AlertController);
    private toastController = inject(ToastController);

    visualizacao: 'hoje' | 'pendentes' | 'semana' = 'hoje';

    readonly carregando = signal(false);
    readonly agendamentosHoje = signal<Agendamento[]>([]);
    readonly agendamentosSemana = signal<Agendamento[]>([]);

    readonly totalPendentes = computed(() =>
        this.agendamentosHoje().filter(a => a.status === 'PENDENTE').length
    );

    readonly agendamentosFiltrados = computed(() => {
        const hoje = this.agendamentosHoje();
        switch (this.visualizacao) {
            case 'pendentes':
                return hoje.filter(a => a.status === 'PENDENTE');
            case 'semana':
                return this.agendamentosSemana();
            default:
                return hoje;
        }
    });

    constructor() {
        addIcons({
            calendarOutline, personOutline, starOutline,
            locationOutline, briefcaseOutline, timeOutline,
            notificationsOutline, checkmarkCircleOutline, linkOutline,
            playOutline, checkmarkOutline, closeOutline, alertCircleOutline
        });
    }

    ngOnInit() {
        this.carregarAgenda();
    }

    async doRefresh(event: any) {
        await this.carregarAgenda();
        event.target.complete();
    }

    private async carregarAgenda() {
        this.carregando.set(true);
        try {
            // Carregar agenda do barbeiro
            const hoje = new Date();
            this.agendamentoService.buscarAgendaDia().subscribe();

            // Simular delay da API
            await new Promise(resolve => setTimeout(resolve, 500));

            // Por enquanto usar dados mock
            // Em produção: this.agendamentoService.agendaBarbeiro()

        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
        } finally {
            this.carregando.set(false);
        }
    }

    getPrimeiroNome(): string {
        const nome = this.authService.currentUser()?.nome;
        return nome ? nome.split(' ')[0] : 'Barbeiro';
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
            'PENDENTE': 'Pendente',
            'CONFIRMADO': 'Confirmado',
            'EM_ANDAMENTO': 'Em Atendimento',
            'CONCLUIDO': 'Concluído',
            'CANCELADO_CLIENTE': 'Cancelado',
            'CANCELADO_BARBEIRO': 'Recusado',
            'CANCELADO_BARBEARIA': 'Cancelado',
            'NAO_COMPARECEU': 'Não Compareceu'
        };
        return labels[status] || status;
    }

    podeRecusar(agendamento: Agendamento): boolean {
        return agendamento.status === 'PENDENTE' || agendamento.status === 'CONFIRMADO';
    }

    async confirmarAgendamento(agendamento: Agendamento) {
        try {
            this.agendamentoService.confirmarAgendamento(agendamento.id);
            const toast = await this.toastController.create({
                message: 'Agendamento confirmado!',
                duration: 2000,
                color: 'success'
            });
            await toast.present();
            await this.carregarAgenda();
        } catch (error) {
            const toast = await this.toastController.create({
                message: 'Erro ao confirmar agendamento',
                duration: 2000,
                color: 'danger'
            });
            await toast.present();
        }
    }

    async iniciarAtendimento(agendamento: Agendamento) {
        try {
            this.agendamentoService.iniciarAtendimento(agendamento.id);
            const toast = await this.toastController.create({
                message: 'Atendimento iniciado!',
                duration: 2000,
                color: 'primary'
            });
            await toast.present();
            await this.carregarAgenda();
        } catch (error) {
            const toast = await this.toastController.create({
                message: 'Erro ao iniciar atendimento',
                duration: 2000,
                color: 'danger'
            });
            await toast.present();
        }
    }

    async concluirAtendimento(agendamento: Agendamento) {
        try {
            this.agendamentoService.concluirAgendamento(agendamento.id).subscribe();
            const toast = await this.toastController.create({
                message: 'Atendimento concluído!',
                duration: 2000,
                color: 'success'
            });
            await toast.present();
            await this.carregarAgenda();
        } catch (error) {
            const toast = await this.toastController.create({
                message: 'Erro ao concluir atendimento',
                duration: 2000,
                color: 'danger'
            });
            await toast.present();
        }
    }

    async recusarAgendamento(agendamento: Agendamento) {
        const alert = await this.alertController.create({
            header: 'Recusar Agendamento',
            message: 'Tem certeza que deseja recusar este agendamento?',
            inputs: [
                {
                    name: 'motivo',
                    type: 'textarea',
                    placeholder: 'Motivo da recusa'
                }
            ],
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Recusar',
                    handler: async (data) => {
                        try {
                            this.agendamentoService.cancelarPeloBarbeiro(agendamento.id, data.motivo);
                            const toast = await this.toastController.create({
                                message: 'Agendamento recusado',
                                duration: 2000,
                                color: 'warning'
                            });
                            await toast.present();
                            await this.carregarAgenda();
                        } catch (error) {
                            const toast = await this.toastController.create({
                                message: 'Erro ao recusar agendamento',
                                duration: 2000,
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
