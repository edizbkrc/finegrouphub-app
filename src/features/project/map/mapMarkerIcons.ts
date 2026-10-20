import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import * as MuiIcons from "@mui/icons-material";

const PRIMARY = "#FF6A00";
const SELECTED = "#FFC107";

type IconComponent = ComponentType<{
  style?: React.CSSProperties;
  htmlColor?: string;
  sx?: object;
}>;

/** Sağ menüdeki StockIcon ile aynı isim çözümü. */
export function resolveMuiIconName(iconName?: string | null): string {
  return (iconName || "place")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function getMuiIcon(iconName?: string | null): IconComponent {
  const key = resolveMuiIconName(iconName);
  return ((MuiIcons as unknown as Record<string, IconComponent>)[key] as IconComponent) || MuiIcons.Place;
}

/** MUI SVG markup — sağ menüdeki ikonun birebir aynısı. */
function muiIconSvgMarkup(iconName: string | null | undefined, color: string, size = 22): string {
  const Icon = getMuiIcon(iconName);
  return renderToStaticMarkup(
    createElement(Icon, {
      htmlColor: color,
      style: { width: size, height: size, display: "block" },
    })
  );
}

function toBase64Svg(svg: string): string {
  if (typeof window === "undefined") return "";
  return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Stok ikon: sağ menüyle aynı MUI glyph, beyaz daire çerçeve.
 */
export function createStockLeafletIcon(iconName: string, isSelected = false): L.Icon {
  const color = isSelected ? SELECTED : PRIMARY;
  // MUI çıktısı: fill="currentColor" → sabit renge çevir, nested <svg> olarak koy.
  const glyph = muiIconSvgMarkup(iconName, color, 24)
    .replace(/currentColor/g, color)
    .replace(/<svg\b/, `<svg x="8" y="8" width="24" height="24"`);

  const iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="${color}" stroke-width="3"/>
      ${glyph}
    </svg>
  `;

  return new L.Icon({
    iconUrl: toBase64Svg(iconSvg),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
    className: isSelected ? "map-stock-marker map-stock-marker--selected" : "map-stock-marker",
  });
}

/** Özel görsel — sağ listedeki yuvarlak thumbnail ile aynı dil. */
export function createCustomImageLeafletIcon(imageUrl: string, isSelected = false): L.Icon {
  return new L.Icon({
    iconUrl: imageUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
    className: isSelected ? "map-custom-marker map-custom-marker--selected" : "map-custom-marker",
  });
}

export function createMarkerLeafletIcon(
  mark: {
    emoji?: string | null;
    customIcon?: string | null;
  },
  isSelected = false
): L.Icon {
  const custom = typeof mark.customIcon === "string" ? mark.customIcon.trim() : "";
  if (custom) return createCustomImageLeafletIcon(custom, isSelected);
  return createStockLeafletIcon(mark.emoji || "place", isSelected);
}

export function isCustomIconUrl(value?: string | null): boolean {
  if (!value) return false;
  return value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") || value.startsWith("blob:");
}
