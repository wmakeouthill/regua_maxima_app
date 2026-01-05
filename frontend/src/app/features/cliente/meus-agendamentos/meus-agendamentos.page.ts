import { Component, signal, inject, OnInit } from '@angular/core';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonChip, IonRefresher, IonRefresherContent, IonBadge,
    IonItemSliding, IonItemOptions, IonItemOption,
    IonSegment, IonSegmentButton, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
    calendarOutline, timeOutline, cutOutline, locationOutline,
    closeCircleOutline, checkmarkCircleOutline, alertCircleOutline,
    chevronForwardOutline, refreshOutline
} from 'ionicons/icons';
import { AgendamentoService, Agendamento, StatusAgendamento } from '@core/services/agendamento.service';

/**
 * Página de agendamentos do cliente.
 * Lista próximos agendamentos e histórico.
 */
@Component({
    selector: 'app-meus-agendamentos',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonList,
        IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
        IonChip, IonRefresher, IonRefresherContent, IonBadge,
        IonItemSliding, IonItemOptions, IonItemOption,
        IonSegment, IonSegmentButton, IonButtons, IonBackButton,
        DatePipe, CurrencyPipe, FormsModule, RouterLink
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button defaultHref="/tabs/cliente/explorar"></ion-back-button>
                </ion-buttons>
                <ion-title>Meus Agendamentos</ion-title>
            </ion-toolbar>
            <ion-toolbar>
                <ion-segment [(ngModel)]="segmento" (ionChange)="onSegmentoChange()">
                    <ion-segment-button value="proximos">
                        <ion-label>Próximos</ion-label>
                        @if (agendamentoService.meusAgendamentos().length > 0) {
                            <ion-badge color="primary">{{ agendamentoService.meusAgendamentos().length }}</ion-badge>
                        }
                    </ion-segment-button>
                    <ion-segment-button value="historico">
                        <ion-label>Histórico</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            @if (agendamentoService.carregando()) {
                <div class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <p>Carregando agendamentos...</p>
                </div>
            } @else if (segmento === 'proximos') {
                @if (agendamentoService.meusAgendamentos().length === 0) {
                    <div class="empty-state">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <h2>Nenhum agendamento</h2>
                        <p>Você não tem agendamentos futuros.</p>
                        <ion-button routerLink="/tabs/cliente/explorar">
                            <ion-icon slot="start" name="cut-outline"></ion-icon>
                            Agendar agora
                        </ion-button>
                    </div>
                } @else {
                    <ion-list>
                        @for (agendamento of agendamentoService.meusAgendamentos(); track agendamento.id) {
                            <ion-item-sliding>
                                <ion-item button (click)="verDetalhes(agendamento)">
                                    <div class="agendamento-item">
                                        <div class="agendamento-data">
                                            <span class="dia">{{ formatarDia(agendamento.data) }}</span>
                                            <span class="horario">{{ agendamento.horaInicio }}</span>
                                        </div>
                                        <div class="agendamento-info">
                                            <h3>{{ agendamento.servicoNome }}</h3>
                                            <p class="barbearia">
                                                <ion-icon name="location-outline"></ion-icon>
                                                {{ agendamento.barbeariaNome }}
                                            </p>
                                            <p class="barbeiro">
                                                <ion-icon name="cut-outline"></ion-icon>
                                                {{ agendamento.barbeiroNome }}
                                            </p>
                                        </div>
                                        <div class="agendamento-status">
                                            <ion-chip [color]="agendamentoService.getCorStatus(agendamento.status)" size="small">
                                                <ion-icon [name]="agendamentoService.getIconeStatus(agendamento.status)"></ion-icon>
                                                {{ agendamento.statusDescricao }}
                                            </ion-chip>
                                            <span class="preco">{{ agendamento.preco | currency:'BRL' }}</span>
                                        </div>
                                    </div>
                                </ion-item>

                                @if (agendamento.podeCancelar) {
                                    <ion-item-options side="end">
                                        <ion-item-option color="danger" (click)="cancelar(agendamento)">
                                            <ion-icon slot="icon-only" name="close-circle-outline"></ion-icon>
                                        </ion-item-option>
                                    </ion-item-options>
                                }
                            </ion-item-sliding>
                        }
                    </ion-list>
                }
            } @else {
                <!-- Histórico -->
                @if (historico().length === 0) {
                    <div class="empty-state">
                        <ion-icon name="time-outline"></ion-icon>
                        <h2>Sem histórico</h2>
                        <p>Você ainda não tem agendamentos concluídos.</p>
                    </div>
                } @else {
                    <ion-list>
                        @for (agendamento of historico(); track agendamento.id) {
                            <ion-item>
                                <div class="agendamento-item historico">
                                    <div class="agendamento-data">
                                        <span class="dia">{{ agendamento.data | date:'dd/MM' }}</span>
                                        <span class="horario">{{ agendamento.horaInicio }}</span>
                                    </div>
                                    <div class="agendamento-info">
                                        <h3>{{ agendamento.servicoNome }}</h3>
                                        <p class="barbearia">{{ agendamento.barbeariaNome }}</p>
                                    </div>
                                    <div class="agendamento-status">
                                        <ion-chip [color]="agendamentoService.getCorStatus(agendamento.status)" size="small">
                                            {{ agendamento.statusDescricao }}
                                        </ion-chip>
                                    </div>
                                </div>
                            </ion-item>
                        }
                    </ion-list>
                }
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
            color: var(--ion-color-medium);

            p {
                margin-top: 16px;
            }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 50vh;
            text-align: center;
            padding: 24px;

            ion-icon {
                font-size: 64px;
                color: var(--ion-color-medium);
                margin-bottom: 16px;
            }

            h2 {
                margin: 0 0 8px;
                color: var(--ion-color-dark);
            }

            p {
                margin: 0 0 24px;
                color: var(--ion-color-medium);
            }
        }

        .agendamento-item {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            padding: 12px 0;

            &.historico {
                opacity: 0.7;
            }
        }

        .agendamento-data {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 60px;
            padding: 8px;
            background: var(--ion-color-light);
            border-radius: 8px;

            .dia {
                font-weight: 700;
                font-size: 0.9rem;
                color: var(--ion-color-primary);
            }

            .horario {
                font-size: 0.85rem;
                color: var(--ion-color-medium);
            }
        }

        .agendamento-info {
            flex: 1;

            h3 {
                margin: 0 0 4px;
                font-size: 1rem;
                font-weight: 600;
            }

            p {
                margin: 0;
                font-size: 0.85rem;
                color: var(--ion-color-medium);
                display: flex;
                align-items: center;
                gap: 4px;

                ion-icon {
                    font-size: 14px;
                }
            }

            .barbeiro {
                margin-top: 2px;
            }
        }

        .agendamento-status {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;

            .preco {
                font-weight: 600;
                font-size: 0.9rem;
                color: var(--ion-color-success);
            }
        }

        ion-segment {
            padding: 0 8px;
        }
    `]
})
export class MeusAgendamentosPage implements OnInit {
    readonly agendamentoService = inject(AgendamentoService);

    segmento: 'proximos' | 'historico' = 'proximos';
    historico = signal<Agendamento[]>([]);

    constructor() {
        addIcons({
            calendarOutline, timeOutline, cutOutline, locationOutline,
            closeCircleOutline, checkmarkCircleOutline, alertCircleOutline,
            chevronForwardOutline, refreshOutline
        });
    }

    ngOnInit(): void {
        this.carregarAgendamentos();
    }

    carregarAgendamentos(): void {
        this.agendamentoService.buscarMeusAgendamentos().subscribe();
    }

    onRefresh(event: CustomEvent): void {
        this.agendamentoService.buscarMeusAgendamentos().subscribe({
            complete: () => (event.target as HTMLIonRefresherElement).complete()
        });
    }

    onSegmentoChange(): void {
        if (this.segmento === 'historico' && this.historico().length === 0) {
            // TODO: Carregar histórico paginado
        }
    }

    formatarDia(dataISO: string): string {
        return this.agendamentoService.formatarData(dataISO);
    }

    verDetalhes(agendamento: Agendamento): void {
        // TODO: Navegar para detalhes do agendamento
        console.log('Ver detalhes:', agendamento);
    }

    async cancelar(agendamento: Agendamento): Promise<void> {
        // TODO: Mostrar confirmação antes de cancelar
        this.agendamentoService.cancelarAgendamento(agendamento.id).subscribe({
            next: () => {
                console.log('Agendamento cancelado');
            },
            error: (err) => {
                console.error('Erro ao cancelar:', err);
            }
        });
    }
}
