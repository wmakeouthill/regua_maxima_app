import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonSpinner, IonButtons,
    IonList, IonItem, IonLabel,
    IonModal, IonInput, IonTextarea
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
    walletOutline, playOutline, stopOutline, cashOutline,
    receiptOutline, alertCircleOutline,
    checkmarkCircleOutline, closeCircleOutline
} from 'ionicons/icons';

/**
 * Status da sessão de trabalho
 */
type StatusSessao = 'ABERTA' | 'FECHADA';

/**
 * Interface para sessão de trabalho
 */
interface SessaoTrabalho {
    id: string;
    usuarioId: string;
    usuarioNome: string;
    dataAbertura: Date;
    dataFechamento?: Date;
    valorAbertura: number;
    valorFechamento?: number;
    valorTotalVendas: number;
    quantidadeAtendimentos: number;
    status: StatusSessao;
    observacoes?: string;
}

/**
 * Página de Sessão de Trabalho do Admin.
 * Gerencia abertura/fechamento de caixa.
 */
@Component({
    selector: 'app-sessao-trabalho',
    standalone: true,
    imports: [
        DatePipe, DecimalPipe, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
        IonIcon, IonButton, IonSpinner, IonButtons,
        IonList, IonItem, IonLabel,
        IonModal, IonInput, IonTextarea
    ],
    templateUrl: './sessao-trabalho.page.html',
    styleUrl: './sessao-trabalho.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessaoTrabalhoPage implements OnInit {
    // Estado
    readonly carregando = signal(false);
    readonly sessaoAtual = signal<SessaoTrabalho | null>(null);
    readonly historicoSessoes = signal<SessaoTrabalho[]>([]);
    readonly mostrarModalAbertura = signal(false);
    readonly mostrarModalFechamento = signal(false);

    // Formulários
    valorAbertura: number | null = 0;
    observacoesAbertura = '';
    valorFechamento: number | null = null;
    observacoesFechamento = '';

    // Computed
    readonly valorEsperado = computed(() => {
        const sessao = this.sessaoAtual();
        if (!sessao) return 0;
        return sessao.valorAbertura + sessao.valorTotalVendas;
    });

    readonly diferencaCaixa = computed(() => {
        if (this.valorFechamento === null) return 0;
        return this.valorFechamento - this.valorEsperado();
    });

    constructor() {
        addIcons({
            walletOutline, playOutline, stopOutline, cashOutline,
            receiptOutline, alertCircleOutline,
            checkmarkCircleOutline, closeCircleOutline
        });
    }

    ngOnInit(): void {
        this.carregarDados();
    }

    carregarDados(): void {
        this.carregando.set(true);

        // TODO: Integrar com SessaoService real
        setTimeout(() => {
            this.sessaoAtual.set({
                id: '1',
                usuarioId: 'u1',
                usuarioNome: 'Admin',
                dataAbertura: new Date(Date.now() - 4 * 60 * 60000),
                valorAbertura: 200,
                valorTotalVendas: 485,
                quantidadeAtendimentos: 12,
                status: 'ABERTA'
            });

            this.historicoSessoes.set([
                {
                    id: '2',
                    usuarioId: 'u1',
                    usuarioNome: 'Admin',
                    dataAbertura: new Date(Date.now() - 24 * 60 * 60000),
                    dataFechamento: new Date(Date.now() - 16 * 60 * 60000),
                    valorAbertura: 150,
                    valorFechamento: 720,
                    valorTotalVendas: 570,
                    quantidadeAtendimentos: 15,
                    status: 'FECHADA'
                },
                {
                    id: '3',
                    usuarioId: 'u1',
                    usuarioNome: 'Admin',
                    dataAbertura: new Date(Date.now() - 48 * 60 * 60000),
                    dataFechamento: new Date(Date.now() - 40 * 60 * 60000),
                    valorAbertura: 100,
                    valorFechamento: 410,
                    valorTotalVendas: 310,
                    quantidadeAtendimentos: 8,
                    status: 'FECHADA'
                }
            ]);

            this.carregando.set(false);
        }, 500);
    }

    abrirModalAbertura(): void {
        this.valorAbertura = 0;
        this.observacoesAbertura = '';
        this.mostrarModalAbertura.set(true);
    }

    fecharModalAbertura(): void {
        this.mostrarModalAbertura.set(false);
    }

    abrirModalFechamento(): void {
        this.valorFechamento = null;
        this.observacoesFechamento = '';
        this.mostrarModalFechamento.set(true);
    }

    fecharModalFechamento(): void {
        this.mostrarModalFechamento.set(false);
    }

    confirmarAbertura(): void {
        if (this.valorAbertura === null || this.valorAbertura < 0) return;

        // TODO: Chamar serviço para abrir caixa
        console.log('Abrindo caixa com valor:', this.valorAbertura);

        const novaSessao: SessaoTrabalho = {
            id: Date.now().toString(),
            usuarioId: 'u1',
            usuarioNome: 'Admin',
            dataAbertura: new Date(),
            valorAbertura: this.valorAbertura,
            valorTotalVendas: 0,
            quantidadeAtendimentos: 0,
            status: 'ABERTA',
            observacoes: this.observacoesAbertura
        };

        this.sessaoAtual.set(novaSessao);
        this.fecharModalAbertura();
    }

    confirmarFechamento(): void {
        if (this.valorFechamento === null || this.valorFechamento < 0) return;
        if (!this.sessaoAtual()) return;

        // TODO: Chamar serviço para fechar caixa
        console.log('Fechando caixa com valor:', this.valorFechamento);

        const sessaoFechada: SessaoTrabalho = {
            ...this.sessaoAtual()!,
            dataFechamento: new Date(),
            valorFechamento: this.valorFechamento,
            status: 'FECHADA',
            observacoes: this.observacoesFechamento
        };

        this.historicoSessoes.update(lista => [sessaoFechada, ...lista]);
        this.sessaoAtual.set(null);
        this.fecharModalFechamento();
    }
}
