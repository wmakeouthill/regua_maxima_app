import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardTitle, IonCardContent, IonCardSubtitle,
    IonIcon, IonButton, IonChip, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    cutOutline, calendarOutline, timeOutline,
    starOutline, personOutline, locationOutline,
    ribbonOutline, notificationsOutline
} from 'ionicons/icons';
import { AuthService } from '@core/auth/auth.service';

/**
 * Página home inteligente.
 * Redireciona para área específica baseada no tipo de usuário.
 * - ADMIN -> /tabs/admin
 * - BARBEIRO -> /tabs/barbeiro  
 * - CLIENTE -> Exibe home com serviços
 */
@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardTitle, IonCardContent, IonCardSubtitle,
        IonIcon, IonButton, IonChip, IonGrid, IonRow, IonCol
    ],
    templateUrl: './home.page.html',
    styleUrl: './home.page.scss'
})
export class HomePage implements OnInit {
    private router = inject(Router);
    authService = inject(AuthService);

    servicos = [
        { id: 1, nome: 'Corte Clássico', duracao: '30 min', preco: '45,00', icone: 'cut-outline' },
        { id: 2, nome: 'Barba', duracao: '20 min', preco: '35,00', icone: 'cut-outline' },
        { id: 3, nome: 'Corte + Barba', duracao: '50 min', preco: '70,00', icone: 'cut-outline' },
        { id: 4, nome: 'Degradê', duracao: '40 min', preco: '55,00', icone: 'cut-outline' }
    ];

    constructor() {
        addIcons({
            cutOutline, calendarOutline, timeOutline,
            starOutline, personOutline, locationOutline,
            ribbonOutline, notificationsOutline
        });
    }

    ngOnInit(): void {
        // Redireciona cada tipo para sua área específica
        const tipo = this.authService.getTipoUsuario();
        if (tipo === 'ADMIN') {
            this.router.navigate(['/tabs/admin/fila'], { replaceUrl: true });
        } else if (tipo === 'BARBEIRO') {
            this.router.navigate(['/tabs/barbeiro/fila'], { replaceUrl: true });
        } else if (tipo === 'CLIENTE') {
            this.router.navigate(['/tabs/cliente/explorar'], { replaceUrl: true });
        }
    }

    getPrimeiroNome(): string {
        const nome = this.authService.currentUser()?.nome;
        return nome ? nome.split(' ')[0] : 'Cliente';
    }

    getTipoUsuarioLabel(): string {
        return this.authService.currentUser()?.tipoUsuarioDescricao ?? 'Usuário';
    }
}
