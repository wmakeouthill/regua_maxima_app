import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonContent, IonIcon, IonRippleEffect
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    cutOutline, personOutline, storefrontOutline, briefcaseOutline,
    chevronForwardOutline
} from 'ionicons/icons';

/**
 * Tipos de perfil disponíveis na aplicação
 */
type TipoPerfil = 'admin' | 'barbeiro' | 'cliente';

/**
 * Dados de cada perfil para exibição
 */
interface PerfilCard {
    tipo: TipoPerfil;
    titulo: string;
    subtitulo: string;
    descricao: string;
    icone: string;
    cor: string;
}

/**
 * Página de boas-vindas / seleção de perfil.
 * 
 * Exibe as 3 opções de perfil:
 * - Administrador (Dono de Barbearia)
 * - Barbeiro (Profissional)
 * - Cliente
 * 
 * Direciona para login com o tipo de usuário pré-selecionado.
 */
@Component({
    selector: 'app-welcome',
    standalone: true,
    imports: [IonContent, IonIcon, IonRippleEffect],
    templateUrl: './welcome.page.html',
    styleUrl: './welcome.page.scss'
})
export class WelcomePage {
    /**
     * Dados dos perfis disponíveis
     */
    perfis: PerfilCard[] = [
        {
            tipo: 'admin',
            titulo: 'Dono de Barbearia',
            subtitulo: 'Administrador',
            descricao: 'Gerencie sua barbearia, barbeiros e serviços',
            icone: 'storefront-outline',
            cor: 'linear-gradient(135deg, var(--ion-color-secondary), var(--ion-color-secondary-shade))'
        },
        {
            tipo: 'barbeiro',
            titulo: 'Barbeiro',
            subtitulo: 'Profissional',
            descricao: 'Ofereça seus serviços e gerencie sua agenda',
            icone: 'briefcase-outline',
            cor: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade))'
        },
        {
            tipo: 'cliente',
            titulo: 'Cliente',
            subtitulo: 'Usuário',
            descricao: 'Encontre barbearias e agende seus cortes',
            icone: 'person-outline',
            cor: 'linear-gradient(135deg, var(--ion-color-success), var(--ion-color-success-shade))'
        }
    ];

    constructor(private readonly router: Router) {
        addIcons({
            cutOutline,
            personOutline,
            storefrontOutline,
            briefcaseOutline,
            chevronForwardOutline
        });
    }

    /**
     * Navega para a tela de login com o tipo de perfil selecionado
     */
    selecionarPerfil(tipo: TipoPerfil): void {
        // Mapeia o tipo do perfil para o TipoUsuario do backend
        const tipoUsuarioMap: Record<TipoPerfil, string> = {
            admin: 'ADMIN',
            barbeiro: 'BARBEIRO',
            cliente: 'CLIENTE'
        };

        this.router.navigate(['/login'], {
            queryParams: { tipo: tipoUsuarioMap[tipo] }
        });
    }
}
