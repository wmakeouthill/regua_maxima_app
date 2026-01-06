import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map, switchMap, tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface PlaceResult {
    description: string;
    place_id: string;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

export interface GeoLocation {
    lat: number;
    lng: number;
    address?: string;
    cidade?: string;
    estado?: string;
    bairro?: string;
    cep?: string;
}

@Injectable({
    providedIn: 'root'
})
export class GoogleMapsService {
    private httpClient = inject(HttpClient);
    private apiLoaded$ = new BehaviorSubject<boolean>(false);
    private _apiLoading$: Observable<boolean>;

    constructor() {
        this._apiLoading$ = this.loadApi().pipe(shareReplay(1));
    }

    /**
     * Loads the Google Maps JavaScript API with necessary libraries.
     */
    loadApi(): Observable<boolean> {
        if (this.apiLoaded$.value) {
            return of(true);
        }

        // Check if google is already loaded globally
        if (typeof google === 'object' && typeof google.maps === 'object') {
            this.apiLoaded$.next(true);
            return of(true);
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&language=pt-BR`;
        script.async = true;
        script.defer = true;

        const loadPromise = new Promise<boolean>((resolve, reject) => {
            script.onload = () => {
                this.apiLoaded$.next(true);
                resolve(true);
            };
            script.onerror = (error) => reject(error);
        });

        document.body.appendChild(script);

        return from(loadPromise);
    }

    /**
     * Returns observable that emits when API is ready
     */
    get isApiLoaded$(): Observable<boolean> {
        return this._apiLoading$;
    }

    /**
     * Geocodes an address to coordinates
     */
    geocodeAddress(address: string): Observable<GeoLocation> {
        return this.isApiLoaded$.pipe(
            switchMap(() => {
                return new Observable<GeoLocation>(observer => {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                            const location = results[0].geometry.location;
                            observer.next({
                                lat: location.lat(),
                                lng: location.lng(),
                                address: results[0].formatted_address
                            });
                            observer.complete();
                        } else {
                            observer.error(new Error(`Geocoding failed: ${status}`));
                        }
                    });
                });
            })
        );
    }

    /**
     * Reverse geocoding (coordinates to address)
     */
    reverseGeocode(lat: number, lng: number): Observable<string> {
        return this.isApiLoaded$.pipe(
            switchMap(() => {
                return new Observable<string>(observer => {
                    const geocoder = new google.maps.Geocoder();
                    const latlng = { lat, lng };
                    geocoder.geocode({ location: latlng }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                            observer.next(results[0].formatted_address);
                            observer.complete();
                        } else {
                            observer.error(new Error(`Reverse geocoding failed: ${status}`));
                        }
                    });
                });
            })
        );
    }

    /**
     * Search for places (Autocomplete)
     */
    searchPlaces(input: string): Observable<PlaceResult[]> {
        if (!input || input.length < 3) return of([]);

        return this.isApiLoaded$.pipe(
            switchMap(() => {
                return new Observable<PlaceResult[]>(observer => {
                    const service = new google.maps.places.AutocompleteService();
                    service.getPlacePredictions({
                        input,
                        componentRestrictions: { country: 'br' },
                        types: ['address'] // or 'establishment', 'geocode'
                    }, (predictions, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            const results = predictions.map(p => ({
                                description: p.description,
                                place_id: p.place_id,
                                structured_formatting: {
                                    main_text: p.structured_formatting.main_text,
                                    secondary_text: p.structured_formatting.secondary_text
                                }
                            }));
                            observer.next(results);
                            observer.complete();
                        } else {
                            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                observer.next([]);
                                observer.complete();
                            } else {
                                observer.error(status);
                            }
                        }
                    });
                });
            })
        );
    }

    /**
     * Get place details (coordinates) from place_id
     */
    getPlaceDetails(placeId: string): Observable<GeoLocation> {
        return this.isApiLoaded$.pipe(
            switchMap(() => {
                return new Observable<GeoLocation>(observer => {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ placeId }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                            const location = results[0].geometry.location;
                            const components = results[0].address_components;

                            // Parse address components
                            let cidade = '';
                            let estado = '';
                            let bairro = '';
                            let cep = '';

                            for (const comp of components) {
                                if (comp.types.includes('administrative_area_level_2')) {
                                    cidade = comp.long_name;
                                }
                                if (comp.types.includes('administrative_area_level_1')) {
                                    estado = comp.short_name; // UF como SP, RJ
                                }
                                if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')) {
                                    bairro = comp.long_name;
                                }
                                if (comp.types.includes('postal_code')) {
                                    cep = comp.long_name;
                                }
                                // Fallback for cidade in locality
                                if (comp.types.includes('locality') && !cidade) {
                                    cidade = comp.long_name;
                                }
                            }

                            observer.next({
                                lat: location.lat(),
                                lng: location.lng(),
                                address: results[0].formatted_address,
                                cidade,
                                estado,
                                bairro,
                                cep
                            });
                            observer.complete();
                        } else {
                            observer.error(new Error(`Place details failed: ${status}`));
                        }
                    });
                });
            })
        );
    }

    /**
     * Get current position from browser/device
     */
    getCurrentPosition(): Promise<GeoLocation> {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => reject(error)
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    }
}
