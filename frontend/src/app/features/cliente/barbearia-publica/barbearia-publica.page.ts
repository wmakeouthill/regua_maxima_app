import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonIcon, IonButton, IonCard, IonCardContent, IonChip,
    IonList, IonSkeletonText, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    locationOutline, callOutline, logoWhatsapp, logoInstagram,
    mailOutline, heartOutline, heart, starOutline, star,
    timeOutline, cutOutline, peopleOutline, calendarOutline,
    chevronForwardOutline, shareOutline, chatbubblesOutline,
    personOutline
} from 'ionicons/icons';
import { BarbeariaService } from '@core/services/barbearia.service';
import { FavoritoService } from '@core/services/favorito.service';
import { AvaliacaoService, AvaliacaoDTO, ResumoAvaliacoesDTO } from '@core/services/avaliacao.service';
import { Barbearia, Servico, BarbeariaTema } from '@core/models/barbearia.model';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

/**
 * Página pública de uma barbearia.
 * Exibe informações, serviços e permite agendamento.
 * Aplica tema dinâmico da barbearia.
 */
@Component({
    selector: 'app-barbearia-publica',
    standalone: true,
    imports: [
        CommonModule, CurrencyPipe,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
        IonBackButton, IonIcon, IonButton, IonCard, IonCardContent, IonChip,
        IonList, IonSkeletonText, IonRefresher, IonRefresherContent, StarRatingComponent
    ],
    templateUrl: './barbearia-publica.page.html',
    styleUrl: './barbearia-publica.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarbeariaPublicaPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly barbeariaService = inject(BarbeariaService);
    private readonly favoritoService = inject(FavoritoService);
    private readonly avaliacaoService = inject(AvaliacaoService);

    // Estado
    readonly carregando = signal(true);
    readonly barbearia = signal<Barbearia | null>(null);
    readonly erro = signal<string | null>(null);
    readonly ultimasAvaliacoes = signal<AvaliacaoDTO[]>([]);
    readonly resumoAvaliacoes = signal<ResumoAvaliacoesDTO | null>(null);

    // Computed
    readonly tema = computed<BarbeariaTema | null>(() => {
        const barbearia = this.barbearia();
        if (barbearia?.temaConfig) {
            try {
                return JSON.parse(barbearia.temaConfig);
            } catch {
                return null;
            }
        }
        return null;
    });

    readonly isFavorita = computed(() => {
        const barbearia = this.barbearia();
        if (!barbearia) return false;
        return this.favoritoService.isBarbeariaFavorita(barbearia.id);
    });

    readonly enderecoCompleto = computed(() => {
        const b = this.barbearia();
        if (!b) return '';
        const partes = [b.endereco, b.cidade, b.estado].filter(Boolean);
        return partes.join(', ');
    });

    readonly servicosAtivos = computed(() => {
        const b = this.barbearia();
        return b?.servicos ?? [];
    });

    constructor() {
        addIcons({
            locationOutline, callOutline, logoWhatsapp, logoInstagram,
            mailOutline, heartOutline, heart, starOutline, star,
            timeOutline, cutOutline, peopleOutline, calendarOutline,
            chevronForwardOutline, shareOutline, chatbubblesOutline,
            personOutline
        });
    }

    ngOnInit(): void {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
            this.carregarBarbearia(slug);
        } else {
            this.erro.set('Barbearia não encontrada');
            this.carregando.set(false);
        }

        // Carrega favoritos
        this.favoritoService.carregarIdsFavoritos().subscribe();
    }

    /**
     * Carrega dados da barbearia pelo slug.
     */
    carregarBarbearia(slug: string): void {
        this.carregando.set(true);
        this.erro.set(null);

        this.barbeariaService.buscarPorSlug(slug).subscribe({
            next: (barbearia) => {
                this.barbearia.set(barbearia);
                this.carregando.set(false);
                this.aplicarTema();
                this.carregarAvaliacoes(barbearia.id);
            },
            error: (error) => {
                console.error('Erro ao carregar barbearia:', error);
                this.erro.set('Não foi possível carregar a barbearia');
                this.carregando.set(false);
            }
        });
    }

    /**
     * Carrega avaliações da barbearia.
     */
    private async carregarAvaliacoes(barbeariaId: number): Promise<void> {
        try {
            const [resumo, ultimas] = await Promise.all([
                this.avaliacaoService.obterResumoBarbearia(barbeariaId),
                this.avaliacaoService.listarUltimasAvaliacoesBarbearia(barbeariaId)
            ]);
            this.resumoAvaliacoes.set(resumo);
            this.ultimasAvaliacoes.set(ultimas);
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        }
    }

    /**
     * Aplica tema dinâmico da barbearia nas cores da página.
     */
    private aplicarTema(): void {
        const tema = this.tema();
        if (!tema) return;

        const root = document.documentElement;
        if (tema.corPrimaria) {
            root.style.setProperty('--barbearia-cor-primaria', tema.corPrimaria);
        }
        if (tema.corSecundaria) {
            root.style.setProperty('--barbearia-cor-secundaria', tema.corSecundaria);
        }
        if (tema.corTexto) {
            root.style.setProperty('--barbearia-cor-texto', tema.corTexto);
        }
        if (tema.corFundo) {
            root.style.setProperty('--barbearia-cor-fundo', tema.corFundo);
        }
    }

    /**
     * Pull-to-refresh.
     */
    handleRefresh(event: CustomEvent): void {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
            this.carregarBarbearia(slug);
        }
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 500);
    }

    /**
     * Toggle favorito.
     */
    toggleFavorito(): void {
        const barbearia = this.barbearia();
        if (!barbearia) return;

        this.favoritoService.toggleBarbeariaFavorita(barbearia.id).subscribe();
    }

    /**
     * Navega para agendamento com serviço selecionado.
     */
    agendarServico(servico: Servico): void {
        const barbearia = this.barbearia();
        if (!barbearia) return;

        this.router.navigate(['/cliente/novo-agendamento'], {
            queryParams: {
                barbeariaId: barbearia.id,
                servicoId: servico.id
            }
        });
    }

    /**
     * Navega para agendamento geral.
     */
    agendar(): void {
        const barbearia = this.barbearia();
        if (!barbearia) return;

        this.router.navigate(['/cliente/novo-agendamento'], {
            queryParams: {
                barbeariaId: barbearia.id
            }
        });
    }

    /**
     * Abre WhatsApp.
     */
    abrirWhatsApp(): void {
        const barbearia = this.barbearia();
        if (!barbearia?.whatsapp) return;

        const numero = barbearia.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/55${numero}`, '_blank');
    }

    /**
     * Abre telefone.
     */
    ligar(): void {
        const barbearia = this.barbearia();
        if (!barbearia?.telefone) return;

        window.open(`tel:${barbearia.telefone}`, '_blank');
    }

    /**
     * Abre Instagram.
     */
    abrirInstagram(): void {
        const barbearia = this.barbearia();
        if (!barbearia?.instagram) return;

        let instagram = barbearia.instagram;
        if (!instagram.startsWith('http')) {
            instagram = `https://instagram.com/${instagram.replace('@', '')}`;
        }
        window.open(instagram, '_blank');
    }

    /**
     * Compartilha barbearia.
     */
    async compartilhar(): Promise<void> {
        const barbearia = this.barbearia();
        if (!barbearia) return;

        if (navigator.share) {
            await navigator.share({
                title: barbearia.nome,
                text: `Confira a ${barbearia.nome}!`,
                url: window.location.href
            });
        }
    }

    /**
     * Abre página de todas as avaliações.
     */
    verTodasAvaliacoes(): void {
        const barbearia = this.barbearia();
        if (!barbearia) return;

        this.router.navigate(['/barbearia', barbearia.slug, 'avaliacoes'], {
            queryParams: { id: barbearia.id }
        });
    }

    /**
     * Formata data relativa.
     */
    formatarData(data: string): string {
        return this.avaliacaoService.formatarDataRelativa(data);
    }
}
