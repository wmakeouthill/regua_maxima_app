# Regras de Desenvolvimento Mobile Híbrido - Arquitetura Angular + Ionic + Capacitor

Este documento estabelece as regras, princípios e padrões para o desenvolvimento de aplicações móveis híbridas que funcionam em Android e iOS, utilizando Angular empacotado no binário do celular e comunicação com backend Java no Cloud Run.

---

## 1. Visão Geral da Arquitetura

### 1.1 Stack Recomendada (Gold Standard)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO MÓVEL                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    CAPACITOR SHELL                          │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │              IONIC FRAMEWORK (UI Nativa)              │  │ │
│  │  │  ┌─────────────────────────────────────────────────┐  │  │ │
│  │  │  │           ANGULAR 20+ (ZONELESS)                │  │  │ │
│  │  │  │  • Standalone Components                        │  │  │ │
│  │  │  │  • Signals para Estado                          │  │  │ │
│  │  │  │  • TypeScript >= 5.6                            │  │  │ │
│  │  │  └─────────────────────────────────────────────────┘  │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                    HTTPS (REST API)                               │
│                              ▼                                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        GOOGLE CLOUD                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     CLOUD RUN                               │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │              JAVA 21 LTS (SPRING BOOT 3.4.x)          │  │ │
│  │  │  • APIs REST + JWT Stateless                          │  │ │
│  │  │  • CORS configurado para Capacitor                     │  │ │
│  │  │  • Auto-scaling 0 → ∞                                  │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     CLOUD SQL                               │ │
│  │                   (PostgreSQL 16)                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnológica

| Camada | Tecnologia | Versão | Propósito |
|--------|------------|--------|-----------|
| Frontend | Angular | >= 20 (zoneless) | Framework SPA |
| UI Mobile | Ionic Framework | 8.x | Componentes UI adaptativos |
| Bridge Nativo | Capacitor | 6.x | Acesso a APIs nativas |
| Backend | Spring Boot | 3.4.x | APIs REST stateless |
| Linguagem Backend | Java | 21 LTS | Linguagem principal com Virtual Threads |
| Banco de Dados | PostgreSQL | 16 | Cloud SQL |
| Infraestrutura | Cloud Run | - | Serverless containers |
| Push Notifications | Firebase Cloud Messaging | - | Notificações push |

### 1.3 Por que essa combinação?

**Angular + Ionic Framework:**

- Usa "Adaptive Styling" - mesmo código, aparência nativa em cada plataforma
- Componentes iOS exibem estilo SF Pro, Android exibe Material Design
- Componentes customizáveis e bem documentados

**Capacitor:**

- Sucessor moderno do Cordova, criado pelo time do Ionic
- Empacota o build Angular dentro do WebView nativo
- APIs nativas modernas e bem tipadas
- Integração perfeita com Angular

**Spring Boot no Cloud Run:**

- Backend stateless obrigatório para compatibilidade com scaling
- Cloud Run escala automaticamente de 0 a infinito
- Custo zero quando não há requisições

---

## 2. Estrutura de Projeto

### 2.1 Organização de Diretórios

```
mobile-app/
├── android/                     # Projeto Android (gerado pelo Capacitor)
│   ├── app/
│   │   └── src/main/
│   └── build.gradle
│
├── ios/                         # Projeto iOS (gerado pelo Capacitor)
│   └── App/
│       └── App.xcodeproj
│
├── src/                         # Código Angular
│   ├── app/
│   │   ├── core/               # Serviços singleton, guards, interceptors
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   └── storage.service.ts
│   │   │   └── native/
│   │   │       ├── camera.service.ts
│   │   │       ├── haptics.service.ts
│   │   │       └── push.service.ts
│   │   │
│   │   ├── features/           # Módulos de funcionalidade
│   │   │   ├── home/
│   │   │   ├── operacao/
│   │   │   └── perfil/
│   │   │
│   │   ├── shared/             # Componentes, pipes, directives
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   │
│   │   └── app.routes.ts       # Rotas standalone
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── theme/                   # Variáveis Ionic/CSS
│       └── variables.scss
│
├── capacitor.config.ts          # Configuração Capacitor
├── ionic.config.json            # Configuração Ionic CLI
├── angular.json
├── package.json
└── tsconfig.json
```

### 2.2 Configuração Capacitor

