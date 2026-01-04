import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Interceptor funcional para adicionar JWT nas requisições.
 * Também trata erros 401/403.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getAccessToken();

    // URLs públicas que não precisam de token
    const publicUrls = ['/auth/login', '/auth/registrar', '/auth/refresh'];
    const isPublic = publicUrls.some(url => req.url.includes(url));

    // Adicionar token se existir e não for rota pública
    if (token && !isPublic) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token expirado ou inválido
                authService.logout();
                router.navigate(['/login']);
            }

            if (error.status === 403) {
                // Acesso negado
                console.warn('Acesso negado:', error.url);
            }

            return throwError(() => error);
        })
    );
};
