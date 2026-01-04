import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonItem, IonLabel, IonIcon, IonButton, IonNote, IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    logOutOutline, personOutline, mailOutline, callOutline,
    settingsOutline, helpCircleOutline, shieldCheckmarkOutline,
    notificationsOutline, starOutline, chevronForwardOutline,
    cardOutline, calendarOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';

/**
 * Página de perfil com design Barbershop.
 * Exibe informações do usuário e configurações.
 */
@Component({
    selector: 'app-perfil',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonList,
        IonItem, IonLabel, IonIcon, IonButton, IonNote, IonToggle
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-title>Meu Perfil</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="profile-avatar">
                    <ion-icon name="person-outline"></ion-icon>
                </div>
                <h2>{{ authService.currentUser()?.nome || 'Usuário' }}</h2>
                <p>{{ authService.currentUser()?.email }}</p>
                @if (isPremium) {
                    <div class="premium-badge">
                        <ion-icon name="star-outline"></ion-icon>
                        Cliente Premium
                    </div>
                }
            </div>

            <!-- Stripe decorativo -->
            <div class="barbershop-stripe"></div>

            <!-- Menu Conta -->
            <ion-list class="list-inset">
                <ion-item button detail>
                    <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Editar Perfil</ion-label>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
                </ion-item>
                
                <ion-item button detail>
                    <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Meus Agendamentos</ion-label>
                    <ion-note slot="end">3</ion-note>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
                </ion-item>
                
                <ion-item button detail>
                    <ion-icon name="card-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Formas de Pagamento</ion-label>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
                </ion-item>
            </ion-list>

            <!-- Menu Preferências -->
            <ion-list class="list-inset">
                <ion-item>
                    <ion-icon name="notifications-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Notificações</ion-label>
                    <ion-toggle [checked]="true" slot="end"></ion-toggle>
                </ion-item>
            </ion-list>

            <!-- Menu Suporte -->
            <ion-list class="list-inset">
                <ion-item button detail>
                    <ion-icon name="help-circle-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Central de Ajuda</ion-label>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
                </ion-item>
                
                <ion-item button detail>
                    <ion-icon name="shield-checkmark-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Privacidade e Segurança</ion-label>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
                </ion-item>
                
                <ion-item button detail>
                    <ion-icon name="settings-outline" slot="start" color="primary"></ion-icon>
                    <ion-label>Configurações</ion-label>
                    <ion-icon name="chevron-forward-outline" slot="end" color="medium"></ion-icon>
                </ion-item>
            </ion-list>

            <!-- Botão Sair -->
            <div class="ion-padding">
                <ion-button 
                    expand="block" 
                    fill="outline"
                    color="danger"
                    (click)="logout()"
                >
                    <ion-icon name="log-out-outline" slot="start"></ion-icon>
                    Sair da Conta
                </ion-button>
            </div>

            <!-- Versão -->
            <div class="app-version">
                <p>Régua Máxima v1.0.0</p>
            </div>
        </ion-content>
    `,
    styles: [`
        .profile-header .premium-badge {
            margin-top: 12px;
        }
        
        ion-list.list-inset {
            margin: 16px;
        }
        
        ion-item ion-icon[slot="start"] {
            font-size: 22px;
            margin-right: 12px;
        }
        
        ion-item ion-icon[slot="end"] {
            font-size: 18px;
        }
        
        ion-note {
            background: var(--ion-color-secondary);
            color: #000;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
        }
        
        .app-version {
            text-align: center;
            padding: 16px;
            
            p {
                margin: 0;
                color: var(--ion-color-medium);
                font-size: 12px;
            }
        }
    `]
})
export class PerfilPage {
    authService = inject(AuthService);
    private router = inject(Router);

    isPremium = false; // TODO: Implementar lógica de premium

    constructor() {
        addIcons({
            logOutOutline, personOutline, mailOutline, callOutline,
            settingsOutline, helpCircleOutline, shieldCheckmarkOutline,
            notificationsOutline, starOutline, chevronForwardOutline,
            cardOutline, calendarOutline
        });
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/login']);
    }
}
