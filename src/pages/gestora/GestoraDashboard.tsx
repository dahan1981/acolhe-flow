import { useEffect, useRef, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, Users, Clock, FilePlus2,
  MessageCircleHeart, Stethoscope, Map, ChevronRight,
  ShieldCheck, Building, AlertOctagon
} from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { violenceTypeLabel } from "@/lib/domain";

const COLORS = ["#7c3aed", "#f97316", "#06b6d4", "#10b981", "#f43f5e", "#8b5cf6"];
const RISK_COLOR: Record<string, string> = {
  CRITICO: "#dc2626", ALTO: "#ea580c", MEDIO: "#d97706", BAIXO: "#16a34a",
};

// ── Inline mini-map component ────────────────────────────────────────────────
function MiniMap({ incidents }: { incidents: Array<{ id: string; lat: number; lng: number; city: string; state: string; riskLevel: string; count: number }> }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = L.map(mapRef.current!, { center: [-15.8, -47.9], zoom: 4, zoomControl: false, attributionControl: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      const group = L.layerGroup().addTo(map);
      incidents.forEach((inc) => {
        const color = RISK_COLOR[inc.riskLevel] ?? "#7c3aed";
        const icon = L.divIcon({
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">${inc.count}</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14],
        });
        L.marker([inc.lat, inc.lng], { icon })
          .addTo(group)
          .bindPopup(`<b>${inc.city} - ${inc.state}</b><br/>${inc.count} caso(s) · Risco ${inc.riskLevel}`);
      });
      mapInstance.current = map;
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, [incidents]);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-border" style={{ height: 220 }}>
      <style>{`@import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"); .leaflet-container{border-radius:20px;}`}</style>
      <div ref={mapRef} className="h-full w-full" />
      <button
        onClick={() => navigate("/gestora/mapa")}
        className="absolute bottom-3 right-3 z-[999] flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-md backdrop-blur-sm hover:bg-white"
      >
        <Map className="h-3.5 w-3.5 text-primary" /> Ver mapa completo
      </button>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, delta, accent = "primary" }: {
  icon: ElementType; label: string; value: number; delta?: number; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    primary: "text-violet-600 bg-violet-50", accent: "text-cyan-600 bg-cyan-50",
    warning: "text-amber-600 bg-amber-50", urgent: "text-red-600 bg-red-50",
    success: "text-emerald-600 bg-emerald-50",
  };
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-border bg-white p-4 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentMap[accent] ?? accentMap.primary}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="font-display text-2xl font-black tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{label}</p>
        {delta !== undefined && (
          <p className={`mt-0.5 text-[10px] font-bold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs anterior
          </p>
        )}
      </div>
    </div>
  );
}

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.5 } } };

export default function GestoraDashboard() {
  const navigate = useNavigate();

  const { data: dashData, isLoading } = useQuery({ queryKey: ["manager-dashboard"], queryFn: api.getManagerDashboard });
  const { data: mapData } = useQuery({ queryKey: ["map-incidents"], queryFn: api.getMapIncidents, staleTime: 5 * 60_000 });

  const stats = dashData?.stats;
  const incidents = mapData?.incidents ?? [];

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Em triagem", value: stats.ativos },
      { name: "Em andamento", value: stats.emAndamento },
      { name: "Encaminhados", value: stats.encaminhados },
      { name: "Concluídos", value: stats.resolvidos },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const violenceData = useMemo(
    () => [...(stats?.porViolencia ?? [])].sort((a, b) => b.total - a.total).slice(0, 5).map((v) => ({
      name: violenceTypeLabel(v.tipo).slice(0, 12),
      total: v.total,
    })),
    [stats]
  );

  if (isLoading || !stats) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <ShieldCheck className="h-8 w-8 text-primary/40" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Visão executiva da rede">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 py-4 pb-8">

        {/* ── Quick Actions ──────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: "Novo Protocolo", icon: FilePlus2, path: "/gestora/novo-protocolo", bg: "bg-violet-600" },
            { label: "Atendimento", icon: Stethoscope, path: "/gestora/novo-atendimento", bg: "bg-primary/10 !text-primary" },
            { label: "Equipe", icon: Users, path: "/gestora/profissionais", bg: "bg-primary/10 !text-primary" },
            { label: "Chats", icon: MessageCircleHeart, path: "/gestora/chats", bg: "bg-primary/10 !text-primary" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold shadow-sm transition-all hover:opacity-90 active:scale-95 ${
                action.bg.includes("violet") ? "bg-violet-600 text-white" : "border border-border bg-white text-foreground"
              }`}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Total de casos" value={stats.total} delta={2} />
          <StatCard icon={AlertTriangle} label="Em triagem" value={stats.ativos} accent="warning" delta={-4} />
          <StatCard icon={Clock} label="Pendentes" value={stats.encaminhamentosPendentes} accent="urgent" />
          <StatCard icon={Activity} label="Concluídos" value={stats.resolvidos} accent="success" delta={12} />
        </motion.div>

        {/* ── Mapa da Violência ──────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="font-display text-sm font-bold text-foreground">Mapa da Violência</h3>
            <span className="text-[11px] text-muted-foreground">{incidents.length} município(s)</span>
          </div>
          <MiniMap incidents={incidents} />
          {/* Risk legend */}
          <div className="mt-2 flex flex-wrap gap-3 px-1">
            {Object.entries(RISK_COLOR).map(([k, c]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                <span className="text-[10px] font-semibold text-muted-foreground">{k}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Donut — Casos por status + Barras — por tipo ─── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* Donut */}
          <div className="rounded-[20px] border border-border bg-white p-4 shadow-sm">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Por status</p>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} casos`]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 space-y-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground truncate">{d.name}</span>
                  <span className="ml-auto text-[10px] font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk matrix */}
          <div className="rounded-[20px] border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Matriz de Risco</p>
            <div className="grid grid-cols-2 gap-2">
              {stats.porRisco.map((item) => (
                <div key={item.nivel} className="rounded-[12px] border border-border/50 bg-muted/20 p-2.5 text-center">
                  <p className="font-display text-xl font-black text-foreground">{item.total}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{item.nivel}</p>
                </div>
              ))}
            </div>
            {stats.total > 0 && (
              <div className="mt-3 space-y-1.5">
                {stats.porRisco.map((item) => (
                  <div key={item.nivel} className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.total / stats.total) * 100}%`,
                          background: RISK_COLOR[item.nivel.toUpperCase()] ?? "#7c3aed",
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] font-bold text-muted-foreground">{item.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Bar chart — violências ─────────────────────────── */}
        {violenceData.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-[20px] border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ocorrências por tipo</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={violenceData} barSize={22} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {violenceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Distribuição na rede ───────────────────────────── */}
        {stats.porOrgao.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-[20px] border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Distribuição na rede</p>
            </div>
            <div className="space-y-2">
              {stats.porOrgao.map((item) => (
                <div key={item.sigla} className="flex items-center gap-3">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{item.sigla}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted/40" style={{ height: 6 }}>
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${stats.total ? (item.total / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-[11px] font-bold text-foreground">{item.total}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Casos recentes ─────────────────────────────────── */}
        {reportData?.casosRecentes?.length ? (
          <motion.div variants={itemVariants}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-bold text-foreground">Casos recentes</h3>
              <button onClick={() => navigate("/gestora/casos")} className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {reportData.casosRecentes.slice(0, 4).map((caso) => (
                <button
                  key={caso.id}
                  onClick={() => navigate(`/gestora/caso/${caso.id}`)}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-border bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: RISK_COLOR[caso.situacaoRisco?.toUpperCase() ?? ""] ?? "#7c3aed" }}
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[13px] font-semibold text-foreground">#{caso.protocolo}</p>
                    <p className="text-[11px] text-muted-foreground">{caso.orgaoAtual}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

      </motion.div>
    </AppLayout>
  );
}
