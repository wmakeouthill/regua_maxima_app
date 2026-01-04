/**
 * Interfaces e tipos para Barbeiros.
 * Fase 3 - Barbeiros
 */

// ========== Status de Vínculo ==========

export type StatusVinculo = 'SEM_VINCULO' | 'PENDENTE' | 'APROVADO' | 'REJEITADO';

// ========== Interfaces ==========

/**
 * Barbeiro completo (para perfil e detalhes).
 */
export interface Barbeiro {
    id: number;
    usuarioId: number;
    nomeUsuario: string;
    emailUsuario: string;
    nomeProfissional: string;
    nomeExibicao: string;
    bio: string;
    especialidades: string;
    anosExperiencia: number;
    fotoUrl: string;
    portfolioUrls: string; // JSON array
    latitude: number;
    longitude: number;
    visivelMapa: boolean;
    telefone: string;
    whatsapp: string;
    instagram: string;
    barbeariaId: number | null;
    barbeariaNome: string | null;
    statusVinculo: StatusVinculo;
    dataSolicitacaoVinculo: string;
    avaliacaoMedia: number;
    totalAvaliacoes: number;
    totalAtendimentos: number;
    ativo: boolean;
    perfilCompleto: boolean;
    dataCriacao: string;
    dataAtualizacao: string;
}

/**
 * Barbeiro resumido (para listagens e mapa).
 */
export interface BarbeiroResumo {
    id: number;
    nome: string;
    fotoUrl: string;
    especialidades: string;
    latitude: number;
    longitude: number;
    avaliacaoMedia: number;
    totalAvaliacoes: number;
    vinculado: boolean;
    barbeariaId: number | null;
    barbeariaNome: string | null;
}

// ========== DTOs ==========

/**
 * DTO para criar perfil de barbeiro.
 */
export interface CriarBarbeiroDTO {
    nomeProfissional?: string;
    bio?: string;
    especialidades?: string;
    anosExperiencia?: number;
    fotoUrl?: string;
    latitude?: number;
    longitude?: number;
    visivelMapa?: boolean;
    telefone?: string;
    whatsapp?: string;
    instagram?: string;
}

/**
 * DTO para atualizar perfil de barbeiro.
 */
export interface AtualizarBarbeiroDTO {
    nomeProfissional?: string;
    bio?: string;
    especialidades?: string;
    anosExperiencia?: number;
    fotoUrl?: string;
    portfolioUrls?: string;
    latitude?: number;
    longitude?: number;
    visivelMapa?: boolean;
    telefone?: string;
    whatsapp?: string;
    instagram?: string;
}

// ========== Constantes ==========

/**
 * Lista de especialidades comuns.
 */
export const ESPECIALIDADES_BARBEIRO = [
    'Corte Clássico',
    'Degradê',
    'Navalhado',
    'Barba',
    'Desenhos',
    'Pigmentação',
    'Corte Infantil',
    'Relaxamento',
    'Tranças',
    'Dreadlocks',
    'Coloração',
    'Platinado',
    'Luzes',
    'Alisamento',
    'Hidratação'
];

/**
 * Status de vínculo para exibição.
 */
export const STATUS_VINCULO_LABEL: Record<StatusVinculo, string> = {
    'SEM_VINCULO': 'Autônomo',
    'PENDENTE': 'Aguardando aprovação',
    'APROVADO': 'Vinculado',
    'REJEITADO': 'Rejeitado'
};

/**
 * Cores para status de vínculo.
 */
export const STATUS_VINCULO_COR: Record<StatusVinculo, string> = {
    'SEM_VINCULO': 'medium',
    'PENDENTE': 'warning',
    'APROVADO': 'success',
    'REJEITADO': 'danger'
};
