'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Idea } from '../lib/types';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';
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

function GeocoderControl() {
  const map = useMap();

  useEffect(() => {
    const control = L.Control.geocoder({
      defaultMarkGeocode: true,
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
