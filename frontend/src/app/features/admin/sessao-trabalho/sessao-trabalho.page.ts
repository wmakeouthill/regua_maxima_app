import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonSpinner, IonButtons,
    IonList, IonItem, IonLabel,
    IonModal, IonInput, IonTextarea, IonBadge
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
    walletOutline, playOutline, stopOutline, cashOutline,
    receiptOutline, alertCircleOutline,
    checkmarkCircleOutline, closeCircleOutline,
    pauseOutline
} from 'ionicons/icons';
import { SessaoTrabalhoService, SessaoTrabalho, StatusSessao } from '../../../core/services/sessao-trabalho.service';
import { BarbeariaService } from '../../../core/services/barbearia.service';

/**
 * Página de Sessão de Trabalho do Admin.
 * Gerencia abertura/fechamento/pausa de caixa.
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
        IonModal, IonInput, IonTextarea, IonBadge
    ],
    templateUrl: './sessao-trabalho.page.html',
    styleUrl: './sessao-trabalho.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessaoTrabalhoPage implements OnInit {
    private readonly sessaoService = inject(SessaoTrabalhoService);
    private readonly barbeariaService = inject(BarbeariaService);

    // Estado do serviço (delegado)
    readonly carregando = this.sessaoService.carregando;
    readonly sessaoAtual = this.sessaoService.sessaoAtual;
    readonly historicoSessoes = this.sessaoService.historicoSessoes;
    readonly erro = this.sessaoService.erro;

    // Modais
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

    readonly sessaoAberta = computed(() => this.sessaoAtual()?.status === 'ABERTA');
    readonly sessaoPausada = computed(() => this.sessaoAtual()?.status === 'PAUSADA');
    readonly temSessaoAtiva = computed(() => !!this.sessaoAtual() && this.sessaoAtual()?.status !== 'FECHADA');

    // Barbearia do usuário
    private barbeariaId: number | null = null;

    constructor() {
        addIcons({
            walletOutline, playOutline, stopOutline, cashOutline,
            receiptOutline, alertCircleOutline,
            checkmarkCircleOutline, closeCircleOutline,
            pauseOutline
        });
    }

    ngOnInit(): void {
        this.carregarDados();
    }

    carregarDados(): void {
        // Primeiro buscar a barbearia do usuário
        this.barbeariaService.buscarMinha().subscribe({
            next: (barbearia: { id: number }) => {
                if (barbearia) {
                    this.barbeariaId = barbearia.id;
                    this.sessaoService.carregarDados(barbearia.id);
                }
            },
            error: () => {
                // Usuário não tem barbearia configurada
            }
        });
    }

    // ========== Modal Abertura ==========

    abrirModalAbertura(): void {
        this.valorAbertura = 0;
        this.observacoesAbertura = '';
        this.mostrarModalAbertura.set(true);
    }

    fecharModalAbertura(): void {
        this.mostrarModalAbertura.set(false);
    }

    confirmarAbertura(): void {
        if (this.valorAbertura === null || this.valorAbertura < 0) return;
        if (!this.barbeariaId) return;

        this.sessaoService.abrirSessao({
            barbeariaId: this.barbeariaId,
            valorAbertura: this.valorAbertura,
            observacoes: this.observacoesAbertura || undefined
        }).subscribe({
            next: () => {
                this.fecharModalAbertura();
            },
            error: (err) => {
                console.error('Erro ao abrir sessão:', err);
            }
        });
    }

    // ========== Modal Fechamento ==========

    abrirModalFechamento(): void {
        this.valorFechamento = null;
        this.observacoesFechamento = '';
        this.mostrarModalFechamento.set(true);
    }

    fecharModalFechamento(): void {
        this.mostrarModalFechamento.set(false);
    }

    confirmarFechamento(): void {
        if (this.valorFechamento === null || this.valorFechamento < 0) return;
        if (!this.barbeariaId) return;

        this.sessaoService.fecharSessao(this.barbeariaId, {
            valorFechamento: this.valorFechamento,
            observacoes: this.observacoesFechamento || undefined
        }).subscribe({
            next: () => {
                this.fecharModalFechamento();
            },
            error: (err) => {
                console.error('Erro ao fechar sessão:', err);
            }
        });
    }

    // ========== Pausar / Retomar ==========

    pausarSessao(): void {
        if (!this.barbeariaId) return;

        this.sessaoService.pausarSessao(this.barbeariaId).subscribe({
            error: (err) => {
                console.error('Erro ao pausar sessão:', err);
            }
        });
    }

    retomarSessao(): void {
        if (!this.barbeariaId) return;

        this.sessaoService.retomarSessao(this.barbeariaId).subscribe({
            error: (err) => {
                console.error('Erro ao retomar sessão:', err);
            }
        });
    }

    // ========== Helpers ==========

    getStatusLabel(status: StatusSessao): string {
        switch (status) {
            case 'ABERTA': return 'Aberto';
            case 'PAUSADA': return 'Pausado';
            case 'FECHADA': return 'Fechado';
            default: return status;
        }
    }

    getStatusColor(status: StatusSessao): string {
        switch (status) {
            case 'ABERTA': return 'success';
            case 'PAUSADA': return 'warning';
            case 'FECHADA': return 'medium';
            default: return 'medium';
        }
    }
}
