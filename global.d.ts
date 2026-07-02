import * as L from 'leaflet';

declare module '*.css';

declare module 'leaflet' {
  namespace Control {
    function geocoder(options?: any): any;
  }
}