import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, AlertTriangle, Loader2, Info, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

// ── Leaflet dynamic import (avoid SSR issues) ──────────────────────────────
let L: typeof import("leaflet") | null = null;

const RISK_COLOR: Record<string, string> = {
  CRITICO: "#dc2626",
  ALTO: "#ea580c",
  MEDIO: "#d97706",
  BAIXO: "#16a34a",
};

const RISK_LABEL: Record<string, string> = {
  CRITICO: "Crítico",
  ALTO: "Alto",
  MEDIO: "Médio",
  BAIXO: "Baixo",
};

type Incident = {
  id: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  riskLevel: string;
  count: number;
};

type Filter = "todos" | "CRITICO" | "ALTO" | "MEDIO" | "BAIXO";

export default function MapaViolencia() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [filterRisk, setFilterRisk] = useState<Filter>("todos");
  const [isMapReady, setIsMapReady] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["map-incidents"],
    queryFn: () => api.getMapIncidents(),
    staleTime: 5 * 60_000,
  });

  // Init Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((leaflet) => {
      L = leaflet;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [-22.9, -43.2],
        zoom: 7,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setIsMapReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render markers when data or filter changes
  useEffect(() => {
    if (!isMapReady || !markersRef.current || !L || !data?.incidents) return;

    markersRef.current.clearLayers();

    const incidents: Incident[] = filterRisk === "todos"
      ? data.incidents
      : data.incidents.filter((i: Incident) => i.riskLevel === filterRisk);

    incidents.forEach((incident: Incident) => {
      if (!L) return;
      const color = RISK_COLOR[incident.riskLevel] ?? "#6b7280";

      const icon = L.divIcon({
        html: `
          <div style="
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            background:${color};
            transform:rotate(-45deg);
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:bold;line-height:1;">
              ${incident.count}
            </span>
          </div>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      L.marker([incident.lat, incident.lng], { icon })
        .addTo(markersRef.current!)
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${incident.city} - ${incident.state}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>
              <span style="font-size:12px;color:#666;">Risco ${RISK_LABEL[incident.riskLevel]}</span>
            </div>
            <div style="font-size:12px;color:#374151;font-weight:600;">${incident.count} caso${incident.count > 1 ? "s" : ""} registrado${incident.count > 1 ? "s" : ""}</div>
          </div>
        `);
    });
  }, [isMapReady, data, filterRisk]);

  return (
    <AppLayout title="Mapa da Violência" subtitle="Distribuição geográfica de casos">
      {/* Import Leaflet CSS */}
      <style>{`
        @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        .leaflet-container { border-radius: 24px; z-index: 0; }
        .leaflet-popup-content-wrapper { border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
      `}</style>

      <div className="space-y-4 py-4">
        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {(["todos", "CRITICO", "ALTO", "MEDIO", "BAIXO"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterRisk(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all ${
                filterRisk === f
                  ? "bg-foreground text-background shadow-md"
                  : "border border-border bg-white text-muted-foreground hover:bg-muted/60"
              }`}
              style={
                filterRisk === f && f !== "todos"
                  ? { background: RISK_COLOR[f], color: "white", borderColor: "transparent" }
                  : {}
              }
            >
              {f === "todos" ? "Todos" : RISK_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Map container */}
        <div className="relative overflow-hidden rounded-[24px] border border-border shadow-lg" style={{ height: "420px" }}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm font-semibold text-foreground">Não foi possível carregar os dados</p>
              <p className="text-xs text-muted-foreground mt-1">Verifique sua conexão e tente novamente.</p>
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
        </div>

        {/* Legend */}
        <div className="rounded-[20px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Legenda</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(RISK_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ background: RISK_COLOR[key] }}
                />
                <span className="text-[12px] text-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        {data?.incidents && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] border border-border bg-white p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Resumo</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <div className="font-display text-2xl font-bold text-foreground">
                  {data.incidents.length}
                </div>
                <div className="text-[11px] text-muted-foreground">Municípios afetados</div>
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <div className="font-display text-2xl font-bold text-foreground">
                  {data.incidents.reduce((acc: number, i: Incident) => acc + i.count, 0)}
                </div>
                <div className="text-[11px] text-muted-foreground">Casos mapeados</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
