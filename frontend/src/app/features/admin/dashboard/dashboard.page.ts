import { Component, OnInit, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonGrid, IonRow, IonCol, IonBadge,
    IonList, IonItem, IonLabel, IonButtons, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    storefrontOutline, calendarOutline, peopleOutline,
    cashOutline, settingsOutline, colorPaletteOutline,
    cutOutline, statsChartOutline, notificationsOutline,
    starOutline, chevronForwardOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';
import { BarbeariaService } from '../../../core/services/barbearia.service';

/**
 * Dashboard do Admin (Dono de Barbearia).
 * Visão geral de gestão da barbearia.
 */
@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
        IonIcon, IonButton, IonGrid, IonRow, IonCol, IonBadge,
        IonList, IonItem, IonLabel, IonButtons, IonSpinner,
        DecimalPipe
    ],
    template: `
        <ion-header>
            <ion-toolbar color="primary">
                <ion-title>Painel Admin</ion-title>
                <ion-buttons slot="end">
                    <ion-button>
                        <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            @if (carregando()) {
                <div class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <p>Carregando...</p>
                </div>
            } @else if (!possuiBarbearia()) {
                <!-- Estado: Sem Barbearia -->
                <div class="welcome-section">
                    <div class="welcome-content">
                        <h1>Olá, {{ getPrimeiroNome() }}!</h1>
                        <p>Vamos configurar sua barbearia</p>
                    </div>
                </div>

                <ion-card class="info-card">
                    <ion-card-header>
                        <ion-card-subtitle>Primeiro passo</ion-card-subtitle>
                        <ion-card-title>Cadastre sua Barbearia</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <p>Complete o cadastro da sua barbearia para começar a receber agendamentos.</p>
                        <ion-button expand="block" (click)="navegarPara('/tabs/admin/barbearia')">
                            <ion-icon name="storefront-outline" slot="start"></ion-icon>
                            Cadastrar Barbearia
                        </ion-button>
                    </ion-card-content>
                </ion-card>
            } @else {
                <!-- Estado: Com Barbearia -->
                <div class="welcome-section">
                    <div class="welcome-content">
                        <h1>{{ barbearia()?.nome }}</h1>
                        <p>
                            @if (barbearia()?.ativo) {
                                <ion-badge color="success">Ativa</ion-badge>
                            } @else {
                                <ion-badge color="warning">Inativa</ion-badge>
                            }
                            @if ((barbearia()?.avaliacaoMedia ?? 0) > 0) {
                                <span class="rating">
                                    <ion-icon name="star-outline"></ion-icon>
                                    {{ barbearia()?.avaliacaoMedia | number:'1.1-1' }}
                                    ({{ barbearia()?.totalAvaliacoes }})
                                </span>
                            }
                        </p>
                    </div>
                </div>

                <!-- Stats Cards -->
                <ion-grid>
                    <ion-row>
                        <ion-col size="6">
                            <ion-card class="stat-card">
                                <ion-card-content>
                                    <ion-icon name="calendar-outline" color="primary"></ion-icon>
                                    <div class="stat-value">0</div>
                                    <div class="stat-label">Agendamentos Hoje</div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                        <ion-col size="6">
                            <ion-card class="stat-card">
                                <ion-card-content>
                                    <ion-icon name="people-outline" color="secondary"></ion-icon>
                                    <div class="stat-value">0</div>
                                    <div class="stat-label">Barbeiros</div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                        <ion-col size="6">
                            <ion-card class="stat-card">
                                <ion-card-content>
                                    <ion-icon name="cut-outline" color="tertiary"></ion-icon>
                                    <div class="stat-value">{{ totalServicos() }}</div>
                                    <div class="stat-label">Serviços</div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                        <ion-col size="6">
                            <ion-card class="stat-card">
                                <ion-card-content>
                                    <ion-icon name="cash-outline" color="success"></ion-icon>
                                    <div class="stat-value">R$ 0</div>
                                    <div class="stat-label">Faturamento</div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                    </ion-row>
                </ion-grid>

                <!-- Menu de Gestão -->
                <div class="section-header">
                    <h3>Gestão</h3>
                </div>

                <ion-list>
                    <ion-item button detail (click)="navegarPara('/tabs/admin/barbearia')">
                        <ion-icon name="storefront-outline" slot="start" color="primary"></ion-icon>
                        <ion-label>
                            <h2>Minha Barbearia</h2>
                            <p>Dados, endereço e informações</p>
                        </ion-label>
                    </ion-item>

                    <ion-item button detail (click)="navegarPara('/tabs/admin/tema')">
                        <ion-icon name="color-palette-outline" slot="start" color="secondary"></ion-icon>
                        <ion-label>
                            <h2>Personalizar Tema</h2>
                            <p>Cores, logo e banner</p>
                        </ion-label>
                    </ion-item>

                    <ion-item button detail (click)="navegarPara('/tabs/admin/servicos')">
                        <ion-icon name="cut-outline" slot="start" color="tertiary"></ion-icon>
                        <ion-label>
                            <h2>Serviços</h2>
                            <p>Gerenciar serviços oferecidos</p>
                        </ion-label>
                        @if (totalServicos() > 0) {
                            <ion-badge slot="end">{{ totalServicos() }}</ion-badge>
                        }
                    </ion-item>

                    <ion-item button detail (click)="navegarPara('/tabs/admin/barbeiros')">
                        <ion-icon name="people-outline" slot="start" color="warning"></ion-icon>
                        <ion-label>
                            <h2>Barbeiros</h2>
                            <p>Gerenciar equipe</p>
                        </ion-label>
                    </ion-item>

                    <ion-item button detail>
                        <ion-icon name="calendar-outline" slot="start" color="success"></ion-icon>
                        <ion-label>
                            <h2>Agendamentos</h2>
                            <p>Ver todos os agendamentos</p>
                        </ion-label>
                    </ion-item>

                    <ion-item button detail>
                        <ion-icon name="stats-chart-outline" slot="start" color="dark"></ion-icon>
                        <ion-label>
                            <h2>Relatórios</h2>
                            <p>Estatísticas e métricas</p>
                        </ion-label>
                    </ion-item>
                </ion-list>
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
            
            p {
                margin-top: 16px;
                color: var(--ion-color-medium);
            }
        }

        .welcome-section {
            background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
            padding: 24px 16px;
            color: white;
        }

        .welcome-content h1 {
            margin: 0 0 4px;
            font-size: 24px;
            font-weight: 700;
        }

        .welcome-content p {
            margin: 0;
            opacity: 0.9;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .welcome-content .rating {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .stat-card {
            text-align: center;
            margin: 8px 0;
        }

        .stat-card ion-icon {
            font-size: 28px;
            margin-bottom: 8px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--ion-color-dark);
        }

        .stat-label {
            font-size: 12px;
            color: var(--ion-color-medium);
        }

        .section-header {
            padding: 16px 16px 8px;
        }

        .section-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--ion-color-dark);
        }

        ion-list {
            padding: 0 16px;
        }

        ion-item {
            --padding-start: 0;
            margin-bottom: 4px;
        }

        ion-item ion-icon {
            margin-right: 16px;
        }

        .info-card {
            margin: 16px;
            background: linear-gradient(135deg, var(--ion-color-tertiary-tint) 0%, var(--ion-color-tertiary) 100%);
            color: white;
        }

        .info-card ion-card-subtitle {
            color: rgba(255, 255, 255, 0.8);
        }

        .info-card ion-card-title {
            color: white;
        }

        .info-card ion-button {
            margin-top: 12px;
            --background: white;
            --color: var(--ion-color-tertiary);
        }
    `]
})
export class DashboardPage implements OnInit {
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly barbeariaService = inject(BarbeariaService);

    readonly carregando = this.barbeariaService.carregando;
    readonly possuiBarbearia = this.barbeariaService.possuiBarbearia;
    readonly barbearia = this.barbeariaService.minhaBarbearia;
    readonly totalServicos = computed(() => this.barbearia()?.servicos?.length ?? 0);

    constructor() {
        addIcons({
            storefrontOutline, calendarOutline, peopleOutline,
            cashOutline, settingsOutline, colorPaletteOutline,
            cutOutline, statsChartOutline, notificationsOutline,
            starOutline, chevronForwardOutline
        });
    }

    ngOnInit(): void {
        this.carregarDados();
    }

    private carregarDados(): void {
        this.barbeariaService.buscarMinha().subscribe({
            error: (err) => {
                // 404 é esperado se não tiver barbearia
                if (err.status !== 404) {
                    console.error('Erro ao carregar barbearia', err);
                }
            }
        });
    }

    getPrimeiroNome(): string {
        const nome = this.authService.currentUser()?.nome;
        return nome ? nome.split(' ')[0] : 'Admin';
    }

    navegarPara(rota: string): void {
        this.router.navigate([rota]);
    }
}
