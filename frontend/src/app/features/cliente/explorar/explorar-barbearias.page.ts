import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
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
    chevronForwardOutline, notificationsOutline, personOutline
} from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { BarbeiroService } from '@core/services/barbeiro.service';
import { BarbeiroResumo } from '@core/models/barbeiro.model';

/**
 * Card de barbeiro para exibição na lista.
 * Adaptado do BarbeiroResumo com campos adicionais para UI.
 */
interface BarbeiroCard extends BarbeiroResumo {
    distanciaKm?: number;
    favorito: boolean;
}

/**
 * Tipo de visualização
 */
type TipoVisualizacao = 'lista' | 'mapa';

/**
 * Página principal do Cliente.
 * Lista de barbeiros próximos com busca e filtros.
 * Conecta com dados reais do backend via BarbeiroService.
 */
@Component({
    selector: 'app-explorar-barbearias',
    standalone: true,
    imports: [
        DecimalPipe, SlicePipe, FormsModule,
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
    private readonly barbeiroService = inject(BarbeiroService);

    // Estado
    readonly carregando = signal(false);
    readonly barbeiros = signal<BarbeiroCard[]>([]);
    readonly localizacaoAtual = signal('Detectando localização...');
    readonly erroLocalizacao = signal<string | null>(null);

    termoBusca = '';
    tipoVisualizacao: TipoVisualizacao = 'lista';

    // Coordenadas atuais
    private latitudeAtual = -23.5505; // Fallback: São Paulo Centro
    private longitudeAtual = -46.6333;
    private raioKm = 10;

    // Computed
    readonly barbeirosFiltrados = computed(() => {
        const termo = this.termoBusca.toLowerCase();
        if (!termo) return this.barbeiros();
        return this.barbeiros().filter(b =>
            b.nome.toLowerCase().includes(termo) ||
            (b.especialidades && b.especialidades.toLowerCase().includes(termo)) ||
            (b.barbeariaNome && b.barbeariaNome.toLowerCase().includes(termo))
        );
    });

    constructor() {
        addIcons({
            locationOutline, starOutline, heartOutline, heart,
            mapOutline, listOutline, navigateOutline, storefrontOutline,
            chevronForwardOutline, notificationsOutline, personOutline
        });
    }

    async ngOnInit(): Promise<void> {
        await this.obterLocalizacaoReal();
        this.carregarBarbeiros();
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
     * Carrega barbeiros próximos do backend.
     */
    carregarBarbeiros(): void {
        this.carregando.set(true);

        this.barbeiroService.buscarProximos(this.latitudeAtual, this.longitudeAtual, this.raioKm)
            .subscribe({
                next: (barbeiros) => {
                    // Converte para BarbeiroCard adicionando campos de UI
                    const cards: BarbeiroCard[] = barbeiros.map(b => ({
                        ...b,
                        distanciaKm: this.calcularDistancia(
                            this.latitudeAtual, this.longitudeAtual,
                            b.latitude, b.longitude
                        ),
                        favorito: false // TODO: Integrar com FavoritosService
                    }));

                    // Ordena por distância
                    cards.sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));

                    this.barbeiros.set(cards);
                    this.carregando.set(false);
                },
                error: (error) => {
                    console.error('Erro ao carregar barbeiros:', error);
                    this.barbeiros.set([]);
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
        this.carregarBarbeiros();
        // Completa o refresher após um delay para melhor UX
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 500);
    }

    /**
     * Handler de busca (filtragem local via computed).
     */
    buscar(): void {
        // O computed barbeirosFiltrados faz a filtragem automaticamente
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
     * Toggle favorito de um barbeiro.
     */
    toggleFavorito(barbeiro: BarbeiroCard, event: Event): void {
        event.stopPropagation();
        this.barbeiros.update(lista =>
            lista.map(b => b.id === barbeiro.id
                ? { ...b, favorito: !b.favorito }
                : b
            )
        );
        // TODO: Integrar com FavoritosService para persistir
    }

    /**
     * Abre detalhes do barbeiro.
     */
    abrirBarbeiro(barbeiro: BarbeiroCard): void {
        // TODO: Navegar para página de detalhes do barbeiro
        console.log('Abrindo barbeiro:', barbeiro.id, barbeiro.nome);
    }

    /**
     * Permite alterar localização manualmente.
     */
    async alterarLocalizacao(): Promise<void> {
        // TODO: Implementar modal de seleção de cidade/endereço
        console.log('Alterar localização - a implementar');
    }
}
