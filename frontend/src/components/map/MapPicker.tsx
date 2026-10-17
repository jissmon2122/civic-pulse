import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lon: number) => void;
  className?: string;
}

const pickerIcon = L.divIcon({
  className: 'picker-marker-icon',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(14,124,134,0.4));">
        <path d="M16 2C9.925 2 5 6.925 5 13C5 20.875 16 30 16 30C16 30 27 20.875 27 13C27 6.925 22.075 2 16 2Z" fill="#0E7C86" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="16" cy="13" r="5" fill="#F5A524"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Click handler on map
const MapClickHandler: React.FC<{ onLocationPicked: (lat: number, lon: number) => void }> = ({
  onLocationPicked,
}) => {
  useMapEvents({
    click(e) {
      onLocationPicked(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    },
  });
  return null;
};

const PanToCoordinate: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(coords);
  }, [coords, map]);
  return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  onChange,
  className = 'h-72 w-full',
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        onChange(lat, lon);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please tap the map directly to place your pin.');
        } else {
          setGeoError('Unable to retrieve location. Please tap the map to place your pin.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-surface">
      <div className={`relative ${className}`}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <PanToCoordinate coords={[latitude, longitude]} />
          <MapClickHandler onLocationPicked={onChange} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Marker position={[latitude, longitude]} icon={pickerIcon} />
        </MapContainer>

        {/* Floating "Use Current Location" button */}
        <div className="absolute top-3 right-3 z-[400]">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUseCurrentLocation}
            isLoading={isLocating}
            leftIcon={<Navigation size={14} className="text-primary" />}
            className="bg-surface/95 backdrop-blur-sm shadow-subtle border-border"
          >
            Locate Me
          </Button>
        </div>

        {/* Coordinate indicator pill */}
        <div className="absolute bottom-3 left-3 z-[400] bg-surface/90 backdrop-blur-sm border border-border px-3 py-1.5 rounded-xl shadow-subtle flex items-center gap-2 text-xs">
          <MapPin size={14} className="text-primary" />
          <span className="font-mono text-text-primary font-medium">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
          <span className="text-text-secondary text-[11px]">(Click map to move pin)</span>
        </div>
      </div>

      {geoError && (
        <div className="p-2.5 bg-status-review-tint text-xs text-status-review border-t border-border font-medium">
          {geoError}
        </div>
      )}
    </div>
  );
};
