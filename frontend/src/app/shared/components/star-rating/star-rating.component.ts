import {
    Component,
    Input,
    Output,
    EventEmitter,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

// ========================================================
// Régua Máxima - Componente Star Rating
// ========================================================
// Componente reutilizável para exibição e seleção de estrelas.
// Pode ser usado em modo readonly (exibição) ou interativo.
// ========================================================

@Component({
    selector: 'app-star-rating',
    standalone: true,
    imports: [CommonModule, IonicModule],
    template: `
    <div
      class="star-rating"
      [class.readonly]="readonly"
      [class.interactive]="!readonly"
      [class.size-small]="size === 'small'"
      [class.size-medium]="size === 'medium'"
      [class.size-large]="size === 'large'"
    >
      @for (star of stars(); track star.index) {
        <ion-icon
          [name]="star.icon"
          [class.filled]="star.filled"
          [class.half]="star.half"
          [style.color]="getStarColor(star.index)"
          (click)="!readonly && selectRating(star.index)"
          (mouseenter)="!readonly && onHover(star.index)"
          (mouseleave)="!readonly && onLeave()"
        ></ion-icon>
      }

      @if (showValue && currentValue() > 0) {
        <span class="rating-value" [style.color]="valueColor">
          {{ formatValue(currentValue()) }}
        </span>
      }

      @if (showCount && totalCount > 0) {
        <span class="rating-count">
          ({{ totalCount }})
        </span>
      }
    </div>
  `,
    styles: [`
    .star-rating {
      display: inline-flex;
      align-items: center;
      gap: 2px;

      ion-icon {
        transition: transform 0.15s ease, color 0.15s ease;
      }

      &.size-small ion-icon {
        font-size: 14px;
      }

      &.size-medium ion-icon {
        font-size: 20px;
      }

      &.size-large ion-icon {
        font-size: 28px;
      }

      &.interactive ion-icon {
        cursor: pointer;

        &:hover {
          transform: scale(1.2);
        }
      }

      &.readonly ion-icon {
        cursor: default;
      }

      .rating-value {
        margin-left: 6px;
        font-weight: 600;
        font-size: 0.9em;
      }

      .rating-count {
        margin-left: 4px;
        color: var(--ion-color-medium);
        font-size: 0.8em;
      }

      .filled {
        color: var(--star-color, #FFD700);
      }

      .half {
        position: relative;
      }
    }
  `],
})
export class StarRatingComponent {
    // Inputs
    @Input() value: number = 0;
    @Input() maxStars: number = 5;
    @Input() readonly: boolean = true;
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() showValue: boolean = false;
    @Input() showCount: boolean = false;
    @Input() totalCount: number = 0;
    @Input() allowHalf: boolean = true;
    @Input() starColor: string = '#FFD700';
    @Input() emptyColor: string = '#D3D3D3';
    @Input() valueColor: string = '';

    // Output
    @Output() ratingChange = new EventEmitter<number>();

    // State
    private readonly _hoverValue = signal<number | null>(null);

    // Computed value (usa hover se disponível, senão usa value)
    readonly currentValue = computed(() => {
        const hover = this._hoverValue();
        return hover !== null ? hover : this.value;
    });

    // Gera array de estrelas
    readonly stars = computed(() => {
        const value = this.currentValue();
        const result: Array<{ index: number; icon: string; filled: boolean; half: boolean }> = [];

        for (let i = 1; i <= this.maxStars; i++) {
            const filled = i <= Math.floor(value);
            const half = !filled && this.allowHalf && value >= i - 0.5 && value < i;
            const icon = filled ? 'star' : (half ? 'star-half' : 'star-outline');

            result.push({ index: i, icon, filled: filled || half, half });
        }

        return result;
    });

    // Handlers
    selectRating(index: number): void {
        if (this.readonly) return;

        // Toggle: se clicar na mesma estrela, permite meia estrela
        let newValue = index;
        if (this.allowHalf && this.value === index) {
            newValue = index - 0.5;
        } else if (this.allowHalf && this.value === index - 0.5) {
            newValue = index;
        }

        this.ratingChange.emit(newValue);
    }

    onHover(index: number): void {
        if (this.readonly) return;
        this._hoverValue.set(index);
    }

    onLeave(): void {
        if (this.readonly) return;
        this._hoverValue.set(null);
    }

    getStarColor(index: number): string {
        const value = this.currentValue();
        if (index <= value) {
            return this.starColor;
        }
        return this.emptyColor;
    }

    formatValue(value: number): string {
        if (Number.isInteger(value)) {
            return value.toString() + '.0';
        }
        return value.toFixed(1);
    }
}
