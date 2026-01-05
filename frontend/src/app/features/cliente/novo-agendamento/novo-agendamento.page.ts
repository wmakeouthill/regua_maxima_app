import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonChip, IonRadio, IonRadioGroup, IonButtons, IonBackButton,
    IonFooter, IonText, IonNote, IonDatetime, IonModal,
    AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline, timeOutline, cutOutline, personOutline,
    checkmarkCircle, chevronForward, locationOutline, cashOutline
} from 'ionicons/icons';

import { AgendamentoService } from '../../../core/services/agendamento.service';
import { AuthService } from '../../../core/auth/auth.service';

interface Servico {
    id: number;
    nome: string;
    preco: number;
    duracaoMinutos: number;
    descricao?: string;
}

interface Barbeiro {
    id: number;
    nome: string;
    especialidades?: string[];
    avaliacao?: number;
}

interface Barbearia {
    id: number;
    nome: string;
    endereco: string;
    telefone?: string;
}

interface HorarioDisponivel {
    horario: string;
    disponivel: boolean;
}

@Component({
    selector: 'app-novo-agendamento',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonList,
        IonItem, IonLabel, IonButton, IonIcon, IonSpinner,
        IonCard, IonCardHeader, IonCardTitle, IonCardContent,
        IonChip, IonButtons, IonBackButton,
        IonFooter, IonText, IonNote, IonDatetime,
        DatePipe, CurrencyPipe
    ],
    template: `
        <ion-header>
            <ion-toolbar color="primary">
                <ion-buttons slot="start">
                    <ion-back-button defaultHref="/tabs/cliente/explorar"></ion-back-button>
                </ion-buttons>
                <ion-title>Novo Agendamento</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <!-- Loading -->
            @if (carregando()) {
                <div class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <p>Carregando...</p>
                </div>
            } @else {
                <!-- Stepper -->
                <div class="stepper">
                    @for (step of steps; track step.id; let i = $index) {
                        <div class="step" [class.active]="etapaAtual() >= step.id" [class.completed]="etapaAtual() > step.id">
                            <div class="step-number">
                                @if (etapaAtual() > step.id) {
                                    <ion-icon name="checkmark-circle"></ion-icon>
                                } @else {
                                    {{ step.id }}
                                }
                            </div>
                            <span class="step-label">{{ step.label }}</span>
                        </div>
                        @if (i < steps.length - 1) {
                            <div class="step-line" [class.active]="etapaAtual() > step.id"></div>
                        }
                    }
                </div>

                <!-- Etapa 1: Escolher Serviço -->
                @if (etapaAtual() === 1) {
                    <div class="etapa-content">
                        <h2>Escolha o Serviço</h2>
                        <p class="subtitle">Selecione o serviço que deseja agendar</p>

                        <ion-list>
                            @for (servico of servicos(); track servico.id) {
                                <ion-item 
                                    [button]="true" 
                                    (click)="selecionarServico(servico)"
                                    [class.selected]="servicoSelecionado()?.id === servico.id">
                                    <ion-icon name="cut-outline" slot="start"></ion-icon>
                                    <ion-label>
                                        <h2>{{ servico.nome }}</h2>
                                        <p>{{ servico.duracaoMinutos }} minutos</p>
                                        @if (servico.descricao) {
                                            <p class="descricao">{{ servico.descricao }}</p>
                                        }
                                    </ion-label>
                                    <ion-note slot="end" color="primary">
                                        {{ servico.preco | currency:'BRL' }}
                                    </ion-note>
                                    @if (servicoSelecionado()?.id === servico.id) {
                                        <ion-icon name="checkmark-circle" color="success" slot="end"></ion-icon>
                                    }
                                </ion-item>
                            } @empty {
                                <ion-item>
                                    <ion-label>Nenhum serviço disponível</ion-label>
                                </ion-item>
                            }
                        </ion-list>
                    </div>
                }

                <!-- Etapa 2: Escolher Barbeiro -->
                @if (etapaAtual() === 2) {
                    <div class="etapa-content">
                        <h2>Escolha o Profissional</h2>
                        <p class="subtitle">Selecione quem irá te atender</p>

                        <ion-list>
                            @for (barbeiro of barbeiros(); track barbeiro.id) {
                                <ion-item 
                                    [button]="true" 
                                    (click)="selecionarBarbeiro(barbeiro)"
                                    [class.selected]="barbeiroSelecionado()?.id === barbeiro.id">
                                    <ion-icon name="person-outline" slot="start"></ion-icon>
                                    <ion-label>
                                        <h2>{{ barbeiro.nome }}</h2>
                                        @if (barbeiro.especialidades && barbeiro.especialidades.length > 0) {
                                            <p>{{ barbeiro.especialidades!.join(', ') }}</p>
                                        }
                                    </ion-label>
                                    @if (barbeiro.avaliacao) {
                                        <ion-note slot="end">⭐ {{ barbeiro.avaliacao | number:'1.1-1' }}</ion-note>
                                    }
                                    @if (barbeiroSelecionado()?.id === barbeiro.id) {
                                        <ion-icon name="checkmark-circle" color="success" slot="end"></ion-icon>
                                    }
                                </ion-item>
                            } @empty {
                                <ion-item>
                                    <ion-label>Nenhum profissional disponível</ion-label>
                                </ion-item>
                            }
                        </ion-list>
                    </div>
                }

                <!-- Etapa 3: Escolher Data e Hora -->
                @if (etapaAtual() === 3) {
                    <div class="etapa-content">
                        <h2>Escolha Data e Horário</h2>
                        <p class="subtitle">Selecione quando deseja ser atendido</p>

                        <!-- Seletor de Data -->
                        <ion-card>
                            <ion-card-header>
                                <ion-card-title>
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    Data
                                </ion-card-title>
                            </ion-card-header>
                            <ion-card-content>
                                <ion-datetime
                                    presentation="date"
                                    [min]="dataMinima"
                                    [max]="dataMaxima"
                                    [(ngModel)]="dataSelecionadaStr"
                                    (ionChange)="onDataChange($event)"
                                    locale="pt-BR"
                                    [firstDayOfWeek]="0">
                                </ion-datetime>
                            </ion-card-content>
                        </ion-card>

                        <!-- Horários disponíveis -->
                        @if (dataSelecionada()) {
                            <ion-card>
                                <ion-card-header>
                                    <ion-card-title>
                                        <ion-icon name="time-outline"></ion-icon>
                                        Horários Disponíveis
                                    </ion-card-title>
                                </ion-card-header>
                                <ion-card-content>
                                    @if (carregandoHorarios()) {
                                        <div class="loading-horarios">
                                            <ion-spinner name="dots"></ion-spinner>
                                            <p>Buscando horários...</p>
                                        </div>
                                    } @else {
                                        <div class="horarios-grid">
                                            @for (horario of horariosDisponiveis(); track horario.horario) {
                                                <ion-chip 
                                                    [disabled]="!horario.disponivel"
                                                    [color]="horarioSelecionado() === horario.horario ? 'primary' : 'medium'"
                                                    (click)="horario.disponivel && selecionarHorario(horario.horario)">
                                                    {{ horario.horario }}
                                                </ion-chip>
                                            } @empty {
                                                <p class="no-horarios">Nenhum horário disponível nesta data</p>
                                            }
                                        </div>
                                    }
                                </ion-card-content>
                            </ion-card>
                        }
                    </div>
                }

                <!-- Etapa 4: Confirmação -->
                @if (etapaAtual() === 4) {
                    <div class="etapa-content">
                        <h2>Confirme seu Agendamento</h2>
                        <p class="subtitle">Revise os detalhes antes de confirmar</p>

                        <ion-card class="resumo-card">
                            <ion-card-content>
                                <div class="resumo-item">
                                    <ion-icon name="location-outline"></ion-icon>
                                    <div>
                                        <strong>{{ barbearia()?.nome }}</strong>
                                        <p>{{ barbearia()?.endereco }}</p>
                                    </div>
                                </div>

                                <div class="resumo-item">
                                    <ion-icon name="cut-outline"></ion-icon>
                                    <div>
                                        <strong>{{ servicoSelecionado()?.nome }}</strong>
                                        <p>{{ servicoSelecionado()?.duracaoMinutos }} minutos</p>
                                    </div>
                                </div>

                                <div class="resumo-item">
                                    <ion-icon name="person-outline"></ion-icon>
                                    <div>
                                        <strong>{{ barbeiroSelecionado()?.nome }}</strong>
                                        <p>Profissional</p>
                                    </div>
                                </div>

                                <div class="resumo-item">
                                    <ion-icon name="calendar-outline"></ion-icon>
                                    <div>
                                        <strong>{{ dataSelecionada() | date:'EEEE, dd MMMM yyyy':'':'pt-BR' }}</strong>
                                        <p>às {{ horarioSelecionado() }}</p>
                                    </div>
                                </div>

                                <div class="resumo-total">
                                    <ion-icon name="cash-outline"></ion-icon>
                                    <div>
                                        <span>Total</span>
                                        <strong>{{ servicoSelecionado()?.preco | currency:'BRL' }}</strong>
                                    </div>
                                </div>
                            </ion-card-content>
                        </ion-card>

                        <ion-text color="medium">
                            <p class="aviso">
                                Você receberá uma confirmação após o agendamento. 
                                Caso precise cancelar, faça com antecedência mínima de 2 horas.
                            </p>
                        </ion-text>
                    </div>
                }
            }
        </ion-content>

        <!-- Footer com botões de navegação -->
        @if (!carregando()) {
            <ion-footer>
                <ion-toolbar>
                    <div class="footer-buttons">
                        @if (etapaAtual() > 1) {
                            <ion-button fill="outline" (click)="voltarEtapa()">
                                Voltar
                            </ion-button>
                        }
                        
                        @if (etapaAtual() < 4) {
                            <ion-button 
                                [disabled]="!podeAvancar()" 
                                (click)="avancarEtapa()">
                                Próximo
                                <ion-icon name="chevron-forward" slot="end"></ion-icon>
                            </ion-button>
                        } @else {
                            <ion-button 
                                color="success" 
                                [disabled]="salvando()"
                                (click)="confirmarAgendamento()">
                                @if (salvando()) {
                                    <ion-spinner name="crescent"></ion-spinner>
                                } @else {
                                    Confirmar Agendamento
                                }
                            </ion-button>
                        }
                    </div>
                </ion-toolbar>
            </ion-footer>
        }
    `,
    styles: [`
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 50vh;
            gap: 16px;
            color: var(--ion-color-medium);
        }

        .stepper {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px 0 24px;
            gap: 8px;
        }

        .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--ion-color-light);
            color: var(--ion-color-medium);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .step.active .step-number {
            background: var(--ion-color-primary);
            color: white;
        }

        .step.completed .step-number {
            background: var(--ion-color-success);
            color: white;
        }

        .step-label {
            font-size: 10px;
            color: var(--ion-color-medium);
            text-align: center;
            max-width: 60px;
        }

        .step.active .step-label {
            color: var(--ion-color-primary);
            font-weight: 600;
        }

        .step-line {
            flex: 1;
            height: 2px;
            background: var(--ion-color-light);
            max-width: 40px;
            margin-bottom: 20px;
        }

        .step-line.active {
            background: var(--ion-color-success);
        }

        .etapa-content {
            padding: 0 8px;
        }

        .etapa-content h2 {
            margin: 0 0 4px;
            font-size: 20px;
            font-weight: 600;
        }

        .etapa-content .subtitle {
            color: var(--ion-color-medium);
            margin: 0 0 16px;
        }

        ion-item.selected {
            --background: var(--ion-color-primary-tint);
        }

        .descricao {
            font-size: 12px;
            color: var(--ion-color-medium);
        }

        ion-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
        }

        ion-card-title ion-icon {
            font-size: 20px;
        }

        ion-datetime {
            width: 100%;
            max-width: 100%;
        }

        .loading-horarios {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px;
            gap: 8px;
            color: var(--ion-color-medium);
        }

        .horarios-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .horarios-grid ion-chip {
            min-width: 70px;
            justify-content: center;
        }

        .no-horarios {
            text-align: center;
            color: var(--ion-color-medium);
            padding: 16px;
        }

        .resumo-card ion-card-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .resumo-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .resumo-item ion-icon {
            font-size: 24px;
            color: var(--ion-color-primary);
            margin-top: 2px;
        }

        .resumo-item strong {
            display: block;
            font-size: 16px;
        }

        .resumo-item p {
            margin: 0;
            color: var(--ion-color-medium);
            font-size: 14px;
        }

        .resumo-total {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid var(--ion-color-light);
        }

        .resumo-total ion-icon {
            font-size: 24px;
            color: var(--ion-color-success);
        }

        .resumo-total div {
            display: flex;
            justify-content: space-between;
            flex: 1;
        }

        .resumo-total strong {
            font-size: 20px;
            color: var(--ion-color-success);
        }

        .aviso {
            font-size: 12px;
            text-align: center;
            padding: 16px;
        }

        ion-footer ion-toolbar {
            padding: 8px 16px;
        }

        .footer-buttons {
            display: flex;
            justify-content: space-between;
            gap: 12px;
        }

        .footer-buttons ion-button {
            flex: 1;
        }

        .footer-buttons ion-button:only-child {
            max-width: none;
        }
    `]
})
export class NovoAgendamentoPage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private agendamentoService = inject(AgendamentoService);
    private alertController = inject(AlertController);
    private toastController = inject(ToastController);

    // Estado
    readonly etapaAtual = signal(1);
    readonly carregando = signal(true);
    readonly salvando = signal(false);
    readonly carregandoHorarios = signal(false);

    // Dados
    readonly barbearia = signal<Barbearia | null>(null);
    readonly servicos = signal<Servico[]>([]);
    readonly barbeiros = signal<Barbeiro[]>([]);
    readonly horariosDisponiveis = signal<HorarioDisponivel[]>([]);

    // Seleções
    readonly servicoSelecionado = signal<Servico | null>(null);
    readonly barbeiroSelecionado = signal<Barbeiro | null>(null);
    readonly dataSelecionada = signal<Date | null>(null);
    readonly horarioSelecionado = signal<string | null>(null);

    dataSelecionadaStr = '';
    dataMinima = new Date().toISOString();
    dataMaxima = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias

    readonly steps = [
        { id: 1, label: 'Serviço' },
        { id: 2, label: 'Profissional' },
        { id: 3, label: 'Data/Hora' },
        { id: 4, label: 'Confirmar' }
    ];

    constructor() {
        addIcons({
            calendarOutline, timeOutline, cutOutline, personOutline,
            checkmarkCircle, chevronForward, locationOutline, cashOutline
        });
    }

    ngOnInit() {
        const barbeariaId = this.route.snapshot.paramMap.get('barbeariaId');
        if (barbeariaId) {
            this.carregarDadosBarbearia(+barbeariaId);
        } else {
            this.router.navigate(['/tabs/cliente/explorar']);
        }
    }

    private async carregarDadosBarbearia(barbeariaId: number) {
        this.carregando.set(true);
        try {
            // TODO: Implementar chamadas reais à API
            // Por enquanto, dados mock para demonstração
            await new Promise(resolve => setTimeout(resolve, 500));

            this.barbearia.set({
                id: barbeariaId,
                nome: 'Barbearia Exemplo',
                endereco: 'Rua Exemplo, 123 - Centro'
            });

            this.servicos.set([
                { id: 1, nome: 'Corte Tradicional', preco: 35, duracaoMinutos: 30, descricao: 'Corte com máquina e tesoura' },
                { id: 2, nome: 'Corte + Barba', preco: 55, duracaoMinutos: 45, descricao: 'Corte completo com barba na navalha' },
                { id: 3, nome: 'Barba', preco: 25, duracaoMinutos: 20, descricao: 'Barba com navalha e toalha quente' },
                { id: 4, nome: 'Corte Degradê', preco: 45, duracaoMinutos: 40, descricao: 'Corte degradê com acabamento' },
                { id: 5, nome: 'Pigmentação', preco: 80, duracaoMinutos: 60, descricao: 'Pigmentação de barba ou cabelo' }
            ]);

            this.barbeiros.set([
                { id: 1, nome: 'Carlos Silva', especialidades: ['Degradê', 'Barba'], avaliacao: 4.8 },
                { id: 2, nome: 'Pedro Santos', especialidades: ['Corte Clássico'], avaliacao: 4.5 },
                { id: 3, nome: 'João Oliveira', especialidades: ['Pigmentação', 'Design'], avaliacao: 4.9 }
            ]);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            const toast = await this.toastController.create({
                message: 'Erro ao carregar dados da barbearia',
                duration: 3000,
                color: 'danger'
            });
            await toast.present();
        } finally {
            this.carregando.set(false);
        }
    }

    selecionarServico(servico: Servico) {
        this.servicoSelecionado.set(servico);
    }

    selecionarBarbeiro(barbeiro: Barbeiro) {
        this.barbeiroSelecionado.set(barbeiro);
        // Limpar seleções de data/hora ao trocar de barbeiro
        this.dataSelecionada.set(null);
        this.horarioSelecionado.set(null);
        this.horariosDisponiveis.set([]);
    }

    onDataChange(event: any) {
        const dataStr = event.detail.value;
        if (dataStr) {
            this.dataSelecionada.set(new Date(dataStr));
            this.horarioSelecionado.set(null);
            this.carregarHorariosDisponiveis();
        }
    }

    private async carregarHorariosDisponiveis() {
        const barbeiro = this.barbeiroSelecionado();
        const data = this.dataSelecionada();
        const servico = this.servicoSelecionado();

        if (!barbeiro || !data || !servico) return;

        this.carregandoHorarios.set(true);
        try {
            // TODO: Chamar API real
            // this.agendamentoService.buscarHorariosDisponiveis(
            //     this.barbearia()!.id, 
            //     barbeiro.id, 
            //     data, 
            //     servico.duracaoMinutos
            // );

            await new Promise(resolve => setTimeout(resolve, 500));

            // Horários mock (8h às 19h com intervalos de 30min)
            const horarios: HorarioDisponivel[] = [];
            const hoje = new Date();
            const dataEscolhida = new Date(data);
            const isHoje = dataEscolhida.toDateString() === hoje.toDateString();

            for (let h = 8; h < 19; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const horario = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                    // Se for hoje, desabilitar horários passados
                    let disponivel = true;
                    if (isHoje) {
                        const [hora, minuto] = horario.split(':').map(Number);
                        const horarioData = new Date(data);
                        horarioData.setHours(hora, minuto, 0, 0);
                        disponivel = horarioData > hoje;
                    }

                    // Simular alguns horários ocupados (aleatório)
                    if (disponivel && Math.random() > 0.7) {
                        disponivel = false;
                    }

                    horarios.push({ horario, disponivel });
                }
            }

            this.horariosDisponiveis.set(horarios);
        } catch (error) {
            console.error('Erro ao carregar horários:', error);
        } finally {
            this.carregandoHorarios.set(false);
        }
    }

    selecionarHorario(horario: string) {
        this.horarioSelecionado.set(horario);
    }

    podeAvancar(): boolean {
        switch (this.etapaAtual()) {
            case 1: return !!this.servicoSelecionado();
            case 2: return !!this.barbeiroSelecionado();
            case 3: return !!this.dataSelecionada() && !!this.horarioSelecionado();
            default: return true;
        }
    }

    avancarEtapa() {
        if (this.podeAvancar() && this.etapaAtual() < 4) {
            this.etapaAtual.update(e => e + 1);
        }
    }

    voltarEtapa() {
        if (this.etapaAtual() > 1) {
            this.etapaAtual.update(e => e - 1);
        }
    }

    async confirmarAgendamento() {
        const servico = this.servicoSelecionado();
        const barbeiro = this.barbeiroSelecionado();
        const data = this.dataSelecionada();
        const horario = this.horarioSelecionado();
        const barbearia = this.barbearia();

        if (!servico || !barbeiro || !data || !horario || !barbearia) {
            return;
        }

        const alert = await this.alertController.create({
            header: 'Confirmar Agendamento',
            message: `Confirmar agendamento de ${servico.nome} com ${barbeiro.nome} para ${this.formatarData(data)} às ${horario}?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Confirmar',
                    handler: () => this.salvarAgendamento()
                }
            ]
        });
        await alert.present();
    }

    private async salvarAgendamento() {
        this.salvando.set(true);
        try {
            const servico = this.servicoSelecionado()!;
            const barbeiro = this.barbeiroSelecionado()!;
            const data = this.dataSelecionada()!;
            const horario = this.horarioSelecionado()!;
            const barbearia = this.barbearia()!;

            // Criar datetime completo
            const [hora, minuto] = horario.split(':').map(Number);
            const dataHora = new Date(data);
            dataHora.setHours(hora, minuto, 0, 0);

            const dto = {
                barbeariaId: barbearia.id,
                barbeiroId: barbeiro.id,
                servicoId: servico.id,
                dataHora: dataHora.toISOString()
            };

            // TODO: Chamar API real
            // await firstValueFrom(this.agendamentoService.criarAgendamento(dto));

            await new Promise(resolve => setTimeout(resolve, 1000));

            const toast = await this.toastController.create({
                message: 'Agendamento realizado com sucesso!',
                duration: 3000,
                color: 'success',
                position: 'top'
            });
            await toast.present();

            // Navegar para lista de agendamentos
            this.router.navigate(['/tabs/cliente/agendamentos']);

        } catch (error: any) {
            console.error('Erro ao criar agendamento:', error);
            const toast = await this.toastController.create({
                message: error?.message || 'Erro ao criar agendamento. Tente novamente.',
                duration: 3000,
                color: 'danger'
            });
            await toast.present();
        } finally {
            this.salvando.set(false);
        }
    }

    private formatarData(data: Date): string {
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }
}
