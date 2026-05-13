import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  MessageCircleHeart,
  BookOpen,
  HelpCircle,
  FileText,
  Phone,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { usePanicStore } from "@/stores/panic-store";
import { toast } from "sonner";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

const HOLD_DURATION = 3000; // 3s like the reference image says

// Quick action grid items
const QUICK_ACTIONS = [
  {
    label: "Medida protetiva",
    icon: Shield,
    path: "/mulher/medida-protetiva",
    color: "bg-violet-100 text-violet-600",
  },
  {
    label: "Dúvidas",
    icon: HelpCircle,
    path: "/mulher/central-ajuda",
    color: "bg-sky-100 text-sky-600",
  },
  {
    label: "Denúncia",
    icon: FileText,
    path: "/mulher/ajuda",
    color: "bg-rose-100 text-rose-600",
  },
  {
    label: "Chat seguro",
    icon: MessageCircleHeart,
    path: "/mulher/chat",
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default function MulherDashboard() {
  const navigate = useNavigate();
  const { isTriggered, triggerPanic, resetPanic, isOfflineSyncPending } = usePanicStore();

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data } = useQuery({
    queryKey: ["woman-dashboard"],
    queryFn: api.getWomanDashboard,
  });

  // --- Hold-to-activate logic ---
  const startHold = () => {
    if (isTriggered) return;
    setIsHolding(true);
    const startTime = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHoldProgress(Math.min((elapsed / HOLD_DURATION) * 100, 100));
    }, 30);

    holdTimerRef.current = setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            triggerPanic({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            toast.error("🚨 Pedido de socorro enviado com localização!");
          },
          () => {
            triggerPanic();
            toast.error("🚨 Pedido de socorro enviado.");
          },
          { timeout: 4000 }
        );
      } else {
        triggerPanic();
        toast.error("🚨 Pedido de socorro enviado.");
      }
      cancelHold();
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  useEffect(() => () => cancelHold(), []);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 py-4 pb-8">

        {/* ── Hero SOS Section ─────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 py-6">

          {/* Outer pulse rings */}
          <div className="relative flex items-center justify-center">
            <AnimatePresence>
              {isHolding && !isTriggered && (
                <>
                  <motion.div
                    key="ring1"
                    className="absolute rounded-full border-2 border-primary/30"
                    initial={{ width: 120, height: 120, opacity: 0.6 }}
                    animate={{ width: 200, height: 200, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    key="ring2"
                    className="absolute rounded-full border-2 border-primary/20"
                    initial={{ width: 120, height: 120, opacity: 0.4 }}
                    animate={{ width: 240, height: 240, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                  />
                </>
              )}
              {isTriggered && (
                <motion.div
                  key="triggered-ring"
                  className="absolute rounded-full border-4 border-destructive/40"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 180, height: 180 }}
                />
              )}
            </AnimatePresence>

            {/* Main SOS Button */}
            <motion.button
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onClick={isTriggered ? resetPanic : undefined}
              whileTap={{ scale: 0.94 }}
              className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full shadow-2xl overflow-hidden select-none"
              style={{ touchAction: "none" }}
              aria-label="Botão de emergência SOS – segure por 3 segundos"
            >
              {/* Base gradient */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isTriggered
                    ? "bg-gradient-to-br from-red-500 to-rose-700"
                    : "bg-gradient-to-br from-primary via-violet-600 to-accent"
                }`}
              />

              {/* Progress fill (fills from bottom) */}
              {isHolding && !isTriggered && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-white/20 transition-none"
                  style={{ height: `${holdProgress}%` }}
                />
              )}

              {/* Circular progress ring */}
              {isHolding && !isTriggered && (
                <svg
                  className="absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 130 130"
                >
                  <circle
                    cx="65"
                    cy="65"
                    r="60"
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    strokeOpacity="0.4"
                    strokeDasharray={`${2 * Math.PI * 60}`}
                    strokeDashoffset={`${2 * Math.PI * 60 * (1 - holdProgress / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Label */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="font-display text-4xl font-black tracking-tighter text-white drop-shadow">
                  SOS
                </span>
                {isTriggered && (
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/80">
                    Socorro
                  </span>
                )}
              </div>
            </motion.button>
          </div>

          {/* Caption */}
          <AnimatePresence mode="wait">
            {isTriggered ? (
              <motion.div
                key="triggered"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-center"
              >
                <p className="font-display text-base font-bold text-destructive">
                  {isOfflineSyncPending ? "Sincronizando pedido..." : "Ajuda a caminho!"}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Toque novamente para cancelar
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-center"
              >
                <p className="font-display text-base font-bold text-foreground">Emergência</p>
                <p className="text-[12px] text-muted-foreground">
                  {isHolding
                    ? `Aguarde… ${Math.round(((100 - holdProgress) / 100) * (HOLD_DURATION / 1000) * 10) / 10}s`
                    : "Pressione por 3 segundos"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Quick Actions Grid ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-3 rounded-[20px] border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-center text-[13px] font-semibold text-foreground leading-snug">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── Current Case Banner (if exists) ────────────────── */}
        {data?.caso && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate("/mulher/caso")}
            className="group flex items-center gap-4 rounded-[22px] border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4 text-left shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                Caso ativo
              </p>
              <p className="font-display text-sm font-bold text-foreground">
                #{data.caso.protocolo}
              </p>
              <p className="truncate text-xs text-muted-foreground">{data.caso.orgaoAtual}</p>
            </div>
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          </motion.button>
        )}

        {/* ── Emergency contacts strip ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 rounded-[18px] border border-border bg-white p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
            <Phone className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Ligue agora
            </p>
            <p className="font-display text-sm font-bold text-foreground">
              180 — Central da Mulher
            </p>
          </div>
          <a
            href="tel:180"
            onClick={(e) => e.stopPropagation()}
            className="rounded-full bg-rose-600 px-4 py-2 text-[12px] font-bold text-white shadow-md transition-all hover:bg-rose-700 active:scale-95"
          >
            Ligar
          </a>
        </motion.div>

      </div>
    </AppLayout>
  );
}
