import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard funcional para verificar roles específicas.
 * Redireciona para a área correta baseada no tipo de usuário.
 * 
 * @example
 * // Uso nas rotas:
 * { 
 *   path: 'admin', 
 *   canActivate: [roleGuard(['ADMIN'])],
 *   loadComponent: () => import('./admin/dashboard.page')
 * }
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        // Verificar se está autenticado
        if (!authService.isAuthenticated()) {
            return router.createUrlTree(['/login']);
        }

        // Verificar roles
        const userRoles = authService.getUserRoles();
        const hasRole = allowedRoles.some(role =>
            userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
        );

        if (hasRole) {
            return true;
        }

        // Redirecionar para área correta baseada na role do usuário
        return router.createUrlTree([getRedirectPath(userRoles)]);
    };
}

/**
 * Retorna o path de redirecionamento baseado nas roles do usuário.
 */
function getRedirectPath(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) {
        return '/tabs/admin';
    }
    if (roles.includes('ROLE_BARBEIRO') || roles.includes('BARBEIRO')) {
        return '/tabs/barbeiro';
    }
    // Default para CLIENTE
    return '/tabs/explorar';
}

/**
 * Guard para área do Admin (Dono de Barbearia).
 */
export const adminGuard: CanActivateFn = roleGuard(['ADMIN']);

/**
 * Guard para área do Barbeiro.
 */
export const barbeiroGuard: CanActivateFn = roleGuard(['BARBEIRO']);

/**
 * Guard para área do Cliente.
 */
export const clienteGuard: CanActivateFn = roleGuard(['CLIENTE']);
