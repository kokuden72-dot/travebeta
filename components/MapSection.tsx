'use client';

import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Idea } from '../lib/types';

const markerIconUrls: Record<string, { iconUrl: string; iconRetinaUrl: string }> = {
  blue: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  },
  red: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  },
  green: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  },
  orange: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  },
  violet: {
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  },
};

const markerShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const createMarkerIcon = (color: keyof typeof markerIconUrls) =>
  new L.Icon({
    iconUrl: markerIconUrls[color].iconUrl,
    iconRetinaUrl: markerIconUrls[color].iconRetinaUrl,
    shadowUrl: markerShadowUrl,
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
  const [markerColor, setMarkerColor] = useState<'blue' | 'red' | 'green' | 'orange' | 'violet'>('blue');

  useEffect(() => {
    L.Marker.prototype.options.icon = createMarkerIcon(markerColor);
  }, [markerColor]);

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
      <div className="map-controls">
        <button
          type="button"
          className={markerColor === 'blue' ? 'active' : ''}
          onClick={() => setMarkerColor('blue')}
        >
          青ピン
        </button>
        <button
          type="button"
          className={markerColor === 'red' ? 'active' : ''}
          onClick={() => setMarkerColor('red')}
        >
          赤ピン
        </button>
        <button
          type="button"
          className={markerColor === 'green' ? 'active' : ''}
          onClick={() => setMarkerColor('green')}
        >
          緑ピン
        </button>
        <button
          type="button"
          className={markerColor === 'orange' ? 'active' : ''}
          onClick={() => setMarkerColor('orange')}
        >
          橙ピン
        </button>
        <button
          type="button"
          className={markerColor === 'violet' ? 'active' : ''}
          onClick={() => setMarkerColor('violet')}
        >
          紫ピン
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
          <Marker key={idea.id} position={[idea.latitude, idea.longitude]} icon={createMarkerIcon(markerColor)}>
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