**capacitor.config.ts:**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'br.gov.bcb.selic.mobile',
    appName: 'SELIC Mobile',
    webDir: 'www',
    
    // Configurações do servidor local do Capacitor
    server: {
        androidScheme: 'https',
        iosScheme: 'ionic'
    },
    
    // Plugins
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#1976d2'
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert']
        },
        Keyboard: {
            resize: 'body',
            resizeOnFullScreen: true
        }
    },
    
    // Configurações Android
    android: {
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: false // false em produção
    },
    
    // Configurações iOS
    ios: {
        contentInset: 'automatic'
    }
};

export default config;
```

---

## 3. Comunicação com Backend (CORS)

### 3.1 O Desafio do CORS

Quando o app roda no celular, ele faz requisições a partir de origens especiais:

- **Android**: `https://localhost` ou `capacitor://localhost`
- **iOS**: `ionic://localhost` ou `capacitor://localhost`

O backend no Cloud Run precisa aceitar essas origens.

### 3.2 Configuração CORS no Spring Boot

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins(
                "http://localhost",        // Dev local
                "http://localhost:4200",   // Angular dev server
                "http://localhost:8100",   // Ionic dev server
                "https://localhost",       // Capacitor Android
                "capacitor://localhost",   // Capacitor universal
                "ionic://localhost",       // Capacitor iOS
                "http://192.168.0.0/16"    // Testes em rede local (range)
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Authorization", "X-Request-Id")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### 3.3 Configuração por Ambiente

**application-pro.yml:**

```yaml
cors:
  allowed-origins:
    - https://localhost
    - capacitor://localhost
    - ionic://localhost
```

### 3.4 API Service no Angular

```typescript
// core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;
    
    get<T>(endpoint: string) {
        return this.http.get<T>(`${this.baseUrl}${endpoint}`);
    }
    
    post<T>(endpoint: string, body: any) {
        return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
    }
    
    put<T>(endpoint: string, body: any) {
        return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
    }
    
    delete<T>(endpoint: string) {
        return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
    }
}

// environments/environment.ts (desenvolvimento)
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api'
};

// environments/environment.prod.ts (produção)
export const environment = {
    production: true,
    apiUrl: 'https://api-selic-mobile-xxxxx.a.run.app/api'
};
```

---

## 4. Autenticação JWT Stateless

### 4.1 Fluxo de Autenticação

```
┌─────────────┐       POST /auth/login       ┌─────────────┐
│   Mobile    │ ───────────────────────────> │   Backend   │
│     App     │                              │  Cloud Run  │
│             │ <─────────────────────────── │             │
└─────────────┘     { accessToken, refresh } └─────────────┘
      │
      │ Salva tokens no 
      │ Capacitor Preferences
      ▼
┌─────────────┐
│   Secure    │
│   Storage   │
└─────────────┘
      │
      │ Requisições subsequentes
      │ Header: Authorization: Bearer xxx
      ▼
┌─────────────┐       GET /operacao          ┌─────────────┐
│   Mobile    │ ───────────────────────────> │   Backend   │
│     App     │                              │  Cloud Run  │
│             │ <─────────────────────────── │             │
└─────────────┘           { data }           └─────────────┘
```

### 4.2 Auth Service

```typescript
// core/auth/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Observable, from, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
}

interface User {
    id: string;
    nome: string;
    email: string;
    roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    
    // Estado reativo com Signals
    private _currentUser = signal<User | null>(null);
    private _accessToken = signal<string | null>(null);
    private _isLoading = signal(true);
    
    // Computed states
    currentUser = this._currentUser.asReadonly();
    isAuthenticated = computed(() => this._accessToken() !== null);
    isLoading = this._isLoading.asReadonly();
    
    // Inicialização - verificar tokens salvos
    async initialize(): Promise<void> {
        try {
            const { value: token } = await Preferences.get({ key: 'access_token' });
            const { value: userJson } = await Preferences.get({ key: 'user' });
            
            if (token && userJson) {
                this._accessToken.set(token);
                this._currentUser.set(JSON.parse(userJson));
            }
        } finally {
            this._isLoading.set(false);
        }
    }
    
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${environment.apiUrl}/auth/login`,
            { email, password }
        ).pipe(
            switchMap(response => 
                from(this.saveTokens(response)).pipe(
                    tap(() => {
                        this._accessToken.set(response.accessToken);
                        this._currentUser.set(response.user);
                    }),
                    switchMap(() => [response])
                )
            )
        );
    }
    
    private async saveTokens(response: AuthResponse): Promise<void> {
        await Promise.all([
            Preferences.set({ key: 'access_token', value: response.accessToken }),
            Preferences.set({ key: 'refresh_token', value: response.refreshToken }),
            Preferences.set({ key: 'user', value: JSON.stringify(response.user) })
        ]);
    }
    
    async logout(): Promise<void> {
        await Promise.all([
            Preferences.remove({ key: 'access_token' }),
            Preferences.remove({ key: 'refresh_token' }),
            Preferences.remove({ key: 'user' })
        ]);
        
        this._accessToken.set(null);
        this._currentUser.set(null);
    }
    
    getAccessToken(): string | null {
        return this._accessToken();
    }
    
    getUserRoles(): string[] {
        return this._currentUser()?.roles ?? [];
    }
    
    hasRole(role: string): boolean {
        return this.getUserRoles().includes(role);
    }
}
```

### 4.3 Auth Interceptor

```typescript
// core/auth/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const token = authService.getAccessToken();
    
    // Não adicionar token para rotas públicas
    const publicUrls = ['/auth/login', '/auth/refresh', '/auth/register'];
    const isPublic = publicUrls.some(url => req.url.includes(url));
    
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
                router.navigate(['/acesso-negado']);
            }
            
            return throwError(() => error);
        })
    );
};
```

### 4.4 Bootstrap com Interceptor

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideExperimentalZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { AuthService } from './app/core/auth/auth.service';

// Inicializar AuthService antes do app
function initializeAuth(): () => Promise<void> {
    const authService = inject(AuthService);
    return () => authService.initialize();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideExperimentalZonelessChangeDetection(),
        provideIonicAngular(),
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([authInterceptor])
        ),
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuth,
            multi: true
        }
    ]
});
```

