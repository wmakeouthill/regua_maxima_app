import { Component, inject } from '@angular/core';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonChip, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    cutOutline, calendarOutline, timeOutline,
    starOutline, personOutline, locationOutline,
    ribbonOutline, notificationsOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';

/**
 * Página home com design Barbershop.
 * Exibe serviços, próximos agendamentos e promoções.
 */
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardTitle, IonCardContent, IonCardSubtitle,
        IonIcon, IonButton, IonChip, IonGrid, IonRow, IonCol
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-title>Régua Máxima</ion-title>
                <ion-button slot="end" fill="clear">
                    <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
                </ion-button>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Welcome Section -->
            <div class="welcome-section">
                <div class="welcome-content">
                    <div class="welcome-avatar">
                        <ion-icon name="person-outline"></ion-icon>
                    </div>
                    <div class="welcome-text">
                        <p>Bem-vindo de volta,</p>
                        <h2>{{ getPrimeiroNome() }}</h2>
                    </div>
                </div>
            </div>

            <!-- Stripe decorativo -->
            <div class="barbershop-stripe"></div>

            <!-- Próximo Agendamento -->
            <div class="section-header">
                <h3>Próximo Agendamento</h3>
                <ion-button fill="clear" size="small">Ver todos</ion-button>
            </div>

            <ion-card class="appointment-card">
                <ion-card-content>
                    <div class="appointment-empty">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <p>Nenhum agendamento</p>
                        <ion-button size="small">Agendar agora</ion-button>
                    </div>
                </ion-card-content>
            </ion-card>

            <!-- Serviços -->
            <div class="section-header">
                <h3>Nossos Serviços</h3>
            </div>

            <ion-grid>
                <ion-row>
                    @for (servico of servicos; track servico.id) {
                        <ion-col size="6">
                            <ion-card class="service-card" button>
                                <ion-card-content>
                                    <div class="service-icon">
                                        <ion-icon [name]="servico.icone"></ion-icon>
                                    </div>
                                    <ion-card-subtitle>{{ servico.duracao }}</ion-card-subtitle>
                                    <ion-card-title>{{ servico.nome }}</ion-card-title>
                                    <div class="service-price">R$ {{ servico.preco }}</div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                    }
                </ion-row>
            </ion-grid>

            <!-- Promoção -->
            <div class="section-header">
                <h3>Promoção Especial</h3>
            </div>

            <ion-card class="promo-card">
                <ion-card-content>
                    <div class="promo-content">
                        <div class="promo-icon">
                            <ion-icon name="ribbon-outline"></ion-icon>
                        </div>
                        <div class="promo-text">
                            <h4>Primeira visita</h4>
                            <p>20% de desconto no seu primeiro corte!</p>
                        </div>
                        <ion-chip color="secondary">
                            <ion-icon name="star-outline"></ion-icon>
                            Novo
                        </ion-chip>
                    </div>
                </ion-card-content>
            </ion-card>

            <!-- Localização -->
            <div class="section-header">
                <h3>Nossa Localização</h3>
            </div>

            <ion-card class="location-card">
                <ion-card-content>
                    <div class="location-content">
                        <ion-icon name="location-outline"></ion-icon>
                        <div class="location-text">
                            <p>Rua das Barbearias, 123</p>
                            <small>Centro - São Paulo, SP</small>
                        </div>
                        <ion-button fill="outline" size="small">
                            Como chegar
                        </ion-button>
                    </div>
                </ion-card-content>
            </ion-card>

            <!-- Espaço inferior para tab bar -->
            <div style="height: 24px;"></div>
        </ion-content>
    `,
    styles: [`
        .appointment-card {
            margin: 8px 16px;
        }
        
        .appointment-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 0;
            
            ion-icon {
                font-size: 48px;
                color: var(--ion-color-medium);
                opacity: 0.5;
                margin-bottom: 12px;
            }
            
            p {
                color: var(--ion-color-medium);
                margin: 0 0 16px;
            }
        }
        
        .service-card {
            margin: 8px 0;
            
            ion-card-content {
                padding: 16px;
            }
            
            ion-card-subtitle {
                margin-bottom: 4px;
            }
            
            ion-card-title {
                font-size: 1rem;
                margin-bottom: 8px;
            }
        }
        
        .promo-card {
            margin: 8px 16px;
            background: linear-gradient(135deg, var(--ion-color-secondary) 0%, #8D6E63 100%);
            border: none;
            
            ion-card-content {
                color: #000;
            }
        }
        
        .promo-content {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .promo-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            
            ion-icon {
                font-size: 24px;
                color: #000;
            }
        }
        
        .promo-text {
            flex: 1;
            
            h4 {
                margin: 0 0 4px;
                font-weight: 600;
                font-size: 16px;
            }
            
            p {
                margin: 0;
                font-size: 13px;
                opacity: 0.8;
            }
        }
        
        .promo-card ion-chip {
            --background: rgba(255, 255, 255, 0.9);
            --color: var(--ion-color-primary);
        }
        
        .location-card {
            margin: 8px 16px;
        }
        
        .location-content {
            display: flex;
            align-items: center;
            gap: 12px;
            
            > ion-icon {
                font-size: 32px;
                color: var(--ion-color-primary);
            }
        }
        
        .location-text {
            flex: 1;
            
            p {
                margin: 0;
                font-weight: 500;
                color: var(--ion-color-tertiary);
            }
            
            small {
                color: var(--ion-color-medium);
            }
        }
        
        ion-grid {
            padding: 0 8px;
        }
    `]
})
export class HomePage {
    authService = inject(AuthService);

    servicos = [
        { id: 1, nome: 'Corte Clássico', duracao: '30 min', preco: '45,00', icone: 'cut-outline' },
        { id: 2, nome: 'Barba', duracao: '20 min', preco: '35,00', icone: 'cut-outline' },
        { id: 3, nome: 'Corte + Barba', duracao: '50 min', preco: '70,00', icone: 'cut-outline' },
        { id: 4, nome: 'Degradê', duracao: '40 min', preco: '55,00', icone: 'cut-outline' }
    ];

    constructor() {
        addIcons({
            cutOutline, calendarOutline, timeOutline,
            starOutline, personOutline, locationOutline,
            ribbonOutline, notificationsOutline
        });
    }

    getPrimeiroNome(): string {
        const nome = this.authService.currentUser()?.nome;
        return nome ? nome.split(' ')[0] : 'Cliente';
    }
}
