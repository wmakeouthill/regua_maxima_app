import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

/**
 * Rotas principais da aplicação.
 * Lazy loading para melhor performance.
 * Rotas protegidas por authGuard e roleGuard.
 */
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'tabs',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage)
    },
    {
        path: 'registrar',
        loadComponent: () => import('./features/auth/registrar/registrar.page').then(m => m.RegistrarPage)
    },
    {
        path: 'tabs',
        loadComponent: () => import('./features/tabs/tabs.page').then(m => m.TabsPage),
        canActivate: [authGuard],
        children: [
            // Home inteligente - redireciona baseado no tipo de usuário
            {
                path: 'home',
                loadComponent: () => import('./features/home/home.page').then(m => m.HomePage)
            },

            // Perfil comum a todos
            {
                path: 'perfil',
                loadComponent: () => import('./features/perfil/perfil.page').then(m => m.PerfilPage)
            },

            // ========== Área do Admin (Dono de Barbearia) ==========
            {
                path: 'admin',
                canActivate: [roleGuard(['ADMIN'])],
                children: [
                    {
                        path: '',
                        redirectTo: 'dashboard',
                        pathMatch: 'full'
                    },
                    {
                        path: 'dashboard',
                        loadComponent: () => import('./features/admin/dashboard/dashboard.page').then(m => m.DashboardPage)
                    },
                    {
                        path: 'barbearia',
                        loadComponent: () => import('./features/admin/barbearia/minha-barbearia.page').then(m => m.MinhaBarbeariaPage)
                    },
                    {
                        path: 'servicos',
                        loadComponent: () => import('./features/admin/servicos/servicos.page').then(m => m.ServicosPage)
                    },
                    {
                        path: 'tema',
                        loadComponent: () => import('./features/admin/tema/tema.page').then(m => m.TemaPage)
                    },
                    {
                        path: 'barbeiros',
                        loadComponent: () => import('./features/admin/barbeiros/gerenciar-barbeiros.page').then(m => m.GerenciarBarbeirosPage)
                    }
                ]
            },

            // ========== Área do Barbeiro ==========
            {
                path: 'barbeiro',
                canActivate: [roleGuard(['BARBEIRO'])],
                children: [
                    {
                        path: '',
                        redirectTo: 'agenda',
                        pathMatch: 'full'
                    },
                    {
                        path: 'agenda',
                        loadComponent: () => import('./features/barbeiro/agenda/minha-agenda.page').then(m => m.MinhaAgendaPage)
                    },
                    {
                        path: 'perfil',
                        loadComponent: () => import('./features/barbeiro/perfil/meu-perfil.page').then(m => m.MeuPerfilBarbeiroPage)
                    },
                    {
                        path: 'vincular',
                        loadComponent: () => import('./features/barbeiro/vincular/vincular-barbearia.page').then(m => m.VincularBarbeariaPage)
                    }
                ]
            },

            // ========== Área do Cliente ==========
            // TODO: Adicionar rotas de explorar, mapa, favoritos

            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'tabs'
    }
];
