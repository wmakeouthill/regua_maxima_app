import { Component, OnInit, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonIcon, IonButton, IonGrid, IonRow, IonCol, IonBadge,
    IonButtons, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';;
import {
    storefrontOutline, calendarOutline, peopleOutline,
    cashOutline, settingsOutline, colorPaletteOutline,
    cutOutline, statsChartOutline, notificationsOutline,
    starOutline, chevronForwardOutline, cubeOutline,
    timeOutline, personOutline, listOutline, walletOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';
import { BarbeariaService } from '../../../core/services/barbearia.service';
import { AtendimentoService } from '../../../core/services/atendimento.service';

/**
 * Interface para módulo do dashboard
 */
interface ModuloDashboard {
    id: string;
    nome: string;
    descricao: string;
    icone: string;
    rota: string;
    cor: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
    badge?: number;
    disponivel: boolean;
}

/**
 * Dashboard do Admin (Dono de Barbearia).
 * Design premium barbershop com módulos em cards.
 */
@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardContent, IonIcon, IonButton, IonGrid, IonRow, IonCol, IonBadge,
        IonButtons, IonSpinner,
        DecimalPipe
    ],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly barbeariaService = inject(BarbeariaService);
    private readonly atendimentoService = inject(AtendimentoService);

    // Estado
    readonly carregando = this.barbeariaService.carregando;
    readonly possuiBarbearia = this.barbeariaService.possuiBarbearia;
    readonly barbearia = this.barbeariaService.minhaBarbearia;

    // Contagem real da fila de atendimento
    readonly pessoasNaFila = this.atendimentoService.totalAguardando;

    // Stats mockados (TODO: integrar com serviços reais)
    readonly stats = signal({
        clientesHoje: 0,
        agendamentosHoje: 0,
        faturamentoHoje: 0,
        barbeirosAtivos: 0
    });

    // Módulos disponíveis
    readonly modulos = computed<ModuloDashboard[]>(() => {
        const temBarbearia = this.possuiBarbearia();
        const filaCount = this.pessoasNaFila();
        return [
            {
                id: 'fila',
                nome: 'Fila de Atendimento',
                descricao: 'Gerenciar clientes na fila',
                icone: 'list-outline',
                rota: '/tabs/admin/fila',
                cor: 'primary',
                badge: filaCount > 0 ? filaCount : undefined, // Só mostra badge se tiver gente na fila
                disponivel: temBarbearia
            },
            {
                id: 'sessao',
                nome: 'Sessão / Caixa',
                descricao: 'Controle financeiro do dia',
                icone: 'wallet-outline',
                rota: '/tabs/admin/sessao',
                cor: 'success',
                disponivel: temBarbearia
            },
            {
                id: 'barbearia',
                nome: 'Minha Barbearia',
                descricao: 'Dados e configurações',
                icone: 'storefront-outline',
                rota: '/tabs/admin/barbearia',
                cor: 'secondary',
                disponivel: true
            },
            {
                id: 'servicos',
                nome: 'Serviços',
                descricao: 'Cortes, barba e preços',
                icone: 'cut-outline',
                rota: '/tabs/admin/servicos',
                cor: 'tertiary',
                disponivel: temBarbearia
            },
            {
                id: 'barbeiros',
                nome: 'Minha Equipe',
                descricao: 'Gerenciar barbeiros',
                icone: 'people-outline',
                rota: '/tabs/admin/barbeiros',
                cor: 'warning',
                // TODO: badge para solicitações pendentes quando implementado
                disponivel: temBarbearia
            },
            {
                id: 'relatorios',
                nome: 'Relatórios',
                descricao: 'Estatísticas e métricas',
                icone: 'stats-chart-outline',
                rota: '/tabs/admin/relatorios',
                cor: 'primary',
                disponivel: temBarbearia
            },
            {
                id: 'estoque',
                nome: 'Estoque',
                descricao: 'Produtos e insumos',
                icone: 'cube-outline',
                rota: '/tabs/admin/estoque',
                cor: 'tertiary',
                disponivel: temBarbearia
            },
            {
                id: 'tema',
                nome: 'Personalizar',
                descricao: 'Cores e aparência',
                icone: 'color-palette-outline',
                rota: '/tabs/admin/tema',
                cor: 'secondary',
                disponivel: temBarbearia
            }
        ];
    });

    constructor() {
        addIcons({
            storefrontOutline, calendarOutline, peopleOutline,
            cashOutline, settingsOutline, colorPaletteOutline,
            cutOutline, statsChartOutline, notificationsOutline,
            starOutline, chevronForwardOutline, cubeOutline,
            timeOutline, personOutline, listOutline, walletOutline
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

        // Carregar contagem real da fila
        this.atendimentoService.buscarMinhaFila().subscribe({
            error: (err) => {
                // Erro esperado se não tiver perfil de barbeiro
                if (err.status !== 404 && err.status !== 403) {
                    console.error('Erro ao carregar fila', err);
                }
            }
        });
    }

    getPrimeiroNome(): string {
        const nome = this.authService.currentUser()?.nome;
        return nome ? nome.split(' ')[0] : 'Admin';
    }

    navegarPara(modulo: ModuloDashboard): void {
        if (!modulo.disponivel) {
            // Se não tem barbearia, redirecionar para cadastro
            this.router.navigate(['/tabs/admin/barbearia']);
            return;
        }
        this.router.navigate([modulo.rota]);
    }

    getHoraSaudacao(): string {
        const hora = new Date().getHours();
        if (hora < 12) return 'Bom dia';
        if (hora < 18) return 'Boa tarde';
        return 'Boa noite';
    }
}
