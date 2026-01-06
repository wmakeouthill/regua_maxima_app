/**
 * Interface completa de Barbearia.
 */
export interface Barbearia {
    id: number;
    slug: string;
    nome: string;
    descricao?: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    emailContato?: string;
    sobre?: string;
    bairro?: string;
    instagram?: string;
    fotoUrl?: string;
    bannerUrl?: string;
    logoUrl?: string;
    temaConfig?: string;
    adminId?: number;
    adminNome?: string;
    ativo: boolean;
    avaliacaoMedia: number;
    totalAvaliacoes: number;
    dataCriacao: string;
    servicos?: Servico[];
}

/**
 * Interface resumida para listagens.
 */
export interface BarbeariaResumo {
    id: number;
    slug: string;
    nome: string;
    descricao?: string;
    endereco?: string;
    cidade: string;
    estado: string;
    latitude?: number;
    longitude?: number;
    fotoUrl?: string;
    logoUrl?: string;
    ativo: boolean;
    avaliacaoMedia: number;
    totalAvaliacoes: number;
    quantidadeBarbeiros?: number;
    distanciaKm?: number;
    bairro?: string;
    // Status da sessão de trabalho (aberta/pausada/fechada)
    aberta?: boolean;
    statusSessao?: 'ABERTA' | 'PAUSADA' | 'FECHADA';
}

/**
 * Interface de Serviço da barbearia.
 */
export interface Servico {
    id: number;
    nome: string;
    descricao?: string;
    duracaoMinutos: number;
    duracaoFormatada: string;
    preco: number;
    precoFormatado: string;
    icone?: string;
    ordemExibicao: number;
    barbeariaId?: number;
    barbeariaNome?: string;
}

/**
 * DTO para criar barbearia.
 */
export interface CriarBarbeariaDTO {
    nome: string;
    descricao?: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    instagram?: string;
}

/**
 * DTO para atualizar barbearia.
 */
export interface AtualizarBarbeariaDTO {
    nome?: string;
    descricao?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    instagram?: string;
    fotoUrl?: string;
    bannerUrl?: string;
    logoUrl?: string;
}

/**
 * Configuração de tema da barbearia.
 */
export interface BarbeariaTema {
    corPrimaria: string;
    corSecundaria: string;
    corFundo: string;
    corTexto: string;
    corDestaque: string;
    fonteFamilia: string;
    modoEscuro: boolean;
}

/**
 * Tema padrão.
 */
export const TEMA_PADRAO: BarbeariaTema = {
    corPrimaria: '#1E3A5F',
    corSecundaria: '#2E5077',
    corFundo: '#FFFFFF',
    corTexto: '#333333',
    corDestaque: '#D4AF37',
    fonteFamilia: 'Roboto',
    modoEscuro: false
};

/**
 * DTO para criar serviço.
 */
export interface CriarServicoDTO {
    nome: string;
    descricao?: string;
    duracaoMinutos: number;
    preco: number;
    icone?: string;
    ordemExibicao?: number;
}

/**
 * DTO para atualizar serviço.
 */
export interface AtualizarServicoDTO {
    nome?: string;
    descricao?: string;
    duracaoMinutos?: number;
    preco?: number;
    icone?: string;
    ordemExibicao?: number;
    ativo?: boolean;
}

/**
 * Resposta paginada.
 */
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

/**
 * Lista de estados brasileiros.
 */
export const ESTADOS_BR = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
];

/**
 * Ícones disponíveis para serviços.
 */
export const ICONES_SERVICOS = [
    { value: 'cut-outline', label: 'Tesoura' },
    { value: 'color-wand-outline', label: 'Varinha' },
    { value: 'water-outline', label: 'Água' },
    { value: 'brush-outline', label: 'Pincel' },
    { value: 'sparkles-outline', label: 'Brilho' },
    { value: 'flame-outline', label: 'Chama' },
    { value: 'hand-left-outline', label: 'Mão' },
    { value: 'body-outline', label: 'Corpo' },
    { value: 'man-outline', label: 'Homem' },
    { value: 'happy-outline', label: 'Sorriso' }
];
