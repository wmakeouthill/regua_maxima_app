import { Component, Output, EventEmitter, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  IonItem, IonInput, IonList, IonIcon, IonLabel, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, searchOutline, closeCircleOutline, mapOutline } from 'ionicons/icons';
import { GoogleMapsService, PlaceResult, GeoLocation } from '../../../core/services/google-maps.service';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap, catchError } from 'rxjs/operators';
import { Observable, of, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-endereco-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonItem, IonInput, IonList, IonIcon, IonLabel, IonSpinner
  ],
  template: `
    <div class="autocomplete-container">
      <ion-item lines="full" class="search-input">
        <ion-icon name="search-outline" slot="start" color="medium"></ion-icon>
        <ion-input
          [formControl]="searchControl"
          [label]="label"
          labelPlacement="floating"
          [placeholder]="placeholder"
          [clearInput]="true"
          debounce="300"
        ></ion-input>
        @if (loading) {
          <ion-spinner name="dots" slot="end" color="primary"></ion-spinner>
        }
      </ion-item>

      @if (predictions$ | async; as predictions) {
        @if (predictions.length > 0) {
          <ion-list class="predictions-list">
            @for (place of predictions; track place.place_id) {
              <ion-item button (click)="selecionarLugar(place)" lines="full" detail="false">
                <ion-icon name="location-outline" slot="start" color="medium"></ion-icon>
                <ion-label>
                  <h3>{{ place.structured_formatting.main_text }}</h3>
                  <p>{{ place.structured_formatting.secondary_text }}</p>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        }
      }
    </div>
  `,
  styles: [`
    .autocomplete-container {
      position: relative;
      z-index: 1000;
    }
    
    .predictions-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-height: 250px;
      overflow-y: auto;
      z-index: 1001;
      margin-top: -1px;
      padding: 0;
    }

    ion-item {
        --background: white;
    }
  `]
})
export class EnderecoAutocompleteComponent implements OnInit {
  private googleMapsService = inject(GoogleMapsService);

  @Input() label = 'Buscar Endereço';
  @Input() placeholder = 'Digite rua, número, bairro...';

  @Output() localizacaoSelecionada = new EventEmitter<GeoLocation>();

  searchControl = new FormControl('');

  // Usando BehaviorSubject para controle manual das previsões
  private predictionsSubject = new BehaviorSubject<PlaceResult[]>([]);
  predictions$ = this.predictionsSubject.asObservable();

  loading = false;

  constructor() {
    addIcons({ locationOutline, searchOutline, closeCircleOutline, mapOutline });

    // Setup da busca
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.loading = true),
      switchMap(term => {
        if (!term || term.length < 3) {
          return of([]);
        }
        return this.googleMapsService.searchPlaces(term).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe({
      next: (results) => {
        this.loading = false;
        this.predictionsSubject.next(results);
      },
      error: () => {
        this.loading = false;
        this.predictionsSubject.next([]);
      }
    });
  }

  ngOnInit() { }

  selecionarLugar(place: PlaceResult) {
    // Atualiza input com endereço completo e limpa previsões
    this.searchControl.setValue(place.description, { emitEvent: false });
    this.predictionsSubject.next([]); // Limpa a lista

    this.loading = true;
    this.googleMapsService.getPlaceDetails(place.place_id).subscribe({
      next: (location) => {
        this.loading = false;
        this.localizacaoSelecionada.emit(location);
      },
      error: () => this.loading = false
    });
  }
}
