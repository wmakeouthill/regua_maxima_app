import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, TipoUsuario } from './auth.service';

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

        // Verificar tipo de usuário (mais confiável que roles)
        const tipoUsuario = authService.getTipoUsuario();

        if (tipoUsuario && allowedRoles.includes(tipoUsuario)) {
            return true;
        }

        // Fallback: verificar roles do JWT
        const userRoles = authService.getUserRoles();
        const hasRole = allowedRoles.some(role =>
            userRoles.includes(role) || userRoles.includes(`ROLE_${role}`)
        );

        if (hasRole) {
            return true;
        }

        // Redirecionar para área correta baseada no tipo de usuário
        return router.createUrlTree([getRedirectPath(tipoUsuario, userRoles)]);
    };
}

/**
 * Retorna o path de redirecionamento baseado no tipo de usuário.
 */
function getRedirectPath(tipoUsuario: TipoUsuario | null, roles: string[]): string {
    // Primeiro tenta pelo tipoUsuario
    if (tipoUsuario === 'ADMIN') {
        return '/tabs/admin/dashboard';
    }
    if (tipoUsuario === 'BARBEIRO') {
        return '/tabs/barbeiro/fila';
    }
    if (tipoUsuario === 'CLIENTE') {
        return '/tabs/cliente/explorar';
    }

    // Fallback: verifica pelas roles
    if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) {
        return '/tabs/admin/dashboard';
    }
    if (roles.includes('ROLE_BARBEIRO') || roles.includes('BARBEIRO')) {
        return '/tabs/barbeiro/fila';
    }

    // Default para CLIENTE
    return '/tabs/cliente/explorar';
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
