"use client";

import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { EntityTypeEnum } from "./EntityTypeEnum";
import { polygonMatchesTypeFilter } from "./projectUnits";
import type { ISvgPolygon } from "./types";

/**
 * Çizim editörünün (storage draw/new.html) dünya uzayı.
 * Görsel hangi çözünürlükte olursa olsun bu dikdörtgene gerilir;
 * poligon noktaları da bu uzayda saklanır — doğal piksel değil.
 */
export const DRAW_WORLD_WIDTH = 1920;
export const DRAW_WORLD_HEIGHT = 1080;

/** Fine3D blok etiketi (kapsül + kısa sap + daire) — dünya uzayı birimleri. */
const BLOCK_PIN = {
  chipHeight: 26,
  chipPadX: 12,
  fontSize: 13,
  stemUp: 3,
  stemDown: 14,
  circleR: 5,
  stroke: 2,
} as const;

function centroid(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / n,
    y: points.reduce((sum, point) => sum + point.y, 0) / n,
  };
}

type OverlayPath = {
  key: string;
  index: number;
  d: string;
  label: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  draggable: boolean;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
};

/**
 * Görsel üzerine poligonları çizer.
 * Blok yazıları sürüklenerek Fine3D etiket konumu ayarlanır.
 */
export default function PolygonOverlay({
  polygons,
  labels,
  selectedIndex,
  naturalWidth,
  naturalHeight,
  typeFilter = null,
  pointMarkers = false,
  onSelect,
  onDoubleSelect,
  onLabelMove,
  onBackgroundContextMenu,
}: {
  polygons?: ISvgPolygon[] | null;
  labels?: string[];
  selectedIndex?: number | null;
  /** Görsel yüklendi mi diye bakılır; koordinat uzayı değildir. */
  naturalWidth: number;
  naturalHeight: number;
  /** Blok filtresi: null = hepsi; aksi halde Kat/Mülk (Default her zaman görünür). */
  typeFilter?: number | null;
  /** Tek noktalı poligonları daire olarak çiz (minimap hotspot). */
  pointMarkers?: boolean;
  onSelect?: (index: number) => void;
  /** Çift tık — blok/daire bağlama menüsü. */
  onDoubleSelect?: (index: number) => void;
  /** Blok yazısı sürüklenince ofset (dünya uzayı). */
  onLabelMove?: (index: number, offsetX: number, offsetY: number) => void;
  /** Boş alana sağ tık (dünya uzayı). Minimap nokta ekleme. */
  onBackgroundContextMenu?: (worldX: number, worldY: number) => void;
}) {
  const interactive = typeof onSelect === "function" || typeof onDoubleSelect === "function";
  const imageReady = naturalWidth > 0 && naturalHeight > 0;
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const [dragPreview, setDragPreview] = useState<{ index: number; x: number; y: number } | null>(null);
  const dragRef = useRef<{
    index: number;
    baseX: number;
    baseY: number;
    /** Tıklama anı − topPoint farkı; zıplamayı önler (kapsül topPoint üstünde). */
    grabOffsetX: number;
    grabOffsetY: number;
    pointerId: number;
  } | null>(null);

  const paths = useMemo(() => {
    if (!polygons?.length || !imageReady) return [] as OverlayPath[];
    return polygons
      .map((polygon, index) => {
        if (!polygonMatchesTypeFilter(polygon, typeFilter)) return null;
        const pts = polygon.points;
        if (!pts?.length) return null;
        const d = pts
          .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x} ${pt.y}`)
          .join(" ")
          .concat(" Z");
        const center = centroid(pts);
        const isBlockLabel = Number(polygon.entityType) === EntityTypeEnum.Block;
        const minY = Math.min(...pts.map((pt) => pt.y));
        const baseX = isBlockLabel ? center.x : center.x;
        const baseY = isBlockLabel ? minY : center.y;
        const labelX = baseX + (isBlockLabel ? Number(polygon.labelOffsetX ?? 0) : 0);
        const labelY = baseY + (isBlockLabel ? Number(polygon.labelOffsetY ?? 0) : 0);
        const selected = selectedIndex === index;
        const label = labels?.[index] ?? "";
        return {
          key: polygon.id ?? `poly-${index}`,
          index,
          d,
          label,
          x: labelX,
          y: labelY,
          baseX,
          baseY,
          draggable: isBlockLabel && Boolean(label) && typeof onLabelMove === "function",
          fill: selected ? "rgba(242, 101, 34, 0.32)" : polygon.customFillColor ?? "rgba(255, 59, 63, 0.18)",
          fillOpacity: polygon.customFillOpacity ?? 1,
          stroke: selected ? "#F26522" : polygon.customStrokeColor ?? "rgba(255, 59, 63, 0.95)",
          strokeWidth: selected ? 3 : polygon.customStrokeWidth ?? 2,
        } satisfies OverlayPath;
      })
      .filter(Boolean) as OverlayPath[];
  }, [polygons, labels, selectedIndex, imageReady, typeFilter, onLabelMove]);

  const clientToWorld = (clientX: number, clientY: number) => {
    const el = labelLayerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * DRAW_WORLD_WIDTH,
      y: ((clientY - rect.top) / rect.height) * DRAW_WORLD_HEIGHT,
    };
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const world = clientToWorld(event.clientX, event.clientY);
    const topX = world.x - drag.grabOffsetX;
    const topY = world.y - drag.grabOffsetY;
    const offsetX = topX - drag.baseX;
    const offsetY = topY - drag.baseY;
    dragRef.current = null;
    setDragPreview(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    onLabelMove?.(drag.index, offsetX, offsetY);
  };

  if (!imageReady) return null;
  if (!paths.length && !onBackgroundContextMenu) return null;

  const worldFromEvent = (event: ReactMouseEvent<SVGElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * DRAW_WORLD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * DRAW_WORLD_HEIGHT,
    };
  };

  const handleBackgroundContextMenu = (event: ReactMouseEvent<SVGElement>) => {
    if (!onBackgroundContextMenu) return;
    event.preventDefault();
    event.stopPropagation();
    const world = worldFromEvent(event);
    if (!world) return;
    onBackgroundContextMenu(world.x, world.y);
  };

  return (
    <>
      <svg
        viewBox={`0 0 ${DRAW_WORLD_WIDTH} ${DRAW_WORLD_HEIGHT}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: onBackgroundContextMenu || interactive ? "auto" : "none",
          overflow: "visible",
          cursor: onBackgroundContextMenu ? "crosshair" : undefined,
        }}
        onContextMenu={onBackgroundContextMenu ? handleBackgroundContextMenu : undefined}
      >
        {paths.map((path) => {
          const pts = polygons?.[path.index]?.points ?? [];
          const isPoint = pointMarkers && pts.length === 1;
          const pointHandlers = {
            style: {
              pointerEvents: (interactive ? "auto" : "none") as "auto" | "none",
              cursor: interactive ? ("pointer" as const) : ("inherit" as const),
            },
            onClick: (event: ReactMouseEvent) => {
              event.stopPropagation();
              onSelect?.(path.index);
            },
            onDoubleClick: (event: ReactMouseEvent) => {
              event.stopPropagation();
              event.preventDefault();
              onDoubleSelect?.(path.index);
            },
            onContextMenu: (event: ReactMouseEvent) => {
              // Mevcut noktada sağ tık yeni nokta eklemesin; bağlama için çift tık kullanılır.
              event.preventDefault();
              event.stopPropagation();
              onSelect?.(path.index);
              onDoubleSelect?.(path.index);
            },
          };
          return (
            <g key={path.key}>
              {isPoint ? (
                <circle
                  cx={pts[0].x}
                  cy={pts[0].y}
                  r={selectedIndex === path.index ? 14 : 10}
                  fill={selectedIndex === path.index ? "rgba(242, 101, 34, 0.85)" : "rgba(255, 59, 63, 0.75)"}
                  stroke="#fff"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  {...pointHandlers}
                />
              ) : (
                <path
                  d={path.d}
                  fill={path.fill}
                  fillOpacity={path.fillOpacity}
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth}
                  vectorEffect="non-scaling-stroke"
                  {...pointHandlers}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div
        ref={labelLayerRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        {paths
          .filter((path) => path.label)
          .map((path) => {
            const preview = dragPreview?.index === path.index ? dragPreview : null;
            const x = preview?.x ?? path.x;
            const y = preview?.y ?? path.y;
            const dragging = dragPreview?.index === path.index;
            const left = `${(x / DRAW_WORLD_WIDTH) * 100}%`;
            const top = `${(y / DRAW_WORLD_HEIGHT) * 100}%`;

            const dragHandlers = path.draggable
              ? {
                  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const world = clientToWorld(event.clientX, event.clientY);
                    dragRef.current = {
                      index: path.index,
                      baseX: path.baseX,
                      baseY: path.baseY,
                      grabOffsetX: world.x - path.x,
                      grabOffsetY: world.y - path.y,
                      pointerId: event.pointerId,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                    // Mevcut konumda kal — tıklanınca zıplama olmasın.
                    setDragPreview({ index: path.index, x: path.x, y: path.y });
                  },
                  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
                    const drag = dragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    event.stopPropagation();
                    const world = clientToWorld(event.clientX, event.clientY);
                    setDragPreview({
                      index: drag.index,
                      x: world.x - drag.grabOffsetX,
                      y: world.y - drag.grabOffsetY,
                    });
                  },
                  onPointerUp: endDrag,
                  onPointerCancel: endDrag,
                }
              : {};

            // Blok: Fine3D pin (kapsül üstte, sap + daire altta). (x,y) = Fine3D topPoint.
            if (path.draggable) {
              const chipTop = -BLOCK_PIN.stemUp - BLOCK_PIN.chipHeight;
              const stemHeight = BLOCK_PIN.stemUp + BLOCK_PIN.stemDown;
              const pinTop = chipTop;
              const pinBottom = BLOCK_PIN.stemDown + BLOCK_PIN.circleR;
              const pinHeight = pinBottom - pinTop;
              return (
                <div
                  key={`${path.key}-label`}
                  onClick={(event) => event.stopPropagation()}
                  {...dragHandlers}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    // Hit box: topPoint'i (0,0) alıp kapsül+sap+daireyi kapsar.
                    transform: `translate(-50%, ${pinTop}px)`,
                    height: pinHeight,
                    minWidth: 72,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pointerEvents: "auto",
                    cursor: dragging ? "grabbing" : "grab",
                    userSelect: "none",
                    touchAction: "none",
                    zIndex: dragging ? 5 : 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: BLOCK_PIN.fontSize,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: "#111",
                      background: "#fff",
                      borderRadius: 999,
                      padding: `${(BLOCK_PIN.chipHeight - BLOCK_PIN.fontSize) / 2}px ${BLOCK_PIN.chipPadX}px`,
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                      flexShrink: 0,
                    }}
                  >
                    {path.label}
                  </div>
                  <div
                    style={{
                      width: BLOCK_PIN.stroke,
                      height: stemHeight,
                      background: "#fff",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      width: BLOCK_PIN.circleR * 2,
                      height: BLOCK_PIN.circleR * 2,
                      marginTop: -BLOCK_PIN.circleR,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      flexShrink: 0,
                    }}
                  />
                </div>
              );
            }

            // Etiket poligonun ortasını örttüğü için tıklama etikete düşüyordu ve hiçbir şey
            // seçilmiyordu (yalnız olay durduruluyordu). Etiket artık poligonun kendisi gibi
            // davranır; boyutu da görsel küçüldükçe küçülür ki küçük dairelerin üstünü kapatmasın.
            return (
              <div
                key={`${path.key}-label`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (interactive) onSelect?.(path.index);
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  if (interactive) onDoubleSelect?.(path.index);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!interactive) return;
                  onSelect?.(path.index);
                  onDoubleSelect?.(path.index);
                }}
                style={{
                  position: "absolute",
                  left,
                  top,
                  transform: "translate(-50%, -50%)",
                  fontSize: "clamp(8px, 0.75vw, 11px)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: "#111",
                  background: "rgba(255,255,255,0.88)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  pointerEvents: "auto",
                  cursor: interactive ? "pointer" : "default",
                  outline: selectedIndex === path.index ? "2px solid #F26522" : undefined,
                  userSelect: "none",
                  zIndex: 1,
                }}
              >
                {path.label}
              </div>
            );
          })}
      </div>
    </>
  );
}
