import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';
import { AppConfigService } from './app/core/config/app-config.service';

/**
 * Inicializa configurações públicas da aplicação.
 * Carrega Google Client ID e outras configs do backend.
 */
function initializeAppConfig(): () => Promise<void> {
    const appConfigService = inject(AppConfigService);
    return () => appConfigService.loadConfig();
}

/**
 * Inicializa o AuthService antes do bootstrap da aplicação.
 * Carrega tokens salvos do storage.
 */
function initializeAuth(): () => Promise<void> {
    const authService = inject(AuthService);
    return () => authService.initialize();
}

/**
 * Bootstrap da aplicação com:
 * - Zoneless Change Detection (performance)
 * - Ionic Angular
 * - HTTP Client com interceptor de autenticação
 * - Router com input binding
 */
bootstrapApplication(AppComponent, {
    providers: [
        // Zoneless para máxima performance
        provideZonelessChangeDetection(),

        // Ionic Angular
        provideIonicAngular(),

        // Router
        provideRouter(routes, withComponentInputBinding()),

        // HTTP Client com interceptor JWT
        provideHttpClient(
            withInterceptors([authInterceptor])
        ),

        // Inicialização das configurações públicas (Google OAuth, etc)
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAppConfig,
            multi: true
        },

        // Inicialização do AuthService
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuth,
            multi: true
        }
    ]
}).catch(err => console.error(err));
