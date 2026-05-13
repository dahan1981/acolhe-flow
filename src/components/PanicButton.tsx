import { useState, useEffect } from "react";
import { usePanicStore } from "@/stores/panic-store";
import { ShieldAlert, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PanicButton() {
  const { isTriggered, triggerPanic, resetPanic, isOfflineSyncPending } = usePanicStore();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    let holdTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    if (isHolding && !isTriggered) {
      const startTime = Date.now();
      const duration = 2000; // 2 seconds hold

      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setHoldProgress(progress);
      }, 50);

      holdTimer = setTimeout(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              triggerPanic({ lat: position.coords.latitude, lng: position.coords.longitude });
              toast.error("Pedido de socorro enviado com localização!");
            },
            () => {
              triggerPanic();
              toast.error("Pedido de socorro enviado (sem localização).");
            }
          );
        } else {
          triggerPanic();
          toast.error("Pedido de socorro enviado.");
        }
        setIsHolding(false);
        setHoldProgress(0);
      }, duration);
    } else {
      setHoldProgress(0);
    }

    return () => {
      clearTimeout(holdTimer);
      clearInterval(progressTimer);
    };
  }, [isHolding, isTriggered, triggerPanic]);

  const handlePointerDown = () => setIsHolding(true);
  const handlePointerUp = () => setIsHolding(false);

  if (isTriggered) {
    return (
    <div className="fixed bottom-24 right-5 z-50 animate-in fade-in slide-in-from-bottom-4">
        <button
          onClick={resetPanic}
          className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg ring-4 ring-red-600/30 transition-all hover:bg-red-700 active:scale-95"
        >
          {isOfflineSyncPending ? (
            <>
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>Ajuda a caminho</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-5 z-50">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-full bg-foreground shadow-2xl transition-transform",
          isHolding ? "scale-110 shadow-red-500/50" : "hover:scale-105"
        )}
        aria-label="Botão de Pânico: Segure por 2 segundos para pedir ajuda"
      >
        <ShieldAlert
          className={cn(
            "z-10 h-8 w-8 text-white transition-colors duration-500",
            isHolding && "text-red-500"
          )}
        />
        {isHolding && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-full">
            <div
              className="absolute bottom-0 left-0 right-0 bg-red-600 transition-all duration-75 ease-linear"
              style={{ height: `${holdProgress}%` }}
            />
          </div>
        )}
      </button>
    </div>
  );
}
