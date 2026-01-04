import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent,
    IonIcon, IonSpinner, IonSegment, IonSegmentButton,
    IonLabel, IonList, IonItem, IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    cashOutline, peopleOutline, pricetagOutline, personAddOutline,
    trophyOutline, starOutline, star, personOutline
} from 'ionicons/icons';

/**
 * Tipo de período para filtro
 */
type PeriodoRelatorio = 'hoje' | 'semana' | 'mes' | 'ano';

/**
 * Interface para indicadores principais
 */
interface Indicadores {
    receitaTotal: number;
    totalAtendimentos: number;
    ticketMedio: number;
    novosClientes: number;
}

/**
 * Interface para serviço popular
 */
interface ServicoPopular {
    id: string;
    nome: string;
    quantidade: number;
    receita: number;
}

/**
 * Interface para barbeiro no ranking
 */
interface BarbeiroRanking {
    id: string;
    nome: string;
    fotoUrl?: string;
    atendimentos: number;
    receita: number;
    avaliacaoMedia: number;
}

/**
 * Página de Relatórios do Admin.
 * Dashboard com indicadores de performance.
 */
@Component({
    selector: 'app-relatorios',
    standalone: true,
    imports: [
        DecimalPipe, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardHeader, IonCardTitle, IonCardContent,
        IonIcon, IonSpinner, IonSegment, IonSegmentButton,
        IonLabel, IonList, IonItem, IonAvatar
    ],
    templateUrl: './relatorios.page.html',
    styleUrl: './relatorios.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatoriosPage implements OnInit {
    // Estado
    readonly carregando = signal(false);
    readonly indicadores = signal<Indicadores>({
        receitaTotal: 0,
        totalAtendimentos: 0,
        ticketMedio: 0,
        novosClientes: 0
    });
    readonly servicosPopulares = signal<ServicoPopular[]>([]);
    readonly topBarbeiros = signal<BarbeiroRanking[]>([]);

    // Período selecionado
    periodoSelecionado: PeriodoRelatorio = 'mes';

    constructor() {
        addIcons({
            cashOutline, peopleOutline, pricetagOutline, personAddOutline,
            trophyOutline, starOutline, star, personOutline
        });
    }

    ngOnInit(): void {
        this.carregarRelatorios();
    }

    carregarRelatorios(): void {
        this.carregando.set(true);

        // TODO: Integrar com RelatorioService real baseado no período
        setTimeout(() => {
            const multiplicador = this.getMultiplicadorPeriodo();

            this.indicadores.set({
                receitaTotal: 4850 * multiplicador,
                totalAtendimentos: Math.round(45 * multiplicador),
                ticketMedio: 107.78,
                novosClientes: Math.round(8 * multiplicador)
            });

            this.servicosPopulares.set([
                { id: '1', nome: 'Corte Degradê', quantidade: Math.round(28 * multiplicador), receita: 1260 * multiplicador },
                { id: '2', nome: 'Barba Completa', quantidade: Math.round(22 * multiplicador), receita: 770 * multiplicador },
                { id: '3', nome: 'Corte + Barba', quantidade: Math.round(18 * multiplicador), receita: 1440 * multiplicador },
                { id: '4', nome: 'Corte Navalhado', quantidade: Math.round(12 * multiplicador), receita: 720 * multiplicador },
                { id: '5', nome: 'Relaxamento', quantidade: Math.round(5 * multiplicador), receita: 600 * multiplicador }
            ]);

            this.topBarbeiros.set([
                { id: '1', nome: 'Ricardo Souza', atendimentos: Math.round(18 * multiplicador), receita: 1620 * multiplicador, avaliacaoMedia: 4.9 },
                { id: '2', nome: 'Fernando Lima', atendimentos: Math.round(15 * multiplicador), receita: 1350 * multiplicador, avaliacaoMedia: 4.7 },
                { id: '3', nome: 'Carlos Mendes', atendimentos: Math.round(12 * multiplicador), receita: 1080 * multiplicador, avaliacaoMedia: 4.8 }
            ]);

            this.carregando.set(false);
        }, 500);
    }

    private getMultiplicadorPeriodo(): number {
        const multiplicadores: Record<PeriodoRelatorio, number> = {
            'hoje': 0.1,
            'semana': 0.5,
            'mes': 1,
            'ano': 12
        };
        return multiplicadores[this.periodoSelecionado];
    }
}
