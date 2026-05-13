import { BookOpenCheck, ChevronRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { helpArticlesByRole, institutionalContent } from "@/lib/demo-content";
import { useAuthStore } from "@/stores/auth-store";

type InstitutionalTopic = keyof typeof institutionalContent;

const topicTitles: Record<InstitutionalTopic, string> = {
  ajuda: "Ajuda",
  sobre: "Sobre o sistema",
  permissoes: "Permissões",
  seguranca: "Segurança",
  notificacoes: "Política de notificações",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function InstitutionalPage({ topic }: { topic: InstitutionalTopic }) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const basePath =
    currentUser.perfil === "mulher" ? "/mulher" : currentUser.perfil === "profissional" ? "/profissional" : "/gestora";

  const sections = institutionalContent[topic];
  const articles = helpArticlesByRole[currentUser.perfil];

  return (
    <AppLayout title={topicTitles[topic]} subtitle="Diretrizes formais e materiais de apoio da plataforma Athena.">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-24">
        <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/20 blur-3xl"></div>

          <div className="relative z-10 p-6">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Referência oficial
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{topicTitles[topic]}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Este material reúne orientações auditadas para apoiar a leitura de contexto e a conduta adequada dentro da plataforma.
            </p>
          </div>
        </motion.section>

        {sections.map((section, index) => (
          <motion.section variants={itemVariants} key={section.title} className="glass-panel group relative overflow-hidden p-6">
            <div className="absolute left-0 top-0 h-full w-1 bg-border/40 transition-colors group-hover:bg-primary"></div>

            <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-primary/70">Seção {index + 1}</p>
            <h3 className="font-display text-lg font-bold text-foreground">{section.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </motion.section>
        ))}

        <motion.section variants={itemVariants} className="pt-2">
          <h3 className="mb-4 px-1 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Leituras sugeridas</h3>

          <div className="grid gap-3">
            {articles.map((article) => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`${basePath}/artigo/${article.id}`)}
                key={article.id}
                className="glass-panel group flex cursor-pointer items-start gap-4 p-4 text-left transition-all hover:bg-card/80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-md">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{article.category}</p>
                  </div>
                  <p className="font-display text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">{article.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{article.description}</p>
                </div>
                <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted/30 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-white">
                  <ChevronRight className="h-3 w-3" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
