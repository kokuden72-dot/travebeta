'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Idea } from '../lib/types';

const DEFAULT_PIN_COLOR = '#3388ff';

function createMarkerIcon(color: string) {
  return new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="custom-marker" style="background:${color};border:2px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 0 0 4px rgba(0,0,0,0.12)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -20],
  });
}

function createImageIcon(iconUrl: string) {
  return new L.Icon({
    iconUrl,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -20],
    className: 'custom-image-icon',
  });
}

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

  const markers = useMemo(
    () =>
      ideas.map((idea) => ({
        ...idea,
        icon: idea.icon ? createImageIcon(idea.icon) : createMarkerIcon(idea.color || DEFAULT_PIN_COLOR),
      })),
    [ideas],
  );

  useEffect(() => {
    L.Marker.prototype.options.icon = createMarkerIcon(DEFAULT_PIN_COLOR);
  }, []);

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
        {markers.map((idea) => (
          <Marker key={idea.id} position={[idea.latitude, idea.longitude]} icon={idea.icon}>
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
