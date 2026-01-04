import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Rotas principais da aplicação.
 * Lazy loading para melhor performance.
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
            {
                path: 'home',
                loadComponent: () => import('./features/home/home.page').then(m => m.HomePage)
            },
            {
                path: 'perfil',
                loadComponent: () => import('./features/perfil/perfil.page').then(m => m.PerfilPage)
            },
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
