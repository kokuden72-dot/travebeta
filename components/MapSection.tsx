'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Idea } from '../lib/types';

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
    <MapContainer
      center={[35.68, 139.76]}
      zoom={13}
      scrollWheelZoom={false}
      className="leaflet-container"
      style={{ width: '100%', minHeight: '420px', position: 'relative' }}
    >
      <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
          background: 'rgba(255,255,255,0.9)',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          gap: 6,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      >
        <button
          type="button"
          onClick={() => setMapType('normal')}
          style={{
            padding: '6px 8px',
            borderRadius: 4,
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
            padding: '6px 8px',
            borderRadius: 4,
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
  );
}
