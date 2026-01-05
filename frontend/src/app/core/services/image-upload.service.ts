import { Injectable } from '@angular/core';

/**
 * Opções de redimensionamento de imagem.
 */
export interface ImageResizeOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number; // 0-1
    format: 'jpeg' | 'png' | 'webp';
}

/**
 * Resultado do processamento de imagem.
 */
export interface ProcessedImage {
    base64: string;
    mimeType: string;
    width: number;
    height: number;
    sizeKb: number;
}

/**
 * Serviço para upload e processamento de imagens.
 * Redimensiona no cliente e converte para base64.
 */
@Injectable({
    providedIn: 'root'
})
export class ImageUploadService {

    private readonly defaultOptions: ImageResizeOptions = {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.8,
        format: 'jpeg'
    };

    /**
     * Processa arquivo de imagem: redimensiona e converte para base64.
     */
    async processImage(
        file: File,
        options: Partial<ImageResizeOptions> = {}
    ): Promise<ProcessedImage> {
        const opts = { ...this.defaultOptions, ...options };

        // Validar tipo de arquivo
        if (!this.isValidImageType(file)) {
            throw new Error('Tipo de arquivo inválido. Use PNG, JPG ou WEBP.');
        }

        // Validar tamanho (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Arquivo muito grande. Máximo 10MB.');
        }

        // Carregar imagem
        const image = await this.loadImage(file);

        // Calcular dimensões mantendo proporção
        const { width, height } = this.calculateDimensions(
            image.width,
            image.height,
            opts.maxWidth,
            opts.maxHeight
        );

        // Redimensionar usando canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Não foi possível criar contexto de canvas');
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(image, 0, 0, width, height);

        // Converter para base64
        const mimeType = `image/${opts.format}`;
        const base64 = canvas.toDataURL(mimeType, opts.quality);

        // Calcular tamanho aproximado
        const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

        return {
            base64,
            mimeType,
            width,
            height,
            sizeKb
        };
    }

    /**
     * Processa imagem para foto de perfil (200x200, formato quadrado).
     */
    async processProfilePhoto(file: File): Promise<ProcessedImage> {
        return this.processImage(file, {
            maxWidth: 200,
            maxHeight: 200,
            quality: 0.85,
            format: 'jpeg'
        });
    }

    /**
     * Abre seletor de arquivo e retorna o arquivo selecionado.
     */
    openFileSelector(accept = 'image/png,image/jpeg,image/webp'): Promise<File | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;

            input.onchange = () => {
                const file = input.files?.[0] || null;
                resolve(file);
            };

            input.oncancel = () => resolve(null);
            input.click();
        });
    }

    /**
     * Verifica se o tipo de arquivo é válido.
     */
    private isValidImageType(file: File): boolean {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        return validTypes.includes(file.type);
    }

    /**
     * Carrega imagem de um arquivo.
     */
    private loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Erro ao carregar imagem'));
                img.src = reader.result as string;
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Calcula dimensões mantendo proporção.
     */
    private calculateDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number
    ): { width: number; height: number } {
        let width = originalWidth;
        let height = originalHeight;

        // Se for menor que o máximo, centralizar com crop quadrado
        if (width <= maxWidth && height <= maxHeight) {
            const size = Math.min(width, height);
            return { width: size, height: size };
        }

        // Calcular proporção
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        return { width, height };
    }
}
