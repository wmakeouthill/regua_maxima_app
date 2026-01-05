# 📋 Plano de Implementação - Régua Máxima App

> **Aplicativo de Gestão de Barbearias com Multi-Tenancy**  
> Data: 04/01/2026 | Versão: 1.0

---

## 📌 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Modelo de Dados](#3-modelo-de-dados)
4. [Funcionalidades por Perfil](#4-funcionalidades-por-perfil)
5. [Fases de Implementação](#5-fases-de-implementação)
6. [Estrutura Backend](#6-estrutura-backend)
7. [Estrutura Frontend](#7-estrutura-frontend)
8. [APIs RESTful](#8-apis-restful)
9. [Segurança e RBAC](#9-segurança-e-rbac)
10. [Geolocalização e Mapeamento](#10-geolocalização-e-mapeamento)
11. [Temas e Personalização](#11-temas-e-personalização)
12. [Checklist de Implementação](#12-checklist-de-implementação)

---

## 1. Visão Geral do Projeto

### 1.1 Objetivo

Desenvolver uma plataforma completa para **gestão de barbearias** que permite:

- **Administradores (Donos de Barbearia)**: Gerenciar sua barbearia, barbeiros, serviços e personalizar a aparência
- **Clientes**: Descobrir barbearias, agendar serviços, favoritar estabelecimentos e encontrar barbeiros no mapa
- **Barbeiros**: Cadastrar-se, vincular-se a barbearias e aparecer no mapa de profissionais

### 1.2 Principais Características

| Característica | Descrição |
|----------------|-----------|
| **Multi-Tenancy** | Cada barbearia tem sua própria "tela" personalizada com tema e foto |
| **Geolocalização** | Mapa com barbeiros/barbearias próximas |
| **Favoritos** | Clientes podem favoritar barbearias e barbeiros |
| **Temas Customizáveis** | Admin escolhe cores e logo da barbearia |
| **RBAC Completo** | Controle de acesso baseado em roles |

### 1.3 Stack Tecnológica (Conforme Regras)

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | Angular (Zoneless) | >= 20 |
| **UI Mobile** | Ionic Framework | 8.x |
| **Bridge Nativo** | Capacitor | 6.x |
| **Backend** | Spring Boot | 3.4.x |
| **Linguagem Backend** | Java | 21 LTS |
| **Banco de Dados** | PostgreSQL | 16 |
| **Infraestrutura** | Cloud Run (GCP) | - |
| **Mapas** | Google Maps API | - |

---

## 2. Arquitetura do Sistema

### 2.1 Visão Macro

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DISPOSITIVOS MÓVEIS                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    CAPACITOR + IONIC + ANGULAR                     │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐  │  │
│  │  │  App Cliente     │ │  App Admin       │ │  App Barbeiro     │  │  │
│  │  │  (Multi-Tenant)  │ │  (Gestão)        │ │  (Cadastro/Perfil)│  │  │
│  │  └──────────────────┘ └──────────────────┘ └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + JWT
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          GOOGLE CLOUD PLATFORM                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         CLOUD RUN                                  │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐  │  │
│  │  │  autenticacao    │ │  sistema-        │ │  (futuros          │  │  │
│  │  │  (Auth + Users)  │ │  orquestrador    │ │  microsserviços)   │  │  │
│  │  └──────────────────┘ └──────────────────┘ └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                                    ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         CLOUD SQL                                  │  │
│  │                       (PostgreSQL 16)                              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Arquitetura Backend (Clean Architecture + DDD)

```
backend/
├── kernel-compartilhado/          # Código compartilhado entre módulos
│   ├── dominio/
│   │   ├── dto/                   # DTOs compartilhados
│   │   ├── exception/             # Exceções de negócio
│   │   └── enums/                 # Enumerações globais
│   └── infraestrutura/
│       └── config/                # Configurações globais
│
├── autenticacao/                  # Microsserviço de Auth + Usuários
│   ├── dominio/
│   │   ├── entidade/              # Usuario, Role, RefreshToken
│   │   ├── repository/            # Interfaces JPA
│   │   ├── dto/                   # DTOs de auth
│   │   └── enums/                 # TipoUsuario, StatusUsuario
│   ├── aplicacao/                 # Casos de uso
│   ├── infraestrutura/            # Implementações técnicas
│   └── interfaces/rest/           # Controllers REST
│
├── sistema-orquestrador/          # Microsserviço Principal (Barbearias)
│   ├── dominio/
│   │   ├── entidade/              # Barbearia, Barbeiro, Servico, Agendamento
│   │   ├── repository/
│   │   ├── dto/
│   │   └── enums/
│   ├── aplicacao/
│   ├── infraestrutura/
│   └── interfaces/rest/
```

### 2.3 Arquitetura Frontend (Feature-Based + Standalone)

```
frontend/src/app/
├── core/                          # Singleton services, guards, interceptors
│   ├── auth/                      # AuthService, AuthGuard, AuthInterceptor
│   ├── config/                    # Configurações globais
│   └── services/                  # ApiService, StorageService
│
├── shared/                        # Componentes, pipes, diretivas reutilizáveis
│   ├── components/                # UI Components
│   ├── pipes/                     # Pipes de formatação
│   ├── directives/                # Diretivas customizadas
│   └── models/                    # Interfaces/Types compartilhados
│
├── features/                      # Módulos de funcionalidade
│   ├── auth/                      # Login, Registro
│   ├── home/                      # Home (diferente por role)
│   ├── admin/                     # Área do Admin (Dono de Barbearia)
│   ├── cliente/                   # Área do Cliente
│   ├── barbeiro/                  # Área do Barbeiro
│   ├── barbearia/                 # Tela pública da Barbearia (Multi-Tenant)
│   ├── mapa/                      # Mapa com geolocalização
│   └── perfil/                    # Perfil do usuário
```

---

## 3. Modelo de Dados

### 3.1 Diagrama ER Simplificado

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    USUARIO      │     │    BARBEARIA    │     │     SERVICO     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ nome            │     │ nome            │
│ senha_hash      │     │ descricao       │     │ descricao       │
│ nome            │     │ endereco        │     │ duracao_minutos │
│ telefone        │     │ latitude        │     │ preco           │
│ foto_url        │     │ longitude       │     │ barbearia_id(FK)│
│ tipo_usuario    │     │ foto_url        │     └─────────────────┘
│ ativo           │     │ tema_json       │              │
│ created_at      │     │ admin_id (FK)   │              │
│ updated_at      │     │ ativo           │              │
└─────────────────┘     │ created_at      │              │
        │               └─────────────────┘              │
        │                      │                         │
        │     ┌────────────────┼───────────────┐         │
        │     │                │               │         │
        ▼     ▼                ▼               ▼         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    BARBEIRO     │     │   AGENDAMENTO   │     │   FAVORITO      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ usuario_id (FK) │     │ cliente_id (FK) │     │ cliente_id (FK) │
│ barbearia_id(FK)│     │ barbeiro_id(FK) │     │ barbearia_id(FK)│
│ especialidades  │     │ servico_id (FK) │     │ barbeiro_id(FK) │
│ bio             │     │ data_hora       │     │ tipo            │
│ avaliacao_media │     │ status          │     │ created_at      │
│ ativo           │     │ observacoes     │     └─────────────────┘
│ latitude        │     │ created_at      │
│ longitude       │     └─────────────────┘
└─────────────────┘
```

### 3.2 Entidades Principais

#### Usuario

```java
public enum TipoUsuario {
    ADMIN,      // Dono de barbearia
    CLIENTE,    // Cliente final
    BARBEIRO    // Profissional barbeiro
}

public enum StatusUsuario {
    ATIVO, INATIVO, PENDENTE_VERIFICACAO
}
```

#### Barbearia (Tema JSON)

```json
{
    "corPrimaria": "#1a237e",
    "corSecundaria": "#c5cae9",
    "corTexto": "#ffffff",
    "logoUrl": "https://...",
    "bannerUrl": "https://...",
    "fontePrincipal": "Roboto"
}
```

#### Agendamento

```java
public enum StatusAgendamento {
    PENDENTE,
    CONFIRMADO,
    EM_ANDAMENTO,
    CONCLUIDO,
    CANCELADO_CLIENTE,
    CANCELADO_BARBEIRO,
    NAO_COMPARECEU
}
```

---

## 4. Funcionalidades por Perfil

### 4.1 Perfil ADMIN (Dono de Barbearia)

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard** | Visão geral de agendamentos, faturamento, avaliações |
| **Gerenciar Barbearia** | Editar dados, endereço, fotos, tema visual |
| **Gerenciar Barbeiros** | Aprovar/rejeitar solicitações, vincular/desvincular |
| **Gerenciar Serviços** | CRUD de serviços oferecidos |
| **Gerenciar Agendamentos** | Visualizar, confirmar, cancelar agendamentos |
| **Personalizar Tema** | Escolher cores, logo, banner |
| **Relatórios** | Relatórios de agendamentos e avaliações |

### 4.2 Perfil CLIENTE

| Funcionalidade | Descrição |
|----------------|-----------|
| **Listar Barbearias** | Ver todas as barbearias cadastradas |
| **Buscar/Filtrar** | Por nome, localização, avaliação |
| **Ver Barbearia** | Tela personalizada com tema do admin |
| **Mapa de Barbearias** | Geolocalização das barbearias próximas |
| **Mapa de Barbeiros** | Barbeiros próximos (autônomos ou vinculados) |
| **Favoritar** | Salvar barbearias e barbeiros favoritos |
| **Agendar** | Escolher serviço, barbeiro, data/hora |
| **Meus Agendamentos** | Histórico e próximos agendamentos |
| **Avaliar** | Avaliar barbearia e barbeiro após serviço |

### 4.3 Perfil BARBEIRO

| Funcionalidade | Descrição |
|----------------|-----------|
| **Cadastro Profissional** | Cadastrar-se como barbeiro |
| **Meu Perfil** | Bio, especialidades, fotos de trabalhos |
| **Vincular a Barbearia** | Solicitar vínculo a uma barbearia |
| **Minha Agenda** | Ver e gerenciar agendamentos |
| **Geolocalização** | Aparecer no mapa de barbeiros |
| **Estatísticas** | Ver avaliações e métricas |

---

## 5. Fases de Implementação

### 📅 Fase 1: Fundação (Semanas 1-3)

**Objetivo**: Estabelecer a base de autenticação e multi-role

#### Backend

- [ ] Criar entidades `Usuario`, `Role`, `RefreshToken`
- [ ] Implementar `TipoUsuario` (ADMIN, CLIENTE, BARBEIRO)
- [ ] Configurar Spring Security com JWT
- [ ] Implementar endpoints de autenticação
- [ ] Criar fluxo de registro diferenciado por tipo

#### Frontend

- [ ] Implementar tela de login unificada
- [ ] Criar seletor de tipo de conta no registro
- [ ] Implementar AuthGuard com verificação de role
- [ ] Criar interceptor para adicionar JWT
- [ ] Implementar storage seguro com Capacitor Preferences

#### Entregáveis

- Login funcional para Admin, Cliente e Barbeiro
- Registro com escolha de perfil
- Roteamento baseado em role

---

### 📅 Fase 2: Barbearias e Admin (Semanas 4-6)

**Objetivo**: Implementar gestão completa de barbearias

#### Backend

- [ ] Criar entidades `Barbearia`, `Servico`
- [ ] Implementar CRUD de Barbearia
- [ ] Implementar CRUD de Serviços
- [ ] Criar endpoint para tema/personalização
- [ ] Implementar upload de imagens (Cloud Storage)

#### Frontend

- [ ] Criar dashboard do Admin
- [ ] Implementar formulário de cadastro de barbearia
- [ ] Criar gestão de serviços
- [ ] Implementar editor de tema (cores, logo)
- [ ] Criar componente de upload de imagens

#### Entregáveis

- Admin pode cadastrar e gerenciar sua barbearia
- Serviços configuráveis com preço e duração
- Tema customizável

---

### 📅 Fase 3: Barbeiros (Semanas 7-8)

**Objetivo**: Implementar perfil e cadastro de barbeiros

#### Backend

- [ ] Criar entidade `Barbeiro`
- [ ] Implementar CRUD de Barbeiro
- [ ] Criar fluxo de solicitação de vínculo a barbearia
- [ ] Implementar aprovação/rejeição pelo Admin

#### Frontend

- [ ] Criar área do Barbeiro
- [ ] Implementar perfil profissional (bio, especialidades)
- [ ] Criar tela de solicitação de vínculo
- [ ] Implementar gestão de solicitações no Admin

#### Entregáveis

- Barbeiros podem se cadastrar
- Solicitação de vínculo a barbearias
- Admin aprova/rejeita barbeiros

---

### 📅 Fase 4: Área do Cliente (Semanas 9-11)

**Objetivo**: Implementar experiência completa do cliente

#### Backend

- [ ] Criar endpoint de listagem de barbearias (público)
- [ ] Implementar busca e filtros
- [ ] Criar endpoint de detalhes da barbearia com tema
- [ ] Implementar sistema de Favoritos

#### Frontend

- [ ] Criar listagem de barbearias
- [ ] Implementar busca e filtros
- [ ] Criar tela dinâmica da barbearia (multi-tenant)
- [ ] Implementar componente de tema dinâmico
- [ ] Criar tela de favoritos

#### Entregáveis

- Cliente vê lista de barbearias
- Tela personalizada por barbearia
- Sistema de favoritos funcional

---

### 📅 Fase 5: Geolocalização e Mapa (Semanas 12-14)

**Objetivo**: Implementar mapas e geolocalização

#### Backend

- [ ] Adicionar campos de latitude/longitude
- [ ] Implementar busca por proximidade (PostGIS)
- [ ] Criar endpoints geoespaciais

#### Frontend

- [ ] Integrar Google Maps API
- [ ] Criar componente de mapa reutilizável
- [ ] Implementar mapa de barbearias próximas
- [ ] Implementar mapa de barbeiros próximos
- [ ] Criar filtros por distância

#### Entregáveis

- Mapa interativo com barbearias
- Mapa de barbeiros autônomos/vinculados
- Filtro por proximidade

---

### 📅 Fase 6: Agendamentos (Semanas 15-18)

**Objetivo**: Sistema completo de agendamentos

#### Backend

- [ ] Criar entidade `Agendamento`
- [ ] Implementar CRUD de Agendamento
- [ ] Validar disponibilidade de horário
- [ ] Criar notificações de status
- [ ] Implementar cancelamento com regras

#### Frontend

- [ ] Criar fluxo de agendamento
- [ ] Implementar seleção de data/hora
- [ ] Criar calendário de disponibilidade
- [ ] Implementar tela de meus agendamentos
- [ ] Criar área de agenda do barbeiro

#### Entregáveis

- Cliente pode agendar serviços
- Barbeiro vê sua agenda
- Admin vê todos os agendamentos

---

### 📅 Fase 7: Avaliações e Finalização (Semanas 19-20)

**Objetivo**: Sistema de avaliações e polimento

#### Backend

- [ ] Criar entidade `Avaliacao`
- [ ] Implementar cálculo de média
- [ ] Criar endpoints de avaliação

#### Frontend

- [ ] Criar componente de estrelas
- [ ] Implementar fluxo de avaliação pós-serviço
- [ ] Exibir avaliações nas telas

#### Entregáveis

- Clientes podem avaliar
- Avaliações exibidas em barbearias e barbeiros
- Aplicativo completo e polido

---

## 6. Estrutura Backend

### 6.1 Módulo: kernel-compartilhado

```
kernel-compartilhado/src/main/java/com/reguamaxima/kernel/
├── dominio/
│   ├── dto/
│   │   ├── PaginacaoDTO.java
│   │   ├── RespostaDTO.java
│   │   └── ErroDTO.java
│   ├── exception/
│   │   ├── NegocioException.java
│   │   ├── RecursoNaoEncontradoException.java
│   │   └── AcessoNegadoException.java
│   └── enums/
│       └── MensagemErro.java
└── infraestrutura/
    ├── config/
    │   ├── CorsConfig.java
    │   ├── JacksonConfig.java
    │   └── OpenApiConfig.java
    └── handler/
        └── GlobalExceptionHandler.java
```

### 6.2 Módulo: autenticacao

```
autenticacao/src/main/java/com/reguamaxima/autenticacao/
├── dominio/
│   ├── entidade/
│   │   ├── Usuario.java
│   │   ├── Role.java
│   │   └── RefreshToken.java
│   ├── repository/
│   │   ├── UsuarioRepository.java
│   │   └── RefreshTokenRepository.java
│   ├── dto/
│   │   ├── LoginRequestDTO.java
│   │   ├── LoginResponseDTO.java
│   │   ├── RegistroRequestDTO.java
│   │   ├── RefreshTokenRequestDTO.java
│   │   └── UsuarioDTO.java
│   └── enums/
│       ├── TipoUsuario.java
│       └── StatusUsuario.java
├── aplicacao/
│   ├── ServicoAutenticacao.java
│   └── ServicoUsuario.java
├── infraestrutura/
│   ├── config/
│   │   └── SecurityConfig.java
│   └── security/
│       ├── JwtTokenProvider.java
│       ├── JwtAuthenticationFilter.java
│       └── UserDetailsServiceImpl.java
└── interfaces/rest/
    └── v1/
        ├── AuthAPI.java
        ├── UsuarioAPI.java
        └── controller/
            ├── AuthController.java
            └── UsuarioController.java
```

### 6.3 Módulo: sistema-orquestrador

```
sistema-orquestrador/src/main/java/com/reguamaxima/orquestrador/
├── dominio/
│   ├── entidade/
│   │   ├── Barbearia.java
│   │   ├── Barbeiro.java
│   │   ├── Servico.java
│   │   ├── Agendamento.java
│   │   ├── Favorito.java
│   │   └── Avaliacao.java
│   ├── repository/
│   │   ├── BarbeariaRepository.java
│   │   ├── BarbeiroRepository.java
│   │   ├── ServicoRepository.java
│   │   ├── AgendamentoRepository.java
│   │   ├── FavoritoRepository.java
│   │   └── AvaliacaoRepository.java
│   ├── dto/
│   │   ├── barbearia/
│   │   │   ├── BarbeariaDTO.java
│   │   │   ├── BarbeariaResumoDTO.java
│   │   │   ├── BarbeariaTemaDTO.java
│   │   │   └── CriarBarbeariaDTO.java
│   │   ├── barbeiro/
│   │   │   ├── BarbeiroDTO.java
│   │   │   ├── BarbeiroResumoDTO.java
│   │   │   └── VinculoBarbeiroDTO.java
│   │   ├── servico/
│   │   │   ├── ServicoDTO.java
│   │   │   └── CriarServicoDTO.java
│   │   ├── agendamento/
│   │   │   ├── AgendamentoDTO.java
│   │   │   ├── CriarAgendamentoDTO.java
│   │   │   └── DisponibilidadeDTO.java
│   │   └── avaliacao/
│   │       ├── AvaliacaoDTO.java
│   │       └── CriarAvaliacaoDTO.java
│   └── enums/
│       ├── StatusAgendamento.java
│       ├── TipoFavorito.java
│       └── StatusVinculo.java
├── aplicacao/
│   ├── ServicoBarbearia.java
│   ├── ServicoBarbeiro.java
│   ├── ServicoServico.java
│   ├── ServicoAgendamento.java
│   ├── ServicoFavorito.java
│   └── ServicoAvaliacao.java
├── infraestrutura/
│   ├── config/
│   │   └── GeolocationConfig.java
│   └── persistence/
│       └── (implementações customizadas)
└── interfaces/rest/
    └── v1/
        ├── BarbeariaAPI.java
        ├── BarbeiroAPI.java
        ├── ServicoAPI.java
        ├── AgendamentoAPI.java
        ├── FavoritoAPI.java
        ├── AvaliacaoAPI.java
        └── controller/
            ├── BarbeariaController.java
            ├── BarbeiroController.java
            ├── ServicoController.java
            ├── AgendamentoController.java
            ├── FavoritoController.java
            └── AvaliacaoController.java
```

---

## 7. Estrutura Frontend

### 7.1 Core

```
frontend/src/app/core/
├── auth/
│   ├── auth.service.ts         # Gerenciamento de autenticação
│   ├── auth.guard.ts           # Guard funcional para rotas protegidas
│   ├── auth.interceptor.ts     # Interceptor para adicionar JWT
│   └── role.guard.ts           # Guard para verificar roles específicas
├── config/
│   └── app.config.ts           # Configurações da aplicação
└── services/
    ├── api.service.ts          # Serviço base HTTP
    ├── storage.service.ts      # Wrapper para Capacitor Preferences
    ├── geolocation.service.ts  # Wrapper para Capacitor Geolocation
    └── toast.service.ts        # Serviço de notificações
```

### 7.2 Shared

```
frontend/src/app/shared/
├── components/
│   ├── header/                 # Header reutilizável
│   ├── loading/                # Spinner de loading
│   ├── empty-state/            # Estado vazio
│   ├── star-rating/            # Componente de estrelas
│   ├── map/                    # Componente de mapa
│   ├── avatar/                 # Avatar de usuário
│   ├── card-barbearia/         # Card de barbearia
│   ├── card-barbeiro/          # Card de barbeiro
│   └── theme-container/        # Container com tema dinâmico
├── pipes/
│   ├── currency-brl.pipe.ts    # Formatação de moeda
│   ├── phone.pipe.ts           # Formatação de telefone
│   └── distance.pipe.ts        # Formatação de distância
├── directives/
│   └── theme.directive.ts      # Diretiva para aplicar tema
└── models/
    ├── usuario.model.ts
    ├── barbearia.model.ts
    ├── barbeiro.model.ts
    ├── servico.model.ts
    ├── agendamento.model.ts
    ├── favorito.model.ts
    ├── avaliacao.model.ts
    ├── tema.model.ts
    └── geolocalizacao.model.ts
```

### 7.3 Features

```
frontend/src/app/features/
├── auth/
│   ├── login/
│   │   ├── login.page.ts
│   │   ├── login.page.html
│   │   └── login.page.scss
│   └── registrar/
│       ├── registrar.page.ts
│       ├── registrar.page.html
│       └── registrar.page.scss
│
├── admin/                       # Área do dono de barbearia
│   ├── dashboard/
│   │   ├── dashboard.page.ts
│   │   └── dashboard.page.html
│   ├── barbearia/
│   │   ├── editar/
│   │   └── tema/
│   ├── servicos/
│   │   ├── lista/
│   │   └── form/
│   ├── barbeiros/
│   │   ├── lista/
│   │   └── solicitacoes/
│   └── agendamentos/
│       └── lista/
│
├── cliente/                     # Área do cliente
│   ├── explorar/
│   │   ├── explorar.page.ts     # Lista de barbearias
│   │   └── explorar.page.html
│   ├── mapa/
│   │   ├── mapa-barbearias/
│   │   └── mapa-barbeiros/
│   ├── favoritos/
│   │   └── favoritos.page.ts
│   └── agendamentos/
│       └── meus-agendamentos.page.ts
│
├── barbeiro/                    # Área do barbeiro
│   ├── perfil/
│   │   └── meu-perfil.page.ts
│   ├── vincular/
│   │   └── vincular.page.ts
│   └── agenda/
│       └── minha-agenda.page.ts
│
├── barbearia/                   # Tela pública (multi-tenant)
│   ├── detalhes/
│   │   ├── detalhes.page.ts     # Carrega tema dinâmico
│   │   └── detalhes.page.html
│   ├── servicos/
│   │   └── servicos-lista.component.ts
│   ├── barbeiros/
│   │   └── barbeiros-lista.component.ts
│   └── agendar/
│       ├── agendar.page.ts
│       └── agendar.page.html
│
├── home/
│   └── home.page.ts             # Redireciona baseado na role
│
└── perfil/
    └── perfil.page.ts           # Perfil do usuário logado
```

### 7.4 Rotas Atualizadas

```typescript
// app.routes.ts
export const routes: Routes = [
    { path: '', redirectTo: 'tabs', pathMatch: 'full' },
    
    // Auth (público)
    { path: 'login', loadComponent: () => import('./features/auth/login/login.page') },
    { path: 'registrar', loadComponent: () => import('./features/auth/registrar/registrar.page') },
    
    // Barbearia pública (multi-tenant)
    { 
        path: 'barbearia/:slug',
        loadComponent: () => import('./features/barbearia/detalhes/detalhes.page'),
        children: [
            { path: 'agendar', loadComponent: () => import('./features/barbearia/agendar/agendar.page') }
        ]
    },
    
    // Área autenticada
    {
        path: 'tabs',
        loadComponent: () => import('./features/tabs/tabs.page'),
        canActivate: [authGuard],
        children: [
            // Rotas comuns
            { path: 'home', loadComponent: () => import('./features/home/home.page') },
            { path: 'perfil', loadComponent: () => import('./features/perfil/perfil.page') },
            
            // Rotas do Cliente
            { 
                path: 'explorar', 
                loadComponent: () => import('./features/cliente/explorar/explorar.page'),
                canActivate: [roleGuard(['CLIENTE'])]
            },
            { 
                path: 'mapa', 
                loadComponent: () => import('./features/cliente/mapa/mapa-barbearias/mapa-barbearias.page'),
                canActivate: [roleGuard(['CLIENTE'])]
            },
            { 
                path: 'favoritos', 
                loadComponent: () => import('./features/cliente/favoritos/favoritos.page'),
                canActivate: [roleGuard(['CLIENTE'])]
            },
            
            // Rotas do Admin
            { 
                path: 'admin',
                canActivate: [roleGuard(['ADMIN'])],
                children: [
                    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
                    { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.page') },
                    { path: 'barbearia', loadComponent: () => import('./features/admin/barbearia/editar/editar.page') },
                    { path: 'tema', loadComponent: () => import('./features/admin/barbearia/tema/tema.page') },
                    { path: 'servicos', loadComponent: () => import('./features/admin/servicos/lista/lista.page') },
                    { path: 'barbeiros', loadComponent: () => import('./features/admin/barbeiros/lista/lista.page') },
                    { path: 'agendamentos', loadComponent: () => import('./features/admin/agendamentos/lista/lista.page') }
                ]
            },
            
            // Rotas do Barbeiro
            { 
                path: 'barbeiro',
                canActivate: [roleGuard(['BARBEIRO'])],
                children: [
                    { path: '', redirectTo: 'agenda', pathMatch: 'full' },
                    { path: 'meu-perfil', loadComponent: () => import('./features/barbeiro/perfil/meu-perfil.page') },
                    { path: 'vincular', loadComponent: () => import('./features/barbeiro/vincular/vincular.page') },
                    { path: 'agenda', loadComponent: () => import('./features/barbeiro/agenda/minha-agenda.page') }
                ]
            },
            
            { path: '', redirectTo: 'home', pathMatch: 'full' }
        ]
    },
    
    { path: '**', redirectTo: 'tabs' }
];
```

---

## 8. APIs RESTful

### 8.1 Auth API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| POST | `/api/v1/auth/login` | Login | Público |
| POST | `/api/v1/auth/registrar` | Registro | Público |
| POST | `/api/v1/auth/refresh` | Renovar token | Autenticado |
| POST | `/api/v1/auth/logout` | Logout | Autenticado |
| GET | `/api/v1/auth/me` | Dados do usuário logado | Autenticado |

### 8.2 Barbearia API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/barbearias` | Listar barbearias | Público |
| GET | `/api/v1/barbearias/:id` | Detalhes + tema | Público |
| GET | `/api/v1/barbearias/slug/:slug` | Detalhes por slug | Público |
| GET | `/api/v1/barbearias/proximas` | Barbearias próximas | Autenticado |
| POST | `/api/v1/barbearias` | Criar barbearia | ADMIN |
| PUT | `/api/v1/barbearias/:id` | Atualizar barbearia | ADMIN |
| PUT | `/api/v1/barbearias/:id/tema` | Atualizar tema | ADMIN |
| DELETE | `/api/v1/barbearias/:id` | Desativar barbearia | ADMIN |

### 8.3 Barbeiro API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/barbeiros` | Listar barbeiros | Público |
| GET | `/api/v1/barbeiros/:id` | Detalhes do barbeiro | Público |
| GET | `/api/v1/barbeiros/proximos` | Barbeiros próximos | Autenticado |
| GET | `/api/v1/barbeiros/barbearia/:id` | Barbeiros da barbearia | Público |
| POST | `/api/v1/barbeiros` | Criar perfil barbeiro | BARBEIRO |
| PUT | `/api/v1/barbeiros/:id` | Atualizar perfil | BARBEIRO |
| POST | `/api/v1/barbeiros/solicitar-vinculo` | Solicitar vínculo | BARBEIRO |
| PUT | `/api/v1/barbeiros/:id/aprovar` | Aprovar vínculo | ADMIN |
| PUT | `/api/v1/barbeiros/:id/rejeitar` | Rejeitar vínculo | ADMIN |

### 8.4 Serviço API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/servicos/barbearia/:id` | Serviços da barbearia | Público |
| POST | `/api/v1/servicos` | Criar serviço | ADMIN |
| PUT | `/api/v1/servicos/:id` | Atualizar serviço | ADMIN |
| DELETE | `/api/v1/servicos/:id` | Remover serviço | ADMIN |

### 8.5 Agendamento API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/agendamentos/meus` | Meus agendamentos | Autenticado |
| GET | `/api/v1/agendamentos/barbeiro/:id` | Agenda do barbeiro | BARBEIRO/ADMIN |
| GET | `/api/v1/agendamentos/barbearia/:id` | Agendamentos da barbearia | ADMIN |
| GET | `/api/v1/agendamentos/disponibilidade` | Horários disponíveis | Autenticado |
| POST | `/api/v1/agendamentos` | Criar agendamento | CLIENTE |
| PUT | `/api/v1/agendamentos/:id/confirmar` | Confirmar | ADMIN/BARBEIRO |
| PUT | `/api/v1/agendamentos/:id/cancelar` | Cancelar | Autenticado |
| PUT | `/api/v1/agendamentos/:id/concluir` | Concluir | ADMIN/BARBEIRO |

### 8.6 Favorito API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/favoritos` | Meus favoritos | CLIENTE |
| POST | `/api/v1/favoritos/barbearia/:id` | Favoritar barbearia | CLIENTE |
| POST | `/api/v1/favoritos/barbeiro/:id` | Favoritar barbeiro | CLIENTE |
| DELETE | `/api/v1/favoritos/:id` | Remover favorito | CLIENTE |

### 8.7 Avaliação API

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/avaliacoes/barbearia/:id` | Avaliações da barbearia | Público |
| GET | `/api/v1/avaliacoes/barbeiro/:id` | Avaliações do barbeiro | Público |
| POST | `/api/v1/avaliacoes` | Criar avaliação | CLIENTE |

---

## 9. Segurança e RBAC

### 9.1 Configuração Spring Security

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/barbearias/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/barbeiros/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/servicos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/avaliacoes/**").permitAll()
                
                // Endpoints protegidos
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/barbeiro/**").hasRole("BARBEIRO")
                .requestMatchers("/api/v1/cliente/**").hasRole("CLIENTE")
                
                // Demais endpoints requerem autenticação
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### 9.2 Role Guard no Frontend

```typescript
// core/auth/role.guard.ts
export function roleGuard(allowedRoles: string[]): CanActivateFn {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);
        
        const userRoles = authService.getUserRoles();
        const hasRole = allowedRoles.some(role => userRoles.includes(role));
        
        if (hasRole) {
            return true;
        }
        
        // Redirecionar para página adequada baseada na role
        const userRole = userRoles[0];
        if (userRole === 'ADMIN') {
            return router.createUrlTree(['/tabs/admin/dashboard']);
        } else if (userRole === 'BARBEIRO') {
            return router.createUrlTree(['/tabs/barbeiro/agenda']);
        } else {
            return router.createUrlTree(['/tabs/explorar']);
        }
    };
}
```

---

## 10. Geolocalização e Mapeamento

### 10.1 Capacitor Geolocation

```typescript
// core/services/geolocation.service.ts
import { Injectable, signal } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
    private _currentPosition = signal<Position | null>(null);
    currentPosition = this._currentPosition.asReadonly();
    
    async getCurrentPosition(): Promise<Position> {
        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
        });
        this._currentPosition.set(position);
        return position;
    }
    
    async watchPosition(callback: (position: Position) => void): Promise<string> {
        return await Geolocation.watchPosition(
            { enableHighAccuracy: true },
            (position, err) => {
                if (position) {
                    this._currentPosition.set(position);
                    callback(position);
                }
            }
        );
    }
    
    async clearWatch(watchId: string): Promise<void> {
        await Geolocation.clearWatch({ id: watchId });
    }
}
```

### 10.2 Consulta por Proximidade (PostgreSQL + PostGIS)

```java
// BarbeariaRepository.java
@Query(value = """
    SELECT b.*, 
           ST_Distance(
               ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::geography,
               ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
           ) as distancia
    FROM barbearia b
    WHERE b.ativo = true
      AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :raioMetros
      )
    ORDER BY distancia
    """, nativeQuery = true)
List<Object[]> findProximas(
    @Param("latitude") Double latitude,
    @Param("longitude") Double longitude,
    @Param("raioMetros") Double raioMetros
);
```

### 10.3 Componente de Mapa

```typescript
// shared/components/map/map.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';

@Component({
    selector: 'app-map',
    standalone: true,
    template: `
        <div id="map" class="map-container"></div>
    `
})
export class MapComponent {
    @Input() markers = signal<MapMarker[]>([]);
    @Input() center = signal<{ lat: number; lng: number } | null>(null);
    @Output() markerClick = new EventEmitter<MapMarker>();
    
    // Integração com Google Maps API
}

export interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    icon?: string;
    data?: any;
}
```

---

## 11. Temas e Personalização

### 11.1 Modelo de Tema

```typescript
// shared/models/tema.model.ts
export interface Tema {
    corPrimaria: string;
    corSecundaria: string;
    corTexto: string;
    corFundo: string;
    logoUrl?: string;
    bannerUrl?: string;
    fontePrincipal: string;
}

export const TEMA_PADRAO: Tema = {
    corPrimaria: '#1a237e',
    corSecundaria: '#c5cae9',
    corTexto: '#ffffff',
    corFundo: '#f5f5f5',
    fontePrincipal: 'Roboto'
};
```

### 11.2 Diretiva de Tema

```typescript
// shared/directives/theme.directive.ts
import { Directive, Input, ElementRef, OnChanges } from '@angular/core';
import { Tema, TEMA_PADRAO } from '../models/tema.model';

@Directive({
    selector: '[appTheme]',
    standalone: true
})
export class ThemeDirective implements OnChanges {
    @Input('appTheme') tema: Tema | null = null;
    
    constructor(private el: ElementRef) {}
    
    ngOnChanges(): void {
        const t = this.tema ?? TEMA_PADRAO;
        const style = this.el.nativeElement.style;
        
        style.setProperty('--ion-color-primary', t.corPrimaria);
        style.setProperty('--ion-color-secondary', t.corSecundaria);
        style.setProperty('--ion-text-color', t.corTexto);
        style.setProperty('--ion-background-color', t.corFundo);
        style.setProperty('--font-family', t.fontePrincipal);
    }
}
```

### 11.3 Tela da Barbearia (Multi-Tenant)

```typescript
// features/barbearia/detalhes/detalhes.page.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ThemeDirective } from '../../../shared/directives/theme.directive';
import { BarbeariaService } from '../services/barbearia.service';
import { Barbearia } from '../../../shared/models/barbearia.model';

@Component({
    selector: 'app-barbearia-detalhes',
    standalone: true,
    imports: [ThemeDirective, IonContent, ...],
    template: `
        <ion-content [appTheme]="barbearia()?.tema">
            @if (barbearia(); as b) {
                <!-- Banner -->
                <div class="banner" [style.backgroundImage]="'url(' + b.tema?.bannerUrl + ')'">
                    <img [src]="b.tema?.logoUrl" class="logo" />
                    <h1>{{ b.nome }}</h1>
                </div>
                
                <!-- Serviços -->
                <app-servicos-lista [servicos]="b.servicos" />
                
                <!-- Barbeiros -->
                <app-barbeiros-lista [barbeiros]="b.barbeiros" />
                
                <!-- Avaliações -->
                <app-avaliacoes [avaliacoes]="b.avaliacoes" />
            }
        </ion-content>
    `
})
export class DetalhesPage implements OnInit {
    private route = inject(ActivatedRoute);
    private barbeariaService = inject(BarbeariaService);
    
    barbearia = signal<Barbearia | null>(null);
    
    ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
            this.barbeariaService.buscarPorSlug(slug)
                .subscribe(b => this.barbearia.set(b));
        }
    }
}
```

---

## 12. Checklist de Implementação

### ✅ Fase 1: Fundação

#### Backend

- [x] Entidade `Usuario` com campos completos
- [x] Enum `TipoUsuario` (ADMIN, CLIENTE, BARBEIRO)
- [x] Entidade `Role` para permissões
- [x] `UsuarioRepository` com métodos customizados
- [x] `JwtTokenProvider` para geração/validação JWT
- [x] `SecurityConfig` com endpoints por role
- [x] `ServicoAutenticacao` com login, registro, refresh
- [x] `AuthController` com endpoints REST
- [ ] Testes unitários de autenticação

#### Frontend

- [x] `AuthService` com signals
- [x] `authGuard` funcional
- [x] `authInterceptor` funcional
- [x] `roleGuard` para verificar roles
- [x] Tela de login atualizada
- [x] Tela de registro com seleção de tipo
- [x] `StorageService` com Capacitor Preferences
- [ ] Testes de autenticação

---

### ✅ Fase 2: Barbearias e Admin

#### Backend

- [x] Entidade `Barbearia` com tema JSON
- [x] Entidade `Servico` vinculada a barbearia
- [x] `BarbeariaRepository` com queries customizadas
- [x] `ServicoRepository`
- [x] `ServicoBarbearia` com CRUD
- [x] `ServicoServico` com CRUD
- [x] `BarbeariaController` com endpoints REST
- [ ] Upload de imagens para Cloud Storage
- [ ] Testes unitários

#### Frontend

- [x] Feature module `admin`
- [x] Dashboard com métricas
- [x] Formulário de barbearia
- [x] Gestão de serviços (CRUD)
- [x] Editor de tema visual
- [ ] Upload de logo e banner
- [x] Validações de formulário

---

### ✅ Fase 3: Barbeiros

#### Backend

- [x] Entidade `Barbeiro` vinculada a Usuario e Barbearia
- [x] Enum `StatusVinculo`
- [x] `BarbeiroRepository`
- [x] `ServicoBarbeiro` com lógica de vínculo
- [x] `BarbeiroController`
- [ ] Testes unitários

#### Frontend

- [x] Feature module `barbeiro`
- [x] Formulário de perfil profissional
- [x] Tela de solicitação de vínculo
- [x] Lista de barbearias para vincular
- [x] Tela de solicitações no Admin
- [x] Aprovação/rejeição de barbeiros

---

### ✅ Fase 4: Área do Cliente

#### Backend

- [ ] Endpoint de listagem pública
- [ ] Busca com filtros
- [ ] Entidade `Favorito`
- [ ] `FavoritoRepository`
- [ ] `ServicoFavorito`
- [ ] `FavoritoController`
- [ ] Testes unitários

#### Frontend

- [ ] Feature module `cliente`
- [ ] Tela de explorar barbearias
- [ ] Busca e filtros
- [ ] Tela dinâmica da barbearia (tema)
- [ ] Sistema de favoritos
- [ ] Cards de barbearia reutilizáveis

---

### ✅ Fase 5: Geolocalização

#### Backend

- [ ] Configurar PostGIS no PostgreSQL
- [ ] Campos de geolocalização
- [ ] Queries espaciais
- [ ] Endpoints de proximidade

#### Frontend

- [ ] Integrar Google Maps API
- [ ] Componente de mapa reutilizável
- [ ] Mapa de barbearias
- [ ] Mapa de barbeiros
- [ ] Filtros por distância
- [ ] Geolocation Service com Capacitor

---

### ✅ Fase 6: Agendamentos

#### Backend

- [ ] Entidade `Agendamento`
- [ ] Enum `StatusAgendamento`
- [ ] `AgendamentoRepository`
- [ ] `ServicoAgendamento` com validações
- [ ] Verificação de disponibilidade
- [ ] Notificações de mudança de status
- [ ] Testes unitários

#### Frontend

- [ ] Fluxo de agendamento
- [ ] Seletor de data/hora
- [ ] Calendário de disponibilidade
- [ ] Meus agendamentos (cliente)
- [ ] Minha agenda (barbeiro)
- [ ] Gestão de agendamentos (admin)

---

### ✅ Fase 7: Avaliações

#### Backend

- [x] Entidade `Avaliacao`
- [x] `AvaliacaoRepository`
- [x] Cálculo de média
- [x] `ServicoAvaliacao`
- [x] `AvaliacaoController`

#### Frontend

- [x] Componente de estrelas (`StarRatingComponent`)
- [x] Fluxo de avaliação pós-serviço (`AvaliarPage`)
- [x] Exibição de avaliações (`AvaliacoesBarbeariaPage`)
- [x] Média de avaliações nos cards (integrado na `BarbeariaPublicaPage`)
- [x] Minhas avaliações (`MinhasAvaliacoesPage`)

---

## 📝 Observações Finais

### Padrões a Seguir (Conforme regras-desenvolvimento)

1. **Clean Architecture**: Separação em dominio/aplicacao/infraestrutura/interfaces
2. **DDD**: Entidades ricas com comportamento no domínio
3. **Standalone Components**: Padrão no Angular 20+
4. **Signals**: Para estado reativo no frontend
5. **Zoneless**: Para melhor performance
6. **JWT Stateless**: Autenticação sem estado no backend
7. **RBAC**: Controle de acesso baseado em roles
8. **OWASP**: Seguir práticas de segurança

### Prioridades

1. **Segurança primeiro**: Implementar auth completo antes de outras features
2. **Multi-tenancy**: Garantir isolamento de dados entre barbearias
3. **Performance**: Lazy loading, paginação, caching
4. **UX Mobile**: Telas responsivas, feedback visual, offline-first

---

> **Documento criado em**: 04/01/2026  
> **Próxima revisão**: Após conclusão da Fase 1
