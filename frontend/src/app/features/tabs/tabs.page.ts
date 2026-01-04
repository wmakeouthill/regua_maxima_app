import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import {
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    home, homeOutline, person, personOutline, calendar, calendarOutline,
    cut, cutOutline, list, listOutline, wallet, walletOutline,
    statsChart, statsChartOutline, cube, cubeOutline, search, searchOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';

/**
 * Interface para tab dinâmica
 */
interface TabConfig {
    tab: string;
    icon: string;
    label: string;
}

/**
 * Página de tabs com design Barbershop.
 * Navegação inferior dinâmica baseada no tipo de usuário.
 */
@Component({
    selector: 'app-tabs',
    standalone: true,
    imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
    templateUrl: './tabs.page.html',
    styleUrl: './tabs.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsPage {
    private readonly authService = inject(AuthService);

    // Tabs por tipo de usuário
    private readonly tabsAdmin: TabConfig[] = [
        { tab: 'admin/fila', icon: 'list-outline', label: 'Fila' },
        { tab: 'admin/sessao', icon: 'wallet-outline', label: 'Caixa' },
        { tab: 'admin/relatorios', icon: 'stats-chart-outline', label: 'Relatórios' },
        { tab: 'admin/estoque', icon: 'cube-outline', label: 'Estoque' },
        { tab: 'perfil', icon: 'person-outline', label: 'Perfil' }
    ];

    private readonly tabsBarbeiro: TabConfig[] = [
        { tab: 'barbeiro/fila', icon: 'list-outline', label: 'Fila' },
        { tab: 'perfil', icon: 'person-outline', label: 'Perfil' }
    ];

    private readonly tabsCliente: TabConfig[] = [
        { tab: 'cliente/explorar', icon: 'search-outline', label: 'Explorar' },
        { tab: 'home', icon: 'home-outline', label: 'Início' },
        { tab: 'perfil', icon: 'person-outline', label: 'Perfil' }
    ];

    // Computed para tabs visíveis
    readonly tabsVisiveis = computed(() => {
        const tipo = this.authService.getTipoUsuario();
        switch (tipo) {
            case 'ADMIN':
                return this.tabsAdmin;
            case 'BARBEIRO':
                return this.tabsBarbeiro;
            case 'CLIENTE':
            default:
                return this.tabsCliente;
        }
    });

    constructor() {
        addIcons({
            home, homeOutline, person, personOutline, calendar, calendarOutline,
            cut, cutOutline, list, listOutline, wallet, walletOutline,
            statsChart, statsChartOutline, cube, cubeOutline, search, searchOutline
        });
    }
}
