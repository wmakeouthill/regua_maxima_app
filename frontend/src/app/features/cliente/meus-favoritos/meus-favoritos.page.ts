import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonBackButton, IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonAvatar, IonIcon, IonButton,
    IonSkeletonText, IonRefresher, IonRefresherContent, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    heartOutline, heart, trashOutline, storefrontOutline,
    personOutline, chevronForwardOutline, locationOutline,
    cutOutline, starOutline
} from 'ionicons/icons';
import { FavoritoService, Favorito, TipoFavorito } from '@core/services/favorito.service';

/**
 * Página que lista os favoritos do cliente (barbearias e barbeiros).
 */
@Component({
    selector: 'app-meus-favoritos',
    standalone: true,
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
        IonBackButton, IonSegment, IonSegmentButton, IonLabel,
        IonList, IonItem, IonAvatar, IonIcon, IonButton,
        IonSkeletonText, IonRefresher, IonRefresherContent, IonBadge
    ],
    templateUrl: './meus-favoritos.page.html',
    styleUrl: './meus-favoritos.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeusFavoritosPage implements OnInit {
    private readonly router = inject(Router);
    readonly favoritoService = inject(FavoritoService);

    // Estado
    readonly carregando = signal(true);
    readonly segmentoAtivo = signal<TipoFavorito>('BARBEARIA');

    constructor() {
        addIcons({
            heartOutline, heart, trashOutline, storefrontOutline,
            personOutline, chevronForwardOutline, locationOutline,
            cutOutline, starOutline
        });
    }

    ngOnInit(): void {
        this.carregarFavoritos();
    }

    /**
     * Carrega todos os favoritos.
     */
    carregarFavoritos(): void {
        this.carregando.set(true);
        this.favoritoService.carregarFavoritos().subscribe({
            next: () => this.carregando.set(false),
            error: () => this.carregando.set(false)
        });
    }

    /**
     * Pull-to-refresh.
     */
    handleRefresh(event: CustomEvent): void {
        this.carregarFavoritos();
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 500);
    }

    /**
     * Altera segmento ativo.
     */
    alterarSegmento(event: CustomEvent): void {
        this.segmentoAtivo.set(event.detail.value);
    }

    /**
     * Abre barbearia.
     */
    abrirBarbearia(favorito: Favorito): void {
        if (favorito.slug) {
            this.router.navigate(['/barbearia', favorito.slug]);
        }
    }

    /**
     * Abre perfil do barbeiro.
     */
    abrirBarbeiro(favorito: Favorito): void {
        this.router.navigate(['/barbeiro', favorito.idFavoritado]);
    }

    /**
     * Remove favorito.
     */
    removerFavorito(favorito: Favorito, event: Event): void {
        event.stopPropagation();

        if (favorito.tipo === 'BARBEARIA') {
            this.favoritoService.removerBarbeariaFavorita(favorito.idFavoritado).subscribe();
        } else {
            this.favoritoService.removerBarbeiroFavorito(favorito.idFavoritado).subscribe();
        }
    }

    /**
     * Abre favorito (barbearia ou barbeiro).
     */
    abrirFavorito(favorito: Favorito): void {
        if (favorito.tipo === 'BARBEARIA') {
            this.abrirBarbearia(favorito);
        } else {
            this.abrirBarbeiro(favorito);
        }
    }
}
