import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardContent, IonIcon, IonButton, IonBadge, IonSpinner,
    IonRefresher, IonRefresherContent, IonButtons,
    IonList, IonItem, IonLabel, IonSearchbar,
    IonItemSliding, IonItemOptions, IonItemOption,
    IonModal, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    cubeOutline, addOutline, removeOutline, createOutline,
    trashOutline, alertCircleOutline, closeOutline, checkmarkOutline
} from 'ionicons/icons';

/**
 * Interface para produto do estoque
 */
interface ProdutoEstoque {
    id: string;
    nome: string;
    categoria: string;
    quantidade: number;
    estoqueMinimo: number;
    precoCusto: number;
    precoVenda: number;
}

/**
 * Interface para formulário de produto
 */
interface FormProduto {
    nome: string;
    categoria: string;
    quantidade: number;
    estoqueMinimo: number;
    precoCusto: number;
    precoVenda: number;
}

/**
 * Página de Gestão de Estoque do Admin.
 * CRUD de produtos com alertas de estoque baixo.
 */
@Component({
    selector: 'app-gestao-estoque',
    standalone: true,
    imports: [
        FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
        IonCardContent, IonIcon, IonButton, IonBadge, IonSpinner,
        IonRefresher, IonRefresherContent, IonButtons,
        IonList, IonItem, IonLabel, IonSearchbar,
        IonItemSliding, IonItemOptions, IonItemOption,
        IonModal, IonInput
    ],
    templateUrl: './gestao-estoque.page.html',
    styleUrl: './gestao-estoque.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestaoEstoquePage implements OnInit {
    // Estado
    readonly carregando = signal(false);
    readonly produtos = signal<ProdutoEstoque[]>([]);
    readonly mostrarModalProduto = signal(false);
    readonly produtoEditando = signal<ProdutoEstoque | null>(null);

    // Busca
    termoBusca = '';

    // Formulário
    formProduto: FormProduto = this.criarFormVazio();

    // Computed
    readonly produtosFiltrados = computed(() => {
        const termo = this.termoBusca.toLowerCase();
        if (!termo) return this.produtos();
        return this.produtos().filter(p =>
            p.nome.toLowerCase().includes(termo) ||
            p.categoria.toLowerCase().includes(termo)
        );
    });

    readonly produtosEstoqueBaixo = computed(() =>
        this.produtos().filter(p => p.quantidade <= p.estoqueMinimo)
    );

    constructor() {
        addIcons({
            cubeOutline, addOutline, removeOutline, createOutline,
            trashOutline, alertCircleOutline, closeOutline, checkmarkOutline
        });
    }

    ngOnInit(): void {
        this.carregarProdutos();
    }

    carregarProdutos(): void {
        this.carregando.set(true);

        // TODO: Integrar com EstoqueService real
        setTimeout(() => {
            this.produtos.set([
                { id: '1', nome: 'Pomada Modeladora', categoria: 'Finalizadores', quantidade: 12, estoqueMinimo: 5, precoCusto: 25, precoVenda: 45 },
                { id: '2', nome: 'Óleo para Barba', categoria: 'Barba', quantidade: 8, estoqueMinimo: 3, precoCusto: 18, precoVenda: 35 },
                { id: '3', nome: 'Shampoo Anticaspa', categoria: 'Cabelo', quantidade: 3, estoqueMinimo: 5, precoCusto: 22, precoVenda: 40 },
                { id: '4', nome: 'Cera Matte', categoria: 'Finalizadores', quantidade: 15, estoqueMinimo: 5, precoCusto: 20, precoVenda: 38 },
                { id: '5', nome: 'Balm para Barba', categoria: 'Barba', quantidade: 2, estoqueMinimo: 3, precoCusto: 30, precoVenda: 55 }
            ]);
            this.carregando.set(false);
        }, 500);
    }

    handleRefresh(event: CustomEvent): void {
        this.carregarProdutos();
        setTimeout(() => {
            (event.target as HTMLIonRefresherElement).complete();
        }, 500);
    }

    filtrar(): void {
        // Computed faz a filtragem automaticamente
    }

    criarFormVazio(): FormProduto {
        return {
            nome: '',
            categoria: '',
            quantidade: 0,
            estoqueMinimo: 5,
            precoCusto: 0,
            precoVenda: 0
        };
    }

    abrirModalNovoProduto(): void {
        this.produtoEditando.set(null);
        this.formProduto = this.criarFormVazio();
        this.mostrarModalProduto.set(true);
    }

    editarProduto(produto: ProdutoEstoque): void {
        this.produtoEditando.set(produto);
        this.formProduto = { ...produto };
        this.mostrarModalProduto.set(true);
    }

    fecharModalProduto(): void {
        this.mostrarModalProduto.set(false);
        this.produtoEditando.set(null);
    }

    salvarProduto(): void {
        if (!this.formProduto.nome || !this.formProduto.categoria) return;

        if (this.produtoEditando()) {
            // Editar
            this.produtos.update(lista =>
                lista.map(p => p.id === this.produtoEditando()!.id
                    ? { ...p, ...this.formProduto }
                    : p
                )
            );
        } else {
            // Criar
            const novoProduto: ProdutoEstoque = {
                id: Date.now().toString(),
                ...this.formProduto
            };
            this.produtos.update(lista => [...lista, novoProduto]);
        }

        this.fecharModalProduto();
    }

    excluirProduto(produto: ProdutoEstoque): void {
        // TODO: Confirmar antes de excluir
        this.produtos.update(lista => lista.filter(p => p.id !== produto.id));
    }

    aumentarQuantidade(produto: ProdutoEstoque, event: Event): void {
        event.stopPropagation();
        this.produtos.update(lista =>
            lista.map(p => p.id === produto.id
                ? { ...p, quantidade: p.quantidade + 1 }
                : p
            )
        );
    }

    diminuirQuantidade(produto: ProdutoEstoque, event: Event): void {
        event.stopPropagation();
        if (produto.quantidade <= 0) return;
        this.produtos.update(lista =>
            lista.map(p => p.id === produto.id
                ? { ...p, quantidade: p.quantidade - 1 }
                : p
            )
        );
    }
}
