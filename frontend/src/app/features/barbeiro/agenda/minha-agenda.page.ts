import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonGrid, IonRow, IonCol,
    IonList, IonItem, IonLabel, IonButtons, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline, personOutline, starOutline,
    locationOutline, briefcaseOutline, timeOutline,
    notificationsOutline, checkmarkCircleOutline, linkOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';

/**
 * Página principal do Barbeiro.
 * Exibe agenda do dia e status do perfil.
 */
@Component({
    selector: 'app-barbeiro-agenda',
    standalone: true,
    imports: [
        RouterLink,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
        IonIcon, IonButton, IonGrid, IonRow, IonCol,
        IonList, IonItem, IonLabel, IonButtons, IonChip
    ],
    template: `
        <ion-header>
            <ion-toolbar color="tertiary">
                <ion-title>Minha Agenda</ion-title>
                <ion-buttons slot="end">
                    <ion-button>
                        <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
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
                                <div class="stat-value">0</div>
                                <div class="stat-label">Hoje</div>
                            </ion-card-content>
                        </ion-card>
                    </ion-col>
                    <ion-col size="4">
                        <ion-card class="stat-card">
                            <ion-card-content>
                                <div class="stat-value">0</div>
                                <div class="stat-label">Semana</div>
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

            <!-- Próximos Agendamentos -->
            <div class="section-header">
                <h3>Agenda de Hoje</h3>
                <ion-button fill="clear" size="small">Ver semana</ion-button>
            </div>

            <ion-card class="empty-card">
                <ion-card-content>
                    <ion-icon name="calendar-outline"></ion-icon>
                    <h4>Nenhum agendamento hoje</h4>
                    <p>Sua agenda está livre. Bom descanso!</p>
                </ion-card-content>
            </ion-card>

            <!-- Menu Rápido -->
            <div class="section-header">
                <h3>Menu Rápido</h3>
            </div>

            <ion-list>
                <ion-item button detail routerLink="/tabs/barbeiro/meu-perfil">
                    <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>
                        <h2>Meu Perfil</h2>
                        <p>Bio, especialidades e fotos</p>
                    </ion-label>
                </ion-item>

                <ion-item button detail routerLink="/tabs/barbeiro/vincular">
                    <ion-icon name="briefcase-outline" slot="start" color="secondary"></ion-icon>
                    <ion-label>
                        <h2>Vincular a Barbearia</h2>
                        <p>Trabalhar em uma barbearia</p>
                    </ion-label>
                </ion-item>

                <ion-item button detail>
                    <ion-icon name="location-outline" slot="start" color="tertiary"></ion-icon>
                    <ion-label>
                        <h2>Minha Localização</h2>
                        <p>Aparecer no mapa de barbeiros</p>
                    </ion-label>
                    <ion-chip slot="end" color="success">
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        Ativo
                    </ion-chip>
                </ion-item>

                <ion-item button detail>
                    <ion-icon name="star-outline" slot="start" color="warning"></ion-icon>
                    <ion-label>
                        <h2>Avaliações</h2>
                        <p>Ver feedback dos clientes</p>
                    </ion-label>
                </ion-item>

                <ion-item button detail>
                    <ion-icon name="time-outline" slot="start" color="dark"></ion-icon>
                    <ion-label>
                        <h2>Horários de Trabalho</h2>
                        <p>Configurar disponibilidade</p>
                    </ion-label>
                </ion-item>
            </ion-list>

            <!-- Card de Status -->
            <ion-card class="status-card">
                <ion-card-header>
                    <ion-card-subtitle>Status do Perfil</ion-card-subtitle>
                    <ion-card-title>Complete seu cadastro</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <p>Preencha suas informações para aparecer no mapa e receber agendamentos.</p>
                    <ion-button expand="block" routerLink="/tabs/barbeiro/meu-perfil">
                        Completar Perfil
                    </ion-button>
                </ion-card-content>
            </ion-card>
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

        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--ion-color-dark);
        }

        .stat-label {
            font-size: 11px;
            color: var(--ion-color-medium);
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
            margin: 0 16px;
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

        .status-card {
            margin: 16px;
            background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, var(--ion-color-primary) 100%);
            color: white;
        }

        .status-card ion-card-subtitle,
        .status-card ion-card-title {
            color: white;
        }

        .status-card ion-card-subtitle {
            opacity: 0.8;
        }

        .status-card ion-button {
            margin-top: 12px;
            --background: white;
            --color: var(--ion-color-primary);
        }
    `]
})
export class MinhaAgendaPage {
    private authService = inject(AuthService);

    constructor() {
        addIcons({
            calendarOutline, personOutline, starOutline,
            locationOutline, briefcaseOutline, timeOutline,
            notificationsOutline, checkmarkCircleOutline
        });
    }

    getPrimeiroNome(): string {
        const nome = this.authService.currentUser()?.nome;
        return nome ? nome.split(' ')[0] : 'Barbeiro';
    }
}
