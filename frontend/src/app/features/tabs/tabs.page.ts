import { Component } from '@angular/core';
import {
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, homeOutline, person, personOutline, calendar, calendarOutline, cut, cutOutline } from 'ionicons/icons';

/**
 * Página de tabs com design Barbershop.
 * Navegação inferior da aplicação.
 */
@Component({
    selector: 'app-tabs',
    standalone: true,
    imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
    template: `
        <ion-tabs>
            <ion-tab-bar slot="bottom">
                <ion-tab-button tab="home">
                    <ion-icon name="home-outline"></ion-icon>
                    <ion-label>Início</ion-label>
                </ion-tab-button>
                
                <ion-tab-button tab="perfil">
                    <ion-icon name="person-outline"></ion-icon>
                    <ion-label>Perfil</ion-label>
                </ion-tab-button>
            </ion-tab-bar>
        </ion-tabs>
    `,
    styles: [`
        ion-tab-bar {
            --background: var(--ion-tab-bar-background);
        }
        
        ion-tab-button {
            --color: var(--ion-color-medium);
            --color-selected: var(--ion-color-secondary);
            --padding-top: 8px;
            --padding-bottom: 8px;
        }
        
        ion-tab-button ion-icon {
            font-size: 24px;
        }
        
        ion-tab-button ion-label {
            font-size: 11px;
            font-weight: 500;
            margin-top: 4px;
        }
    `]
})
export class TabsPage {
    constructor() {
        addIcons({ home, homeOutline, person, personOutline, calendar, calendarOutline, cut, cutOutline });
    }
}