---

## 5. APIs Nativas (Capacitor)

### 5.1 Plugins Essenciais

Instalar plugins do Capacitor:

```bash
npm install @capacitor/preferences        # Armazenamento local
npm install @capacitor/camera             # Câmera
npm install @capacitor/haptics            # Vibração/feedback tátil
npm install @capacitor/push-notifications # Push notifications
npm install @capacitor/geolocation        # Localização
npm install @capacitor/network            # Status de rede
npm install @capacitor/app                # Lifecycle do app
npm install @capacitor/splash-screen      # Splash screen
npm install @capacitor/keyboard           # Controle de teclado
npm install @capacitor/status-bar         # Status bar
npm install @capacitor/share              # Compartilhamento
```

### 5.2 Serviço de Câmera

```typescript
// core/native/camera.service.ts
import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

@Injectable({ providedIn: 'root' })
export class CameraService {
    
    async takePicture(): Promise<Photo> {
        return await Camera.getPhoto({
            quality: 80,
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,
            width: 1024,
            height: 1024
        });
    }
    
    async selectFromGallery(): Promise<Photo> {
        return await Camera.getPhoto({
            quality: 80,
            resultType: CameraResultType.Base64,
            source: CameraSource.Photos
        });
    }
    
    async pickMultiple(): Promise<Photo[]> {
        const result = await Camera.pickImages({
            quality: 80,
            limit: 5
        });
        return result.photos;
    }
}
```

### 5.3 Serviço de Haptics

```typescript
// core/native/haptics.service.ts
import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class HapticsService {
    
    // Feedback leve (tap em botão)
    async light(): Promise<void> {
        await Haptics.impact({ style: ImpactStyle.Light });
    }
    
    // Feedback médio (seleção)
    async medium(): Promise<void> {
        await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    // Feedback pesado (ação importante)
    async heavy(): Promise<void> {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    }
    
    // Notificação de sucesso
    async success(): Promise<void> {
        await Haptics.notification({ type: NotificationType.Success });
    }
    
    // Notificação de erro
    async error(): Promise<void> {
        await Haptics.notification({ type: NotificationType.Error });
    }
    
    // Notificação de aviso
    async warning(): Promise<void> {
        await Haptics.notification({ type: NotificationType.Warning });
    }
}
```

### 5.4 Serviço de Push Notifications

```typescript
// core/native/push.service.ts
import { Injectable, inject } from '@angular/core';
import { 
    PushNotifications, 
    Token, 
    PushNotificationSchema,
    ActionPerformed 
} from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Injectable({ providedIn: 'root' })
export class PushService {
    private router = inject(Router);
    private api = inject(ApiService);
    
    async initialize(): Promise<void> {
        // Solicitar permissão
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
            await PushNotifications.register();
        }
        
        // Listeners
        this.setupListeners();
    }
    
    private setupListeners(): void {
        // Token recebido
        PushNotifications.addListener('registration', (token: Token) => {
            console.log('Push token:', token.value);
            this.sendTokenToBackend(token.value);
        });
        
        // Erro no registro
        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Push registration error:', error);
        });
        
        // Notificação recebida (app em foreground)
        PushNotifications.addListener(
            'pushNotificationReceived',
            (notification: PushNotificationSchema) => {
                console.log('Push received:', notification);
                // Mostrar toast ou atualizar UI
            }
        );
        
        // Usuário clicou na notificação
        PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (action: ActionPerformed) => {
                console.log('Push action:', action);
                this.handleNotificationAction(action.notification.data);
            }
        );
    }
    
    private sendTokenToBackend(token: string): void {
        this.api.post('/push/register', { token }).subscribe();
    }
    
    private handleNotificationAction(data: any): void {
        // Navegar para tela específica baseado nos dados
        if (data.operacaoId) {
            this.router.navigate(['/operacao', data.operacaoId]);
        }
    }
}
```

