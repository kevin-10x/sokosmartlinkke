declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        fitBounds(bounds: LatLngBounds, padding?: number): void;
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }
      class Marker {
        constructor(opts?: MarkerOptions);
        setMap(map: Map | null): void;
        addListener(eventName: string, handler: Function): MapsEventListener;
      }
      class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        setContent(content: string): void;
        open(map?: Map, anchor?: Marker): void;
        close(): void;
      }
      class LatLngBounds {
        constructor(sw?: LatLng, ne?: LatLng);
        extend(point: LatLng | LatLngLiteral): void;
      }
      class LatLng {
        constructor(lat: number, lng: number, noWrap?: boolean);
      }
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        styles?: MapTypeStyle[];
      }
      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        icon?: Icon | string;
        animation?: Animation;
      }
      interface InfoWindowOptions {
        content?: string;
      }
      interface Icon {
        path: SymbolPath;
        fillColor: string;
        fillOpacity: number;
        strokeColor: string;
        strokeWeight: number;
        scale: number;
      }
      interface MapTypeStyle {
        featureType?: string;
        elementType?: string;
        stylers?: any[];
      }
      interface MapsEventListener { remove(): void; }
      enum Animation { DROP, BOUNCE }
      enum SymbolPath { CIRCLE, BACKWARD_CLOSED_ARROW, BACKWARD_OPEN_ARROW, FORWARD_CLOSED_ARROW, FORWARD_OPEN_ARROW }
      namespace places {
        class AutocompleteService {
          getPlacePredictions(request: any, callback: (predictions: any[], status: any) => void): void;
        }
        class PlacesService {
          constructor(attrContainer: HTMLDivElement | Map);
          getDetails(request: any, callback: (result: any, status: any) => void): void;
        }
      }
      namespace geometry {
        namespace spherical {
          function computeDistanceBetween(from: LatLng, to: LatLng, radius?: number): number;
        }
      }
    }
  }
}

export {};