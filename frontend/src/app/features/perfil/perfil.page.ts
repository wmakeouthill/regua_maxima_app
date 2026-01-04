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
    templateUrl: './perfil.page.html',
    styleUrl: './perfil.page.scss'
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