### 5.5 Serviço de Rede

```typescript
// core/native/network.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';

@Injectable({ providedIn: 'root' })
export class NetworkService {
    private _status = signal<ConnectionStatus | null>(null);
    
    isOnline = computed(() => this._status()?.connected ?? true);
    connectionType = computed(() => this._status()?.connectionType ?? 'unknown');
    
    async initialize(): Promise<void> {
        // Status inicial
        const status = await Network.getStatus();
        this._status.set(status);
        
        // Listener de mudanças
        Network.addListener('networkStatusChange', (status) => {
            this._status.set(status);
            console.log('Network status changed:', status);
        });
    }
}
```

---

## 6. Ionic Framework UI

### 6.1 Componentes Adaptativos

Os componentes Ionic se adaptam automaticamente ao sistema operacional:

```typescript
// Exemplo de página com componentes Ionic
import { Component } from '@angular/core';
import { 
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon,
    IonRefresher, IonRefresherContent, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, refresh } from 'ionicons/icons';

@Component({
    selector: 'app-operacoes',
    standalone: true,
    imports: [
        IonHeader, IonToolbar, IonTitle, IonContent,
        IonList, IonItem, IonLabel, IonButton, IonIcon,
        IonRefresher, IonRefresherContent, IonFab, IonFabButton
    ],
    template: `
        <ion-header>
            <ion-toolbar>
                <ion-title>Operações</ion-title>
            </ion-toolbar>
        </ion-header>
        
        <ion-content>
            <!-- Pull to refresh -->
            <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>
            
            <!-- Lista -->
            <ion-list>
                @for (operacao of operacoes(); track operacao.id) {
                    <ion-item (click)="openDetalhe(operacao)">
                        <ion-label>
                            <h2>{{ operacao.numero }}</h2>
                            <p>{{ operacao.situacao }}</p>
                        </ion-label>
                    </ion-item>
                }
            </ion-list>
            
            <!-- FAB -->
            <ion-fab vertical="bottom" horizontal="end" slot="fixed">
                <ion-fab-button (click)="novaOperacao()">
                    <ion-icon name="add"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    `
})
export class OperacoesPage {
    operacoes = signal<Operacao[]>([]);
    
    constructor() {
        addIcons({ add, refresh });
    }
    
    onRefresh(event: CustomEvent) {
        this.carregarOperacoes().then(() => {
            (event.target as HTMLIonRefresherElement).complete();
        });
    }
}
```

### 6.2 Navegação com Ionic

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
        path: 'tabs',
        loadComponent: () => import('./features/tabs/tabs.page').then(m => m.TabsPage),
        canActivate: [authGuard],
        children: [
            {
                path: 'home',
                loadComponent: () => import('./features/home/home.page').then(m => m.HomePage)
            },
            {
                path: 'operacoes',
                loadComponent: () => import('./features/operacoes/operacoes.page').then(m => m.OperacoesPage)
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
    }
];
```

### 6.3 Tema Customizado

```scss
// src/theme/variables.scss
:root {
    // Cores primárias
    --ion-color-primary: #1976d2;
    --ion-color-primary-rgb: 25, 118, 210;
    --ion-color-primary-contrast: #ffffff;
    --ion-color-primary-shade: #1565c0;
    --ion-color-primary-tint: #1e88e5;
    
    // Cores secundárias
    --ion-color-secondary: #00897b;
    --ion-color-secondary-rgb: 0, 137, 123;
    --ion-color-secondary-contrast: #ffffff;
    
    // Success, warning, danger...
    --ion-color-success: #4caf50;
    --ion-color-warning: #ff9800;
    --ion-color-danger: #f44336;
    
    // Background
    --ion-background-color: #f5f5f5;
    --ion-background-color-rgb: 245, 245, 245;
}

