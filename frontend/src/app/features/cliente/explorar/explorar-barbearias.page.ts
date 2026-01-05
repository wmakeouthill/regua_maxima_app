import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonIcon, IonButton, IonBadge, IonRefresher,
    IonRefresherContent, IonButtons, IonChip, IonSearchbar,
    IonSegment, IonSegmentButton, IonLabel, IonSkeletonText
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
    locationOutline, starOutline, heartOutline, heart,
    mapOutline, listOutline, navigateOutline, storefrontOutline,
    chevronForwardOutline, notificationsOutline, peopleOutline,
    cutOutline, timeOutline
} from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { BarbeariaService } from '@core/services/barbearia.service';
import { FavoritoService } from '@core/services/favorito.service';
import { BarbeariaResumo } from '@core/models/barbearia.model';

/**
 * Card de barbearia para exibição na lista.
 * Estende BarbeariaResumo com campos adicionais para UI.
 */
interface BarbeariaCard extends BarbeariaResumo {
    distanciaKm?: number;
    favorito: boolean;
}

/**
 * Tipo de visualização
 */
type TipoVisualizacao = 'lista' | 'mapa';

/**
 * Página principal do Cliente.
 * Lista de BARBEARIAS próximas com busca e filtros.
 * Conecta com dados reais do backend via BarbeariaService.
 */
@Component({
    selector: 'app-explorar-barbearias',
    standalone: true,
    imports: [
        DecimalPipe, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardContent, IonIcon, IonButton, IonBadge, IonRefresher,
        IonRefresherContent, IonButtons, IonChip, IonSearchbar,
        IonSegment, IonSegmentButton, IonLabel, IonSkeletonText
    ],
    templateUrl: './explorar-barbearias.page.html',
    styleUrl: './explorar-barbearias.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExplorarBarbeariasPage implements OnInit {
    private readonly barbeariaService = inject(BarbeariaService);
    private readonly favoritoService = inject(FavoritoService);
    private readonly router = inject(Router);

    // Estado
    readonly carregando = signal(false);
    readonly barbearias = signal<BarbeariaCard[]>([]);
    readonly localizacaoAtual = signal('Detectando localização...');
    readonly erroLocalizacao = signal<string | null>(null);

    termoBusca = '';
    tipoVisualizacao: TipoVisualizacao = 'lista';

    // Coordenadas atuais
    private latitudeAtual = -23.5505; // Fallback: São Paulo Centro
    private longitudeAtual = -46.6333;
    private raioKm = 15;

    // Computed
    readonly barbeariasFiltradas = computed(() => {
        const termo = this.termoBusca.toLowerCase();
        if (!termo) return this.barbearias();
        return this.barbearias().filter(b =>
            b.nome.toLowerCase().includes(termo) ||
            (b.endereco && b.endereco.toLowerCase().includes(termo)) ||
            (b.cidade && b.cidade.toLowerCase().includes(termo))
        );
    });

    constructor() {
        addIcons({
            locationOutline, starOutline, heartOutline, heart,
            mapOutline, listOutline, navigateOutline, storefrontOutline,
            chevronForwardOutline, notificationsOutline, peopleOutline,
            cutOutline, timeOutline
        });
    }

    async ngOnInit(): Promise<void> {
        // Carrega IDs dos favoritos para marcar corações
        this.favoritoService.carregarIdsFavoritos().subscribe();

        await this.obterLocalizacaoReal();
        this.carregarBarbearias();
    }

    /**
     * Obtém localização real do dispositivo via Capacitor Geolocation.
     * Fallback para São Paulo Centro se não conseguir.
     */
    private async obterLocalizacaoReal(): Promise<void> {
        try {
            // Verifica permissão primeiro
            const permissao = await Geolocation.checkPermissions();

            if (permissao.location === 'denied') {
                // Solicita permissão
                const novaPermissao = await Geolocation.requestPermissions();
                if (novaPermissao.location === 'denied') {
                    this.erroLocalizacao.set('Permissão de localização negada');
                    this.localizacaoAtual.set('Localização manual necessária');
                    return;
                }
            }

            // Obtém posição atual
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000
            });

            this.latitudeAtual = position.coords.latitude;
            this.longitudeAtual = position.coords.longitude;
            this.localizacaoAtual.set('Sua localização');
            this.erroLocalizacao.set(null);

        } catch (error) {
            console.warn('Erro ao obter localização:', error);
            // Fallback para São Paulo Centro
            this.latitudeAtual = -23.5505;
            this.longitudeAtual = -46.6333;
            this.erroLocalizacao.set('Não foi possível obter sua localização');
            this.localizacaoAtual.set('São Paulo - SP (padrão)');
        }
    }

    /**
     * Carrega barbearias próximas do backend.
     */
    carregarBarbearias(): void {
        this.carregando.set(true);

        this.barbeariaService.buscarProximas(this.latitudeAtual, this.longitudeAtual, this.raioKm)
            .subscribe({
                next: (barbearias) => {
                    // Converte para BarbeariaCard adicionando campos de UI
                    const cards: BarbeariaCard[] = barbearias.map(b => ({
                        ...b,
                        distanciaKm: this.calcularDistancia(
                            this.latitudeAtual, this.longitudeAtual,
                            b.latitude ?? 0, b.longitude ?? 0
                        ),
                        favorito: this.favoritoService.isBarbeariaFavorita(b.id)
                    }));

                    // Ordena por distância
                    cards.sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));

                    this.barbearias.set(cards);
                    this.carregando.set(false);
                },
                error: (error) => {
                    console.error('Erro ao carregar barbearias:', error);
                    this.barbearias.set([]);
                    this.carregando.set(false);
                }
            });
    }

    /**
     * Calcula distância entre dois pontos usando fórmula de Haversine.
     */
    private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
        if (!lat2 || !lon2) return 0;

        const R = 6371; // Raio da Terra em km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Pull-to-refresh handler.
     */
    handleRefresh(event: CustomEvent): void {
        this.carregarBarbearias();
        // Completa o refresher após um delay para melhor UX
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 500);
    }

    /**
     * Handler de busca (filtragem local via computed).
     */
    buscar(): void {
        // O computed barbeariasFiltradas faz a filtragem automaticamente
    }

    /**
     * Altera entre visualização lista/mapa.
     */
    alterarVisualizacao(): void {
        // Mapa será implementado posteriormente
        if (this.tipoVisualizacao === 'mapa') {
            console.log('Visualização de mapa ainda não implementada');
        }
    }

    /**
     * Toggle favorito de uma barbearia.
     */
    toggleFavorito(barbearia: BarbeariaCard, event: Event): void {
        event.stopPropagation();

        // Atualiza UI imediatamente (optimistic update)
        this.barbearias.update(lista =>
            lista.map(b => b.id === barbearia.id
                ? { ...b, favorito: !b.favorito }
                : b
            )
        );

        // Persiste no backend
        this.favoritoService.toggleBarbeariaFavorita(barbearia.id).subscribe({
            error: () => {
                // Reverte em caso de erro
                this.barbearias.update(lista =>
                    lista.map(b => b.id === barbearia.id
                        ? { ...b, favorito: barbearia.favorito }
                        : b
                    )
                );
            }
        });
    }

    /**
     * Abre detalhes da barbearia.
     */
    abrirBarbearia(barbearia: BarbeariaCard): void {
        this.router.navigate(['/barbearia', barbearia.slug]);
    }

    /**
     * Permite alterar localização manualmente.
     */
    async alterarLocalizacao(): Promise<void> {
        // TODO: Implementar modal de seleção de cidade/endereço
        console.log('Alterar localização - a implementar');
    }
}
