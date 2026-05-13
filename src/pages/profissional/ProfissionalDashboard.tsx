import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FilePlus2, FileText, ShieldCheck, Stethoscope,
  Search, MessageCircleHeart, Map, Users, Clock, Activity,
  AlertTriangle, ChevronRight, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/shared/CaseCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, getOrganizationName } from "@/lib/domain";

const RISK_COLOR: Record<string, string> = {
  CRITICO: "#dc2626", ALTO: "#ea580c", MEDIO: "#d97706", BAIXO: "#16a34a",
};
const COLORS = ["#7c3aed", "#f97316", "#06b6d4", "#10b981"];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.5 } } };

// ── Inline mini-map ─────────────────────────────────────────────────────────
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
          html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:bold;">${inc.count}</div>`,
          className: "", iconSize: [26, 26], iconAnchor: [13, 13],
        });
        L.marker([inc.lat, inc.lng], { icon })
          .addTo(group)
          .bindPopup(`<b>${inc.city} - ${inc.state}</b><br/>${inc.count} caso(s)`);
      });
      mapInstance.current = map;
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, [incidents]);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-border" style={{ height: 200 }}>
      <style>{`@import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"); .leaflet-container{border-radius:20px;}`}</style>
      <div ref={mapRef} className="h-full w-full" />
      <button
        onClick={() => navigate("/profissional/mapa")}
        className="absolute bottom-3 right-3 z-[999] flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-md backdrop-blur-sm hover:bg-white"
      >
        <Map className="h-3.5 w-3.5 text-primary" /> Mapa completo
      </button>
    </div>
  );
}

export default function ProfissionalDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["professional-dashboard"], queryFn: api.getProfessionalDashboard });
  const { data: mapData } = useQuery({ queryKey: ["map-incidents"], queryFn: api.getMapIncidents, staleTime: 5 * 60_000 });

  const incidents = mapData?.incidents ?? [];
  const hasCases = (data?.casosPrioritarios.length ?? 0) > 0;
  const hasAttendances = (data?.ultimosAtendimentos.length ?? 0) > 0;

  const pieData = [
    { name: "Ativos", value: data?.casosAtivos ?? 0 },
    { name: "Hoje", value: data?.atendimentosHoje ?? 0 },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Stethoscope className="h-8 w-8 text-primary/40" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Painel operacional">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5 py-4 pb-8">

        {/* ── Quick Actions ──────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: "Novo Protocolo", icon: FilePlus2, path: "/profissional/novo-protocolo", primary: true },
            { label: "Atendimento", icon: Stethoscope, path: "/profissional/novo-atendimento" },
            { label: "Casos", icon: Search, path: "/profissional/casos" },
            { label: "Chats", icon: MessageCircleHeart, path: "/profissional/chats" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold transition-all hover:opacity-90 active:scale-95 ${
                action.primary ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "border border-border bg-white text-foreground shadow-sm"
              }`}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Casos ativos", value: data?.casosAtivos ?? 0, accent: "text-violet-600 bg-violet-50" },
            { icon: Activity, label: "Atendimentos hoje", value: data?.atendimentosHoje ?? 0, accent: "text-cyan-600 bg-cyan-50" },
            { icon: AlertTriangle, label: "Prioritários", value: data?.casosPrioritarios.length ?? 0, accent: "text-amber-600 bg-amber-50" },
            { icon: Clock, label: "Encaminhamentos", value: data?.encaminhamentosPendentes ?? 0, accent: "text-red-600 bg-red-50" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-3 rounded-[18px] border border-border bg-white p-4 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.accent}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-2xl font-black tabular-nums text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Mapa da Violência ──────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="font-display text-sm font-bold text-foreground">Mapa da Violência</h3>
            <span className="text-[11px] text-muted-foreground">{incidents.length} município(s) mapeado(s)</span>
          </div>
          <MiniMap incidents={incidents} />
          <div className="mt-2 flex flex-wrap gap-3 px-1">
            {Object.entries(RISK_COLOR).map(([k, c]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                <span className="text-[10px] font-semibold text-muted-foreground">{k}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Donut + Fila rápida ────────────────────────────── */}
        {pieData.length > 0 && (
          <motion.div variants={itemVariants} className="flex gap-3">
            <div className="flex-shrink-0 rounded-[20px] border border-border bg-white p-4 shadow-sm" style={{ width: 140 }}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visão geral</p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}`]} contentStyle={{ borderRadius: 12, fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1 space-y-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-[9px] text-muted-foreground">{d.name} <b className="text-foreground">{d.value}</b></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-[20px] border border-border bg-white p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acesso rápido</p>
              <div className="space-y-2">
                {[
                  { label: "Mapa da Violência", icon: Map, path: "/profissional/mapa" },
                  { label: "Relatórios", icon: FileText, path: "/profissional/historico" },
                  { label: "Equipe", icon: Users, path: "/profissional/permissoes" },
                ].map((link) => (
                  <button
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-border/50 px-3 py-2.5 transition-all hover:bg-muted/30 active:scale-[0.98]"
                  >
                    <link.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[12px] font-semibold text-foreground">{link.label}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Fila de prioridades ────────────────────────────── */}
        <motion.section variants={itemVariants}>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-bold text-foreground">Fila de Prioridades</h2>
            <button onClick={() => navigate("/profissional/casos")} className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {hasCases ? (
            <div className="space-y-3">
              <AnimatePresence>
                {data?.casosPrioritarios.map((caso, i) => (
                  <motion.div
                    key={caso.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <CaseCard caso={caso} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-border bg-white py-10 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500/60" />
              <div>
                <p className="text-sm font-semibold text-foreground">Fila zerada!</p>
                <p className="text-xs text-muted-foreground">Nenhum caso prioritário no momento.</p>
              </div>
            </div>
          )}
        </motion.section>

        {/* ── Últimas movimentações ──────────────────────────── */}
        {hasAttendances && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-3 pl-1 font-display text-sm font-bold text-foreground">Últimas Movimentações</h2>
            <div className="overflow-hidden rounded-[22px] border border-border bg-white shadow-sm">
              {data?.ultimosAtendimentos.map((item, i) => (
                <div key={item.id} className={`p-4 ${i !== 0 ? "border-t border-border/50" : ""}`}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{formatDate(item.data)}</span>
                    <div className="ml-auto"><StatusBadge type="risk" value={item.riscoIdentificado} /></div>
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">{item.caso.nomeSocial || item.caso.nomeCompleto}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    <span className="font-semibold">{item.tipoAtendimento}</span> · {getOrganizationName(item.orgao)}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

      </motion.div>
    </AppLayout>
  );
}
