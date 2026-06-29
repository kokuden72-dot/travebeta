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
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    L.Marker.prototype.options.icon = markerIcon;
  }, []);

  const tileLayer =
    mapStyle === 'satellite'
      ? {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
          subdomains: ['server'],
        }
      : {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
          subdomains: ['a', 'b', 'c'],
        };

  return (
    <div>
      <div className="map-controls">
        <button
          type="button"
          className={mapStyle === 'standard' ? 'active' : ''}
          onClick={() => setMapStyle('standard')}
        >
          通常地図
        </button>
        <button
          type="button"
          className={mapStyle === 'satellite' ? 'active' : ''}
          onClick={() => setMapStyle('satellite')}
        >
          航空地図
        </button>
      </div>
      <MapContainer
        center={[35.68, 139.76]}
        zoom={13}
        scrollWheelZoom={false}
        className="leaflet-container"
        style={{ width: '100%', minHeight: '420px' }}
      >
        <TileLayer {...tileLayer} />
        <ClickHandler onMapClick={onMapClick} />
        {ideas.map((idea) => (
          <Marker key={idea.id} position={[idea.latitude, idea.longitude]} icon={markerIcon}>
            <Popup>
              <strong>{idea.posName}</strong>
              <div>{idea.mainTxt.slice(0, 80)}{idea.mainTxt.length > 80 ? '...' : ''}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
