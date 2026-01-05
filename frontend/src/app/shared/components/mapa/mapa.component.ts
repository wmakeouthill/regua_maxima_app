import { Component, Input, Output, EventEmitter, inject, ViewChild, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, MapInfoWindow } from '@angular/google-maps';
import { GoogleMapsService } from '../../../core/services/google-maps.service';
import { Observable } from 'rxjs';

export interface MapMarkerOptions {
    position: google.maps.LatLngLiteral;
    title?: string;
    label?: string;
    options?: google.maps.MarkerOptions;
    infoWindowContent?: string;
}

@Component({
    selector: 'app-mapa',
    standalone: true,
    imports: [CommonModule, GoogleMap, MapMarker, MapInfoWindow],
    template: `
    @if (apiLoaded$ | async) {
      <div class="map-container">
        <google-map
          [center]="center"
          [zoom]="zoom"
          [width]="width"
          [height]="height"
          [options]="mapOptions"
          (mapClick)="onMapClick($event)"
        >
          @for (marker of markers; track marker.position.lat + ',' + marker.position.lng) {
            <map-marker
              [position]="marker.position"
              [title]="marker.title || ''"
              [label]="marker.label || ''"
              [options]="marker.options"
              (mapClick)="onMarkerClick(marker, markerRef)"
              #markerRef="mapMarker"
            >
            </map-marker>
            
            <!-- Info Window (only if content exists) -->
            @if (marker.infoWindowContent) {
               <map-info-window [position]="marker.position">{{ marker.infoWindowContent }}</map-info-window>
            }
          }
        </google-map>
      </div>
    } @else {
      <div class="map-loading">
        <p>Carregando mapa...</p>
      </div>
    }
  `,
    styles: [`
    .map-container {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
    .map-loading {
      width: 100%;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      color: #666;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapaComponent implements OnChanges {
    private googleMapsService = inject(GoogleMapsService);
    apiLoaded$: Observable<boolean> = this.googleMapsService.isApiLoaded$;

    @Input() center: google.maps.LatLngLiteral = { lat: -23.550520, lng: -46.633308 }; // SP default
    @Input() zoom = 14;
    @Input() width = '100%';
    @Input() height = '300px';
    @Input() markers: MapMarkerOptions[] = [];
    @Input() draggable = false;

    @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
    @Output() markerClick = new EventEmitter<MapMarkerOptions>();

    // Map Options
    mapOptions: google.maps.MapOptions = {
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
    };

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['draggable'] && this.markers.length > 0) {
            // If Draggable changes, we might want to update marker options
            // But usually we set draggable on individual markers.
            // This input is a shortcut to make ALL markers draggable? Or maybe just the main one.
            // For now let's assume markers are configured via Input() markers options.
        }
    }

    onMapClick(event: google.maps.MapMouseEvent): void {
        if (event.latLng) {
            this.mapClick.emit(event.latLng.toJSON());
        }
    }

    onMarkerClick(marker: MapMarkerOptions, markerRef: MapMarker): void {
        this.markerClick.emit(marker);
        // If we want info window, we can open it here using ViewChild Reference
        // But for simplicity let's just emit.
    }
}
