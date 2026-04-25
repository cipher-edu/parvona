import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Nanny } from '../../api/types';
import { formatHourlyRate, SKILL_LABELS } from '../../api/nannies';

// Leaflet default icon fix (Vite/webpack asset path issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const verifiedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ nannies }: { nannies: Nanny[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = nannies.filter(n => n.latitude && n.longitude)
      .map(n => [n.latitude!, n.longitude!] as [number, number]);
    if (pts.length > 0) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
    }
  }, [nannies, map]);
  return null;
}

interface NannyMapProps {
  nannies: Nanny[];
  onSelect: (n: Nanny) => void;
}

export function NannyMap({ nannies, onSelect }: NannyMapProps) {
  const withGeo = nannies.filter(n => n.latitude && n.longitude);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 h-[520px]">
      <MapContainer
        center={[40.1, 65.3]}
        zoom={6}
        className="h-full w-full"
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds nannies={withGeo} />
        {withGeo.map(n => (
          <Marker
            key={n.id}
            position={[n.latitude!, n.longitude!]}
            icon={n.is_verified ? verifiedIcon : new L.Icon.Default()}
          >
            <Popup minWidth={200}>
              <div className="py-1">
                <div className="font-bold text-slate-900 text-sm">{n.user.name}</div>
                <div className="text-xs text-slate-500 mb-1">{n.location_name}</div>
                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="text-amber-600 font-semibold">⭐ {parseFloat(n.rating).toFixed(1)}</span>
                  <span className="text-purple-700 font-bold">{formatHourlyRate(n.hourly_rate)}/soat</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(n.skills as string[]).slice(0, 2).map(s => (
                    <span key={s} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                      {SKILL_LABELS[s] || s}
                    </span>
                  ))}
                </div>
                {n.is_verified && (
                  <span className="text-[10px] text-green-600 font-semibold">✓ Tasdiqlangan</span>
                )}
                <button
                  onClick={() => onSelect(n)}
                  className="mt-2 w-full text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-2 py-1 transition-colors"
                >
                  Batafsil
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {withGeo.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-400">Xaritada ko'rsatiladigan enagalar yo'q</p>
        </div>
      )}
    </div>
  );
}
