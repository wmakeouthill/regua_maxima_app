import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AvaliacaoService, CriarAvaliacaoDTO } from '../../../core/services/avaliacao.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

// ========================================================
// Régua Máxima - Página de Avaliar Atendimento
// ========================================================

@Component({
    selector: 'app-avaliar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        StarRatingComponent,
    ],
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/cliente/agendamentos"></ion-back-button>
        </ion-buttons>
        <ion-title>Avaliar Atendimento</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (carregando()) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Carregando...</p>
        </div>
      } @else if (jaAvaliado()) {
        <div class="ja-avaliado">
          <ion-icon name="checkmark-circle" color="success"></ion-icon>
          <h2>Você já avaliou este atendimento</h2>
          <p>Obrigado pelo seu feedback!</p>
          <ion-button (click)="voltar()" fill="outline">
            Voltar
          </ion-button>
        </div>
      } @else {
        <!-- Informações do atendimento -->
        <div class="info-atendimento">
          @if (barbeariaNome()) {
            <h2>{{ barbeariaNome() }}</h2>
          }
          @if (barbeiroNome()) {
            <p class="barbeiro-nome">
              <ion-icon name="person-outline"></ion-icon>
              {{ barbeiroNome() }}
            </p>
          }
        </div>

        <!-- Avaliação do atendimento -->
        <div class="avaliacao-section">
          <h3>Como foi seu atendimento?</h3>
          <div class="stars-container">
            <app-star-rating
              [value]="notaAtendimento()"
              [readonly]="false"
              size="large"
              [allowHalf]="false"
              (ratingChange)="onNotaAtendimentoChange($event)"
            ></app-star-rating>
            <p class="nota-descricao">{{ getDescricaoNota(notaAtendimento()) }}</p>
          </div>
        </div>

        <!-- Avaliação do barbeiro (se diferente do atendimento) -->
        @if (barbeiroId()) {
          <div class="avaliacao-section">
            <h3>O que achou do barbeiro?</h3>
            <div class="stars-container">
              <app-star-rating
                [value]="notaBarbeiro()"
                [readonly]="false"
                size="large"
                [allowHalf]="false"
                (ratingChange)="onNotaBarbeiroChange($event)"
              ></app-star-rating>
              <p class="nota-descricao">{{ getDescricaoNota(notaBarbeiro()) }}</p>
            </div>
          </div>
        }

        <!-- Comentário -->
        <div class="comentario-section">
          <h3>Deixe um comentário (opcional)</h3>
          <ion-textarea
            [(ngModel)]="comentario"
            [maxlength]="1000"
            [rows]="4"
            placeholder="Conte como foi sua experiência..."
            [counter]="true"
          ></ion-textarea>
        </div>

        <!-- Avaliação anônima -->
        <ion-item lines="none">
          <ion-checkbox
            slot="start"
            [(ngModel)]="anonima"
          ></ion-checkbox>
          <ion-label>Avaliar anonimamente</ion-label>
        </ion-item>

        <!-- Botão enviar -->
        <ion-button
          expand="block"
          [disabled]="!podeEnviar() || enviando()"
          (click)="enviarAvaliacao()"
          class="btn-enviar"
        >
          @if (enviando()) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            <ion-icon name="send-outline" slot="start"></ion-icon>
            Enviar Avaliação
          }
        </ion-button>
      }
    </ion-content>
  `,
    styles: [`
    .loading-container, .ja-avaliado {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;

      ion-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px;
        color: var(--ion-color-dark);
      }

      p {
        color: var(--ion-color-medium);
      }
    }

    .info-atendimento {
      text-align: center;
      padding: 16px;
      margin-bottom: 24px;
      background: var(--ion-color-light);
      border-radius: 12px;

      h2 {
        margin: 0 0 8px;
        color: var(--ion-color-dark);
        font-size: 1.4em;
      }

      .barbeiro-nome {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--ion-color-medium);
        margin: 0;

        ion-icon {
          font-size: 18px;
        }
      }
    }

    .avaliacao-section {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 12px;
        font-size: 1.1em;
        color: var(--ion-color-dark);
      }

      .stars-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        background: var(--ion-color-light);
        border-radius: 12px;

        app-star-rating {
          margin-bottom: 8px;
        }

        .nota-descricao {
          margin: 0;
          color: var(--ion-color-primary);
          font-weight: 600;
          min-height: 24px;
        }
      }
    }

    .comentario-section {
      margin-bottom: 16px;

      h3 {
        margin: 0 0 8px;
        font-size: 1.1em;
        color: var(--ion-color-dark);
      }

      ion-textarea {
        --background: var(--ion-color-light);
        --padding-start: 12px;
        --padding-end: 12px;
        --padding-top: 12px;
        --padding-bottom: 12px;
        border-radius: 12px;
      }
    }

    ion-item {
      --padding-start: 0;
      margin-bottom: 24px;
    }

    .btn-enviar {
      margin-top: 16px;
      --border-radius: 12px;
      height: 48px;
    }
  `],
})
export class AvaliarPage implements OnInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly toastCtrl = inject(ToastController);
    private readonly alertCtrl = inject(AlertController);
    private readonly avaliacaoService = inject(AvaliacaoService);

    // Route params
    private readonly _agendamentoId = signal<number | null>(null);
    private readonly _barbeariaId = signal<number | null>(null);
    private readonly _barbeiroId = signal<number | null>(null);
    readonly barbeariaNome = signal('');
    readonly barbeiroNome = signal('');

    // State
    readonly carregando = signal(true);
    readonly enviando = signal(false);
    readonly jaAvaliado = signal(false);

    // Form
    readonly notaAtendimento = signal(0);
    readonly notaBarbeiro = signal(0);
    comentario = '';
    anonima = false;

    // Getters
    agendamentoId = () => this._agendamentoId();
    barbeariaId = () => this._barbeariaId();
    barbeiroId = () => this._barbeiroId();

    async ngOnInit(): Promise<void> {
        // Pega parâmetros da rota
        const params = this.route.snapshot.queryParams;

        this._agendamentoId.set(params['agendamentoId'] ? +params['agendamentoId'] : null);
        this._barbeariaId.set(params['barbeariaId'] ? +params['barbeariaId'] : null);
        this._barbeiroId.set(params['barbeiroId'] ? +params['barbeiroId'] : null);
        this.barbeariaNome.set(params['barbeariaNome'] || '');
        this.barbeiroNome.set(params['barbeiroNome'] || '');

        // Verifica se já foi avaliado
        if (this._agendamentoId()) {
            try {
                const avaliado = await this.avaliacaoService.verificarAgendamentoAvaliado(
                    this._agendamentoId()!
                );
                this.jaAvaliado.set(avaliado);
            } catch {
                // Ignora erro, permite avaliar
            }
        }

        this.carregando.set(false);
    }

    podeEnviar(): boolean {
        // Precisa ter nota de atendimento
        if (this.notaAtendimento() === 0) return false;

        // Se tem barbeiro, precisa ter nota do barbeiro
        if (this._barbeiroId() && this.notaBarbeiro() === 0) return false;

        return true;
    }

    onNotaAtendimentoChange(nota: number): void {
        this.notaAtendimento.set(nota);
    }

    onNotaBarbeiroChange(nota: number): void {
        this.notaBarbeiro.set(nota);
    }

    getDescricaoNota(nota: number): string {
        return this.avaliacaoService.getNotaDescricao(nota);
    }

    async enviarAvaliacao(): Promise<void> {
        if (!this.podeEnviar()) return;

        this.enviando.set(true);

        try {
            // Avaliação do atendimento/barbearia
            const dtoAtendimento: CriarAvaliacaoDTO = {
                tipo: this._agendamentoId() ? 'ATENDIMENTO' : 'BARBEARIA',
                barbeariaId: this._barbeariaId() || undefined,
                agendamentoId: this._agendamentoId() || undefined,
                nota: this.notaAtendimento(),
                comentario: this.comentario.trim() || undefined,
                anonima: this.anonima,
            };

            await this.avaliacaoService.criarAvaliacao(dtoAtendimento);

            // Avaliação do barbeiro (se disponível e nota diferente)
            if (this._barbeiroId() && this.notaBarbeiro() > 0) {
                const dtoBarbeiro: CriarAvaliacaoDTO = {
                    tipo: 'BARBEIRO',
                    barbeiroId: this._barbeiroId()!,
                    nota: this.notaBarbeiro(),
                    anonima: this.anonima,
                };

                await this.avaliacaoService.criarAvaliacao(dtoBarbeiro);
            }

            await this.showToast('Avaliação enviada com sucesso!', 'success');

            // Mostra agradecimento
            const alert = await this.alertCtrl.create({
                header: 'Obrigado!',
                message: 'Sua avaliação é muito importante para nós.',
                buttons: [{
                    text: 'OK',
                    handler: () => this.voltar(),
                }],
                backdropDismiss: false,
            });
            await alert.present();
        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            await this.showToast('Erro ao enviar avaliação. Tente novamente.', 'danger');
        } finally {
            this.enviando.set(false);
        }
    }

    voltar(): void {
        this.router.navigate(['/cliente/agendamentos']);
    }

    private async showToast(message: string, color: string): Promise<void> {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2000,
            position: 'bottom',
            color,
        });
        await toast.present();
    }
}
