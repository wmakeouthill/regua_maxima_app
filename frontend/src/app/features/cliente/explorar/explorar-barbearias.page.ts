import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
    chevronForwardOutline, notificationsOutline
} from 'ionicons/icons';

/**
 * Interface para barbearia listada
 */
interface BarbeariaCard {
    id: string;
    nome: string;
    endereco: string;
    distanciaKm: number;
    avaliacaoMedia: number;
    totalAvaliacoes: number;
    fotoUrl?: string;
    aberto: boolean;
    horarioFechamento?: string;
    servicoDestaque?: string;
    precoMinimo?: number;
    favorito: boolean;
}

/**
 * Tipo de visualização
 */
type TipoVisualizacao = 'lista' | 'mapa';

/**
 * Página principal do Cliente.
 * Lista de barbearias próximas com busca e filtros.
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
    // Estado
    readonly carregando = signal(false);
    readonly barbearias = signal<BarbeariaCard[]>([]);
    readonly localizacaoAtual = signal('Detectando localização...');
    termoBusca = '';
    tipoVisualizacao: TipoVisualizacao = 'lista';

    // Computed
    readonly barbeariasFiltradas = computed(() => {
        const termo = this.termoBusca.toLowerCase();
        if (!termo) return this.barbearias();
        return this.barbearias().filter(b =>
            b.nome.toLowerCase().includes(termo) ||
            b.endereco.toLowerCase().includes(termo)
        );
    });

    constructor() {
        addIcons({
            locationOutline, starOutline, heartOutline, heart,
            mapOutline, listOutline, navigateOutline, storefrontOutline,
            chevronForwardOutline, notificationsOutline
        });
    }

    ngOnInit(): void {
        this.obterLocalizacao();
        this.carregarBarbearias();
    }

    obterLocalizacao(): void {
        // TODO: Integrar com Geolocation API do Capacitor
        setTimeout(() => {
            this.localizacaoAtual.set('Centro, São Paulo - SP');
        }, 1000);
    }

    carregarBarbearias(): void {
        this.carregando.set(true);

        // TODO: Integrar com BarbeariaService real
        setTimeout(() => {
            this.barbearias.set([
                {
                    id: '1',
                    nome: 'Barbearia Vintage',
                    endereco: 'Rua Augusta, 1500 - Consolação',
                    distanciaKm: 0.8,
                    avaliacaoMedia: 4.8,
                    totalAvaliacoes: 234,
                    fotoUrl: undefined,
                    aberto: true,
                    horarioFechamento: '20:00',
                    servicoDestaque: 'Corte Degradê',
                    precoMinimo: 45,
                    favorito: true
                },
                {
                    id: '2',
                    nome: 'The Barber Shop',
                    endereco: 'Av. Paulista, 1000 - Bela Vista',
                    distanciaKm: 1.2,
                    avaliacaoMedia: 4.6,
                    totalAvaliacoes: 189,
                    fotoUrl: undefined,
                    aberto: true,
                    servicoDestaque: 'Barba Completa',
                    precoMinimo: 35,
                    favorito: false
                },
                {
                    id: '3',
                    nome: 'Classic Cuts',
                    endereco: 'Rua Oscar Freire, 500 - Jardins',
                    distanciaKm: 1.8,
                    avaliacaoMedia: 4.9,
                    totalAvaliacoes: 412,
                    fotoUrl: undefined,
                    aberto: false,
                    servicoDestaque: 'Corte Premium',
                    precoMinimo: 80,
                    favorito: false
                },
                {
                    id: '4',
                    nome: 'Barba Negra',
                    endereco: 'Rua da Consolação, 2100',
                    distanciaKm: 2.1,
                    avaliacaoMedia: 4.5,
                    totalAvaliacoes: 156,
                    fotoUrl: undefined,
                    aberto: true,
                    servicoDestaque: 'Corte + Barba',
                    precoMinimo: 55,
                    favorito: true
                },
                {
                    id: '5',
                    nome: 'Kings Barbershop',
                    endereco: 'Av. Rebouças, 800 - Pinheiros',
                    distanciaKm: 2.5,
                    avaliacaoMedia: 4.7,
                    totalAvaliacoes: 298,
                    fotoUrl: undefined,
                    aberto: true,
                    servicoDestaque: 'Relaxamento',
                    precoMinimo: 120,
                    favorito: false
                }
            ]);
            this.carregando.set(false);
        }, 800);
    }

    handleRefresh(event: CustomEvent): void {
        this.carregarBarbearias();
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 1000);
    }

    buscar(): void {
        // O computed barbeariasFiltradas faz a filtragem
    }

    alterarVisualizacao(): void {
        // Mapa será implementado depois
    }

    toggleFavorito(barbearia: BarbeariaCard, event: Event): void {
        event.stopPropagation();
        this.barbearias.update(lista =>
            lista.map(b => b.id === barbearia.id
                ? { ...b, favorito: !b.favorito }
                : b
            )
        );
        // TODO: Chamar FavoritoService
    }

    abrirBarbearia(barbearia: BarbeariaCard): void {
        // TODO: Navegar para página de detalhes da barbearia
        console.log('Abrindo barbearia:', barbearia.id);
    }
}
