"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createMarkerLeafletIcon } from "./mapMarkerIcons";

/** Marker görselleri — daire çerçeve + gölge. */
const CUSTOM_MARKER_CSS = `
.map-custom-marker,
.map-stock-marker {
  border-radius: 50% !important;
  box-shadow: 0 2px 6px rgba(0,0,0,.35) !important;
}
.map-custom-marker {
  border: 3px solid #FF6A00 !important;
  background: #fff !important;
  object-fit: cover !important;
}
.map-custom-marker--selected {
  border-color: #FFC107 !important;
}
.map-stock-marker--selected {
  filter: drop-shadow(0 0 3px #FFC107);
}
/* Kalıcı etiket: Leaflet'in beyaz tooltip kutusu ve oku kapatılır, rengi içteki span verir. */
.map-mark-label.leaflet-tooltip {
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 0;
}
.map-mark-label.leaflet-tooltip::before {
  display: none;
}
`;

const DEFAULT_LABEL_COLOR = "#F26522";
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Açık renk seçilirse beyaz metin okunmaz — Fine3D'deki eşikle aynı (YIQ). */
function labelTextColor(bg: string): string {
  let hex = bg.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 170 ? "#1a1a1a" : "#fff";
}

export interface IMapCanvasMark {
  id: string;
  geoPoint: { latitude: number; longitude: number };
  emoji?: string | null;
  customIcon?: string | null;
  /** Çözülmüş ad — yalnız showLabel'lı işaretin kalıcı etiketi için. */
  name?: string;
  showLabel?: boolean;
  labelColor?: string | null;
}

function MapEvents({
  onMapClick,
  onZoomChange,
  onCenterChange,
}: {
  onMapClick: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend(e) {
      onZoomChange(e.target.getZoom());
    },
    moveend(e) {
      const c = e.target.getCenter();
      onCenterChange(c.lat, c.lng);
    },
  });
  return null;
}

function FlyToSelected({ mark }: { mark: IMapCanvasMark | null }) {
  const map = useMap();
  useEffect(() => {
    if (!mark) return;
    map.flyTo(
      [mark.geoPoint.latitude, mark.geoPoint.longitude],
      Math.max(map.getZoom(), 14),
      { duration: 0.4 },
    );
  }, [mark, map]);
  return null;
}

function ApplyZoom({ zoom }: { zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map.getZoom() !== zoom) map.setZoom(zoom);
  }, [zoom, map]);
  return null;
}

export default function MapCanvas({
  center,
  zoom,
  marks,
  selectedId,
  adding,
  onMapClick,
  onMarkerClick,
  onMarkerDrag,
  onZoomChange,
  onCenterChange,
}: {
  center: { latitude: number; longitude: number };
  zoom: number;
  marks: IMapCanvasMark[];
  selectedId: string | null;
  adding?: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (id: string) => void;
  onMarkerDrag?: (id: string, lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (lat: number, lng: number) => void;
}) {
  const selected = marks.find((m) => m.id === selectedId) || null;
  const icons = useMemo(
    () =>
      Object.fromEntries(
        marks.map((m) => [
          m.id,
          createMarkerLeafletIcon(m, m.id === selectedId),
        ]),
      ) as Record<string, ReturnType<typeof createMarkerLeafletIcon>>,
    [marks, selectedId],
  );

  useEffect(() => {
    const id = "map-custom-marker-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = CUSTOM_MARKER_CSS;
    document.head.appendChild(style);
  }, []);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={zoom}
      style={{
        height: "100%",
        minHeight: 420,
        width: "100%",
        cursor: adding ? "crosshair" : undefined,
      }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
        url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        subdomains={["0", "1", "2", "3"]}
        maxZoom={20}
      />
      <MapEvents
        onMapClick={onMapClick}
        onZoomChange={onZoomChange}
        onCenterChange={onCenterChange}
      />
      <ApplyZoom zoom={zoom} />
      <FlyToSelected mark={selected} />
      {marks.map((m) => {
        const labelBg =
          m.labelColor && HEX_COLOR.test(m.labelColor)
            ? m.labelColor
            : DEFAULT_LABEL_COLOR;
        return (
          <Marker
            key={`${m.id}-${m.emoji || ""}-${m.customIcon ? `c${m.customIcon.length}` : "s"}-${m.id === selectedId}`}
            position={[m.geoPoint.latitude, m.geoPoint.longitude]}
            icon={icons[m.id]}
            draggable={!!onMarkerDrag}
            eventHandlers={{
              click: () => onMarkerClick(m.id),
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onMarkerDrag?.(m.id, ll.lat, ll.lng);
              },
            }}
          >
            {m.showLabel && m.name && (
              // Fine3D'deki gibi işaretin altında, tıklamadan hep görünür önizleme.
              <Tooltip
                permanent
                direction="bottom"
                offset={[0, 2]}
                className="map-mark-label"
              >
                <span
                  style={{
                    display: "inline-block",
                    background: labelBg,
                    color: labelTextColor(labelBg),
                    border: "2px solid #fff",
                    borderRadius: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,.35)",
                    padding: "1px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                </span>
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
