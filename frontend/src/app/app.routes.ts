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
        redirectTo: 'welcome',
        pathMatch: 'full'
    },
    {
        path: 'welcome',
        loadComponent: () => import('./features/auth/welcome/welcome.page').then(m => m.WelcomePage)
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
                    },
                    {
                        path: 'fila',
                        loadComponent: () => import('./features/admin/fila-atendimentos/fila-atendimentos.page').then(m => m.FilaAtendimentosPage)
                    },
                    {
                        path: 'sessao',
                        loadComponent: () => import('./features/admin/sessao-trabalho/sessao-trabalho.page').then(m => m.SessaoTrabalhoPage)
                    },
                    {
                        path: 'relatorios',
                        loadComponent: () => import('./features/admin/relatorios/relatorios.page').then(m => m.RelatoriosPage)
                    },
                    {
                        path: 'estoque',
                        loadComponent: () => import('./features/admin/gestao-estoque/gestao-estoque.page').then(m => m.GestaoEstoquePage)
                    },
                    {
                        path: 'meu-perfil-barbeiro',
                        loadComponent: () => import('./features/barbeiro/perfil/meu-perfil.page').then(m => m.MeuPerfilBarbeiroPage)
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
                        redirectTo: 'fila',
                        pathMatch: 'full'
                    },
                    {
                        path: 'fila',
                        loadComponent: () => import('./features/barbeiro/fila/fila-clientes.page').then(m => m.FilaClientesPage)
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
            {
                path: 'cliente',
                canActivate: [roleGuard(['CLIENTE'])],
                children: [
                    {
                        path: '',
                        redirectTo: 'explorar',
                        pathMatch: 'full'
                    },
                    {
                        path: 'explorar',
                        loadComponent: () => import('./features/cliente/explorar/explorar-barbearias.page').then(m => m.ExplorarBarbeariasPage)
                    },
                    {
                        path: 'agendamentos',
                        loadComponent: () => import('./features/cliente/meus-agendamentos/meus-agendamentos.page').then(m => m.MeusAgendamentosPage)
                    },
                    {
                        path: 'agendar/:barbeariaId',
                        loadComponent: () => import('./features/cliente/novo-agendamento/novo-agendamento.page').then(m => m.NovoAgendamentoPage)
                    },
                    {
                        path: 'agendamento/:id',
                        loadComponent: () => import('./features/cliente/detalhe-agendamento/detalhe-agendamento.page').then(m => m.DetalheAgendamentoPage)
                    },
                    {
                        path: 'favoritos',
                        loadComponent: () => import('./features/cliente/meus-favoritos/meus-favoritos.page').then(m => m.MeusFavoritosPage)
                    },
                    {
                        path: 'novo-agendamento',
                        loadComponent: () => import('./features/cliente/novo-agendamento/novo-agendamento.page').then(m => m.NovoAgendamentoPage)
                    },
                    {
                        path: 'avaliar',
                        loadComponent: () => import('./features/cliente/avaliar/avaliar.page').then(m => m.AvaliarPage)
                    },
                    {
                        path: 'minhas-avaliacoes',
                        loadComponent: () => import('./features/cliente/minhas-avaliacoes/minhas-avaliacoes.page').then(m => m.MinhasAvaliacoesPage)
                    },
                    {
                        path: 'editar-perfil',
                        loadComponent: () => import('./features/cliente/editar-perfil/editar-perfil.component').then(m => m.EditarPerfilComponent)
                    },
                    {
                        path: 'pagamentos',
                        loadComponent: () => import('./features/cliente/formas-pagamento/formas-pagamento.component').then(m => m.FormasPagamentoComponent)
                    },
                    {
                        path: 'notificacoes',
                        loadComponent: () => import('./features/cliente/notificacoes/notificacoes.component').then(m => m.NotificacoesComponent)
                    }
                ]
            },

            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    },

    // ========== Rotas Públicas (Barbearia pelo slug) ==========
    {
        path: 'barbearia/:slug',
        loadComponent: () => import('./features/cliente/barbearia-publica/barbearia-publica.page').then(m => m.BarbeariaPublicaPage)
    },

    {
        path: 'barbearia/:slug/avaliacoes',
        loadComponent: () => import('./features/cliente/avaliacoes-barbearia/avaliacoes-barbearia.page').then(m => m.AvaliacoesBarbeariaPage)
    },

    {
        path: '**',
        redirectTo: 'tabs'
    }
];
