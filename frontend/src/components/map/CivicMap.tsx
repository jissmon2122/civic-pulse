import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ReportStatus, PriorityLevel } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityChip } from '../common/PriorityChip';

export interface MapReportPin {
  id: string;
  public_reference: string;
  title: string;
  category_name?: string;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  priority_level: PriorityLevel;
}

interface CivicMapProps {
  reports: MapReportPin[];
  selectedReportId?: string;
  onSelectReport?: (reportId: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Custom SVG marker pin generator based on status color
const createCustomIcon = (status: ReportStatus, isSelected: boolean) => {
  let color = '#0E7C86'; // default primary
  if (status === 'RESOLVED') color = '#2E8B57';
  if (status === 'IN_PROGRESS' || status === 'ASSIGNED') color = '#2F6FDE';
  if (status === 'UNDER_REVIEW' || status === 'NEEDS_INFORMATION') color = '#D98E04';
  if (status === 'REOPENED') color = '#D64545';
  if (status === 'CLOSED' || status === 'REJECTED') color = '#7B8794';

  const size = isSelected ? 38 : 30;

  const svgHtml = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      ${isSelected ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${color}33; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
        <path d="M16 2C9.925 2 5 6.925 5 13C5 20.875 16 30 16 30C16 30 27 20.875 27 13C27 6.925 22.075 2 16 2Z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="16" cy="13" r="4.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svgHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const CivicMap: React.FC<CivicMapProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  center = [12.9716, 77.5946],
  zoom = 13,
  className = 'h-[500px] w-full',
}) => {
  const selectedReport = reports.find((r) => r.id === selectedReportId);
  const activeCenter: [number, number] = selectedReport
    ? [selectedReport.latitude, selectedReport.longitude]
    : center;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border shadow-card ${className}`}>
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeMapView center={activeCenter} zoom={selectedReport ? 15 : zoom} />

        {/* Daylight Tile Layer with attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {reports.map((report) => {
          const isSelected = report.id === selectedReportId;
          const icon = createCustomIcon(report.status, isSelected);

          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectReport?.(report.id),
              }}
            >
              <Popup>
                <div className="p-1 space-y-1.5 max-w-[240px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-text-secondary font-semibold">
                      #{report.public_reference}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                  </div>
                  <h4 className="font-heading font-bold text-xs text-text-primary line-clamp-2">
                    {report.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary">
                    {report.category_name || 'Civic Issue'}
                  </p>
                  <div className="pt-1 flex items-center justify-between border-t border-border/60">
                    <PriorityChip level={report.priority_level} />
                    <button
                      onClick={() => onSelectReport?.(report.id)}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      View Details &rarr;
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
