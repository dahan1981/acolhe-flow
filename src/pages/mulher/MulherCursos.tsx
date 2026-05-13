import { BookOpen, Clock, Star, Lock, ChevronRight, GraduationCap, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";

const COURSES_COMING = [
  {
    id: "1",
    title: "Conhecendo Seus Direitos",
    description: "Entenda a Lei Maria da Penha, medidas protetivas e como denunciar com segurança.",
    duration: "2h 30min",
    modules: 6,
    category: "Direitos Legais",
    color: "from-violet-500 to-purple-600",
    icon: "⚖️",
    rating: 4.9,
  },
  {
    id: "2",
    title: "Saúde Emocional e Autoestima",
    description: "Técnicas de autocuidado, manejo de trauma e reconstrução da autoconfiança.",
    duration: "3h 15min",
    modules: 8,
    category: "Bem-estar",
    color: "from-rose-400 to-pink-600",
    icon: "💜",
    rating: 4.8,
  },
  {
    id: "3",
    title: "Independência Financeira",
    description: "Primeiros passos para autonomia financeira, crédito e empreendedorismo feminino.",
    duration: "4h",
    modules: 10,
    category: "Finanças",
    color: "from-amber-400 to-orange-500",
    icon: "💰",
    rating: 4.7,
  },
  {
    id: "4",
    title: "Rede de Apoio e Comunidade",
    description: "Como construir vínculos seguros, acessar serviços sociais e grupos de suporte.",
    duration: "1h 45min",
    modules: 4,
    category: "Comunidade",
    color: "from-emerald-400 to-teal-500",
    icon: "🤝",
    rating: 4.9,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function MulherCursos() {
  return (
    <AppLayout title="Aprender" subtitle="Módulo educacional">
      <div className="space-y-6 py-4">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 shadow-xl shadow-purple-500/20"
        >
          {/* Decorative glows */}
          <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-[-20px] left-[-20px] h-32 w-32 rounded-full bg-white/5 blur-xl" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/90">
                  Em breve
                </span>
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
              </div>
              <h2 className="mt-2 font-display text-xl font-bold leading-tight text-white">
                Conteúdos criados para você
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                Cursos gratuitos e acessíveis para fortalecer sua autonomia e bem-estar.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 mt-5 flex gap-4 border-t border-white/10 pt-4">
            {[
              { label: "Cursos", value: "4+" },
              { label: "Horas", value: "12h" },
              { label: "Gratuito", value: "100%" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 text-center">
                <div className="font-display text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Section title */}
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-base font-bold text-foreground">Trilhas disponíveis</h3>
          <span className="text-[11px] text-muted-foreground">Lançando em breve</span>
        </div>

        {/* Course Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {COURSES_COMING.map((course) => (
            <motion.div key={course.id} variants={item}>
              <div className="relative overflow-hidden rounded-[22px] border border-border bg-white shadow-sm">
                {/* Color accent bar */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${course.color}`} />

                <div className="p-4 pl-5">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${course.color} text-2xl shadow-md`}
                    >
                      {course.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {course.category}
                          </span>
                          <h4 className="mt-1 font-display text-[15px] font-bold text-foreground leading-snug">
                            {course.title}
                          </h4>
                        </div>
                        <Lock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                      </div>

                      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {course.modules} módulos
                          </span>
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            {course.rating}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-[22px] border border-dashed border-primary/30 bg-primary/5 p-5 text-center"
        >
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-primary/60" />
          <p className="text-sm font-semibold text-foreground">Mais conteúdos chegando</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Nossa equipe está preparando materiais exclusivos. Fique de olho nas notificações!
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
