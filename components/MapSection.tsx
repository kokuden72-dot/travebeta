'use client';

import { useEffect } from 'react';
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

  return (
    <MapContainer
      center={[35.68, 139.76]}
      zoom={13}
      scrollWheelZoom={false}
      className="leaflet-container"
      style={{ width: '100%', minHeight: '420px' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <ClickHandler onMapClick={onMapClick} />
      {ideas.map((idea) => (
        <Marker key={idea.id} position={[idea.latitude, idea.longitude]} icon={markerIcon}>
          <Popup>
            <strong>{idea.posName}</strong>
            <div>{idea.mainTxt.slice(0, 80)}{idea.mainTxt.length > 80 ? '...' : ''}</div>
            <div>{idea.latitude},{idea.longitude}</div>
            <button id="btn">コピーする</button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
