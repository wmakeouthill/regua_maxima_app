import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonItem, IonLabel, IonIcon, IonButton, IonNote, IonToggle,
    IonBadge, IonActionSheet, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    logOutOutline, personOutline, mailOutline, callOutline,
    settingsOutline, helpCircleOutline, shieldCheckmarkOutline,
    notificationsOutline, starOutline, chevronForwardOutline,
    cardOutline, calendarOutline, storefrontOutline, peopleOutline,
    cutOutline, statsChartOutline, cubeOutline, colorPaletteOutline,
    briefcaseOutline, locationOutline, heartOutline, timeOutline,
    documentTextOutline, walletOutline, linkOutline, swapHorizontalOutline,
    chevronDownOutline
} from 'ionicons/icons';
import { AuthService, TipoUsuario, TIPOS_USUARIO } from '@core/auth/auth.service';

/**
 * Interface para item de menu do perfil
 */
interface MenuItemPerfil {
    id: string;
    icone: string;
    label: string;
    rota?: string;
    badge?: number;
    cor?: string;
    acao?: () => void;
}

/**
 * Página de perfil com design Barbershop Premium.
 * Exibe opções diferentes baseado no tipo de usuário.
 * Suporta troca de role para usuários com múltiplas roles.
 */
@Component({
    selector: 'app-perfil',
    standalone: true,
    imports: [
        FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonList,
        IonItem, IonLabel, IonIcon, IonButton, IonNote, IonToggle,
        IonBadge, IonActionSheet, IonSpinner
    ],
    templateUrl: './perfil.page.html',
    styleUrl: './perfil.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilPage {
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    notificacoesAtivas = true;
    mostrarActionSheet = signal(false);
    trocandoRole = signal(false);

    // Computed para tipo de usuário
    readonly tipoUsuario = computed(() => this.authService.getTipoUsuario());
    readonly isAdmin = computed(() => this.tipoUsuario() === 'ADMIN');
    readonly isBarbeiro = computed(() => this.tipoUsuario() === 'BARBEIRO');
    readonly isCliente = computed(() => this.tipoUsuario() === 'CLIENTE');

    // Multi-role
    readonly possuiMultiplasRoles = this.authService.possuiMultiplasRoles;
    readonly rolesDisponiveis = this.authService.rolesDisponiveis;
    readonly tiposUsuario = TIPOS_USUARIO;

    // Role label formatado
    readonly roleLabel = computed(() => {
        const tipo = this.tipoUsuario();
        switch (tipo) {
            case 'ADMIN': return 'Dono de Barbearia';
            case 'BARBEIRO': return 'Barbeiro';
            case 'CLIENTE': return 'Cliente';
            default: return 'Usuário';
        }
    });

    // Botões do ActionSheet para troca de role
    readonly actionSheetButtons = computed(() => {
        const roles = this.rolesDisponiveis();
        const atual = this.tipoUsuario();

        const buttons = roles
            .filter(r => r !== atual)
            .map(role => ({
                text: this.getLabelRole(role),
                icon: this.getIconeRole(role),
                handler: () => this.trocarParaRole(role)
            }));

        buttons.push({
            text: 'Cancelar',
            icon: '',
            handler: () => this.mostrarActionSheet.set(false)
        });

        return buttons;
    });

    // Menus por tipo de usuário
    readonly menuPrincipal = computed<MenuItemPerfil[]>(() => {
        const tipo = this.tipoUsuario();

        switch (tipo) {
            case 'ADMIN':
                return [
                    { id: 'barbearia', icone: 'storefront-outline', label: 'Minha Barbearia', rota: '/tabs/admin/barbearia', cor: 'secondary' },
                    { id: 'equipe', icone: 'people-outline', label: 'Minha Equipe', rota: '/tabs/admin/barbeiros', badge: 1, cor: 'warning' },
                    { id: 'servicos', icone: 'cut-outline', label: 'Serviços', rota: '/tabs/admin/servicos', cor: 'tertiary' },
                    { id: 'relatorios', icone: 'stats-chart-outline', label: 'Relatórios', rota: '/tabs/admin/relatorios', cor: 'primary' },
                    { id: 'estoque', icone: 'cube-outline', label: 'Estoque', rota: '/tabs/admin/estoque', cor: 'success' },
                    { id: 'tema', icone: 'color-palette-outline', label: 'Personalizar Tema', rota: '/tabs/admin/tema', cor: 'secondary' }
                ];

            case 'BARBEIRO':
                return [
                    { id: 'meu-perfil', icone: 'briefcase-outline', label: 'Meu Perfil Profissional', rota: '/tabs/barbeiro/perfil', cor: 'secondary' },
                    { id: 'agenda', icone: 'calendar-outline', label: 'Minha Agenda', rota: '/tabs/barbeiro/agenda', badge: 5, cor: 'primary' },
                    { id: 'vincular', icone: 'link-outline', label: 'Vincular a Barbearia', rota: '/tabs/barbeiro/vincular', cor: 'tertiary' },
                    { id: 'historico', icone: 'time-outline', label: 'Histórico de Atendimentos', rota: '/tabs/barbeiro/historico', cor: 'success' }
                ];

            case 'CLIENTE':
            default:
                return [
                    { id: 'editar', icone: 'person-outline', label: 'Editar Perfil', rota: '/tabs/cliente/editar-perfil', cor: 'primary' },
                    { id: 'agendamentos', icone: 'calendar-outline', label: 'Meus Agendamentos', rota: '/tabs/cliente/agendamentos', badge: 2, cor: 'secondary' },
                    { id: 'favoritos', icone: 'heart-outline', label: 'Favoritos', rota: '/tabs/cliente/favoritos', cor: 'danger' },
                    { id: 'pagamento', icone: 'card-outline', label: 'Formas de Pagamento', rota: '/tabs/cliente/pagamento', cor: 'success' }
                ];
        }
    });

    readonly menuConfig: MenuItemPerfil[] = [
        { id: 'ajuda', icone: 'help-circle-outline', label: 'Central de Ajuda', rota: '/ajuda' },
        { id: 'privacidade', icone: 'shield-checkmark-outline', label: 'Privacidade e Segurança', rota: '/privacidade' },
        { id: 'config', icone: 'settings-outline', label: 'Configurações', rota: '/configuracoes' }
    ];

    constructor() {
        addIcons({
            logOutOutline, personOutline, mailOutline, callOutline,
            settingsOutline, helpCircleOutline, shieldCheckmarkOutline,
            notificationsOutline, starOutline, chevronForwardOutline,
            cardOutline, calendarOutline, storefrontOutline, peopleOutline,
            cutOutline, statsChartOutline, cubeOutline, colorPaletteOutline,
            briefcaseOutline, locationOutline, heartOutline, timeOutline,
            documentTextOutline, walletOutline, linkOutline, swapHorizontalOutline,
            chevronDownOutline
        });
    }

    getLabelRole(role: TipoUsuario): string {
        const tipo = this.tiposUsuario.find(t => t.valor === role);
        return tipo?.label || role;
    }

    getIconeRole(role: TipoUsuario): string {
        const tipo = this.tiposUsuario.find(t => t.valor === role);
        return tipo?.icone || 'person-outline';
    }

    abrirSeletorRole(): void {
        this.mostrarActionSheet.set(true);
    }

    trocarParaRole(role: TipoUsuario): void {
        this.trocandoRole.set(true);
        this.mostrarActionSheet.set(false);

        this.authService.trocarRole(role).subscribe({
            next: () => {
                this.trocandoRole.set(false);
                // Redireciona para a área correta
                this.redirecionarPorRole(role);
            },
            error: (err) => {
                console.error('Erro ao trocar role:', err);
                this.trocandoRole.set(false);
            }
        });
    }

    private redirecionarPorRole(role: TipoUsuario): void {
        switch (role) {
            case 'ADMIN':
                this.router.navigate(['/tabs/admin/dashboard'], { replaceUrl: true });
                break;
            case 'BARBEIRO':
                this.router.navigate(['/tabs/barbeiro/fila'], { replaceUrl: true });
                break;
            case 'CLIENTE':
            default:
                this.router.navigate(['/tabs/cliente/explorar'], { replaceUrl: true });
                break;
        }
    }

    navegarPara(item: MenuItemPerfil): void {
        if (item.acao) {
            item.acao();
        } else if (item.rota) {
            this.router.navigate([item.rota]);
        }
    }

    async logout(): Promise<void> {
        await this.authService.logout();
        this.router.navigate(['/login']);
    }
}
