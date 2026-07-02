'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Idea } from '../lib/types';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapSectionProps {
  ideas: Idea[];
  onMapClick: (latitude: number, longitude: number) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function normalizeNumericCharacters(value: string) {
  return value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

function normalizeGsiQuery(value: string) {
  const normalized = normalizeNumericCharacters(value.trim());

  return normalized
    .replace(/〒/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([都道府県])(?=\S)/g, '$1')
    .replace(/([都道府県])(.+?)(市|区|町|村)(?=\S)/g, '$1$2$3')
    .replace(/([0-9]+)丁目/g, '$1丁目')
    .replace(/([0-9]+)番/g, '$1番')
    .replace(/([0-9]+)号/g, '$1号')
    .trim();
}

function createSearchGeocoder() {
  const fallbackGeocoder = (L.Control as any).Geocoder?.nominatim?.();

  return {
    geocode(query: string, cb: (results: any[], status: string) => void) {
      const term = typeof query === 'string' ? normalizeGsiQuery(query) : '';
      if (!term) {
        cb([], 'NOT_FOUND');
        return;
      }

      fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(term)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`GSI API error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const results = data.map((item: any) => ({
              name: item.properties?.title ?? item.properties?.address ?? term,
              html: item.properties?.title ?? item.properties?.address ?? term,
              center: L.latLng(item.geometry.coordinates[1], item.geometry.coordinates[0]),
              bbox: Array.isArray(item.bbox) && item.bbox.length === 4
                ? L.latLngBounds(
                    L.latLng(item.bbox[1], item.bbox[0]),
                    L.latLng(item.bbox[3], item.bbox[2]),
                  )
                : undefined,
            }));
            cb(results, 'OK');
            return;
          }

          if (fallbackGeocoder?.geocode) {
            fallbackGeocoder.geocode(query, cb);
          } else {
            cb([], 'NOT_FOUND');
          }
        })
        .catch(() => {
          if (fallbackGeocoder?.geocode) {
            fallbackGeocoder.geocode(query, cb);
          } else {
            cb([], 'NOT_FOUND');
          }
        });
    },
    reverse(location: L.LatLng, scale: number, cb: (results: any[], status: string) => void) {
      if (fallbackGeocoder?.reverse) {
        fallbackGeocoder.reverse(location, scale, cb);
      } else {
        cb([], 'NOT_FOUND');
      }
    },
  };
}

function GeocoderControl() {
  const map = useMap();

  useEffect(() => {
    const control = L.Control.geocoder({
      defaultMarkGeocode: true,
      geocoder: createSearchGeocoder(),
      placeholder: '住所・地名を検索',
    });

    control.on('markgeocode', (event: any) => {
      const { center } = event.geocode;
      if (center) {
        map.setView(center, 16, { animate: true });
      }
    });

    control.addTo(map);

    const button = map.getContainer().querySelector('.leaflet-control-geocoder-icon');
    if (button instanceof HTMLButtonElement) {
      button.textContent = '検索';
      button.setAttribute('aria-label', '検索');
    }

    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

export default function MapSection({ ideas, onMapClick }: MapSectionProps) {
  useEffect(() => {
    L.Marker.prototype.options.icon = markerIcon;
  }, []);

  const [mapType, setMapType] = useState<'normal' | 'satellite'>('normal');

  const tileConfig =
    mapType === 'normal'
      ? {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
        }
      : {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
        };

  return (
    <div>
      <div
        style={{
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setMapType('normal')}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: mapType === 'normal' ? '#111827' : 'white',
            color: mapType === 'normal' ? 'white' : 'inherit',
            cursor: 'pointer',
          }}
          aria-label="通常地図"
        >
          通常
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: mapType === 'satellite' ? '#111827' : 'white',
            color: mapType === 'satellite' ? 'white' : 'inherit',
            cursor: 'pointer',
          }}
          aria-label="航空写真"
        >
          航空
        </button>
      </div>

      <MapContainer
        center={[35.68, 139.76]}
        zoom={14}
        scrollWheelZoom={false}
        className="leaflet-container"
        style={{ width: '100%', minHeight: '420px' }}
      >
        <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />
        <GeocoderControl />
        <ClickHandler onMapClick={onMapClick} />
        {ideas.map((idea) => (
          <Marker key={idea.id} position={[idea.latitude, idea.longitude]} icon={markerIcon}>
            <Popup>
              <strong>{idea.posName}</strong>
              <div>{idea.mainTxt.slice(0, 80)}{idea.mainTxt.length > 80 ? '...' : ''}</div>
              <div>{idea.latitude},{idea.longitude}</div>
              <button onClick={() => navigator.clipboard.writeText(`https://www.google.com/maps?q=${idea.latitude},${idea.longitude}`)}>
                コピーする
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