// Tema escuro
@media (prefers-color-scheme: dark) {
    :root {
        --ion-background-color: #121212;
        --ion-background-color-rgb: 18, 18, 18;
        --ion-text-color: #ffffff;
    }
}
```

---

## 7. Build e Deploy

### 7.1 Fluxo de Desenvolvimento

```bash
# 1. Desenvolvimento local (navegador)
ng serve
# ou
ionic serve

# 2. Testar em dispositivo real via Live Reload
ionic cap run android -l --external
ionic cap run ios -l --external

# 3. Build de produção
ionic build --prod

# 4. Sincronizar com projetos nativos
npx cap sync

# 5. Abrir projetos nativos
npx cap open android  # Abre Android Studio
npx cap open ios      # Abre Xcode
```

### 7.2 Configuração de Build

**angular.json (configuração otimizada):**

```json
{
    "configurations": {
        "production": {
            "budgets": [
                {
                    "type": "initial",
                    "maximumWarning": "2mb",
                    "maximumError": "5mb"
                }
            ],
            "outputHashing": "all",
            "optimization": true,
            "sourceMap": false,
            "namedChunks": false,
            "extractLicenses": true
        }
    }
}
```

### 7.3 Deploy Backend (Cloud Run)

**Dockerfile:**

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/*.jar app.jar

# Java 21 LTS com Virtual Threads e ZGC
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75 -XX:+UseZGC -XX:+ZGenerational"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**Comandos de deploy:**

```bash
# Build Docker image
docker build -t gcr.io/PROJECT_ID/selic-api .

# Push para Container Registry
docker push gcr.io/PROJECT_ID/selic-api

# Deploy no Cloud Run
gcloud run deploy selic-api \
    --image gcr.io/PROJECT_ID/selic-api \
    --platform managed \
    --region southamerica-east1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 10
```

### 7.4 Deploy Mobile (App Stores)

**Android (Play Store):**

1. Gerar keystore: `keytool -genkey -v -keystore selic.keystore ...`
2. Configurar signing no `android/app/build.gradle`
3. Build AAB: `./gradlew bundleRelease`
4. Upload para Google Play Console

**iOS (App Store):**

1. Configurar provisioning profile no Apple Developer
2. Abrir Xcode: `npx cap open ios`
3. Archive > Distribute App
4. Upload para App Store Connect

---

## 8. Segurança

### 8.1 Armazenamento Seguro

```typescript
// Para dados sensíveis, usar plugin de secure storage
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

// Instalar: npm install capacitor-secure-storage-plugin

// Salvar
await SecureStoragePlugin.set({ key: 'refresh_token', value: token });

// Obter
const { value } = await SecureStoragePlugin.get({ key: 'refresh_token' });

// Remover
await SecureStoragePlugin.remove({ key: 'refresh_token' });
```

### 8.2 Validações de Segurança

```typescript
// Verificar se app está rodando em dispositivo comprometido
import { Device } from '@capacitor/device';

async checkDeviceSecurity(): Promise<boolean> {
    const info = await Device.getInfo();
    
    // Verificar se é emulador (pode ser bloqueado em produção)
    if (info.isVirtual) {
        console.warn('Executando em emulador');
    }
    
    return true;
}
```

### 8.3 Certificate Pinning

Para segurança adicional, considerar certificate pinning no Capacitor:

```typescript
// plugins/ssl-pinning/android/... (implementação nativa)
// Verificar certificados do servidor para prevenir MITM
```

---

## 9. Checklist de Revisão

### 9.1 Estrutura

- [ ] Projeto segue estrutura core/features/shared
- [ ] Capacitor configurado corretamente
- [ ] Environments definidos (dev/prod)
- [ ] Rotas com lazy loading

### 9.2 Autenticação

- [ ] JWT stateless implementado
- [ ] Tokens salvos em Secure Storage
- [ ] Interceptor de autenticação
- [ ] Refresh token implementado
- [ ] Logout limpa todos os dados

### 9.3 Backend

- [ ] CORS configurado para origens Capacitor
- [ ] API stateless (sem sessão)
- [ ] JWT validation
- [ ] Rate limiting

### 9.4 UI/UX

- [ ] Componentes Ionic utilizados
- [ ] Tema customizado
- [ ] Feedback haptic em ações importantes
- [ ] Pull to refresh onde apropriado
- [ ] Loading states visíveis

### 9.5 Native

- [ ] Push notifications configurado
- [ ] Permissões solicitadas corretamente
- [ ] Tratamento de erro de rede
- [ ] Deep links configurados

### 9.6 Build

- [ ] Build de produção otimizado
- [ ] Ícones e splash screens configurados
- [ ] Versioning correto (versionCode/CFBundleVersion)
- [ ] Signing configurado para ambas plataformas
