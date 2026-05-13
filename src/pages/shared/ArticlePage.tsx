import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Share2, BookOpenCheck, Bookmark, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { helpArticlesByRole } from "@/lib/demo-content";
import { useAuthStore } from "@/stores/auth-store";

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
};

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  const articles = helpArticlesByRole[currentUser.perfil];
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <AppLayout title="Não Encontrado">
        <div className="flex flex-col items-center justify-center p-10 text-center min-h-[50vh]">
          <h2 className="text-xl font-bold font-display text-foreground">Artigo não localizado.</h2>
          <p className="mt-2 text-sm text-muted-foreground">O material pode ter sido atualizado ou removido do acervo institucional.</p>
          <button onClick={() => navigate(-1)} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-white shadow-sm font-bold text-sm">
            Voltar ao painel
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack={true}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-24 max-w-2xl mx-auto">
        
        {/* Article Header (Editorial Cover) */}
        <motion.section variants={itemVariants} className="pt-2 px-2 relative z-10">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm backdrop-blur-md">
            <BookOpenCheck className="h-3.5 w-3.5" />
            {article.category}
          </div>
          
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {article.title}
          </h1>
          
          <p className="mt-4 text-sm md:text-base font-medium leading-relaxed text-muted-foreground border-l-4 border-primary/40 pl-4 py-1">
            {article.description}
          </p>

          <div className="mt-6 flex items-center justify-between border-y border-border/40 py-4">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-2xl bg-foreground text-background font-display font-bold shadow-md">
                   AT
                </div>
                <div>
                   <p className="font-display text-xs font-bold text-foreground">Equipe Athena</p>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Atualizado recentemente</p>
                </div>
             </div>
             
             <div className="flex gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm border border-border/40 text-muted-foreground hover:text-primary transition-colors">
                   <Bookmark className="h-4 w-4" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm border border-border/40 text-muted-foreground hover:text-primary transition-colors">
                   <Share2 className="h-4 w-4" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm border border-border/40 text-muted-foreground hover:text-primary transition-colors">
                   <MoreHorizontal className="h-4 w-4" />
                </button>
             </div>
          </div>
        </motion.section>

        {/* Article Body Content */}
        <motion.section variants={itemVariants} className="glass-panel p-6 sm:p-8 relative overflow-hidden text-foreground leading-relaxed shadow-sm">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent/10 blur-3xl"></div>
          
          <div className="space-y-5 relative z-10 font-medium text-sm md:text-base text-muted-foreground">
             {article.content ? (
                article.content.map((paragraph, index) => (
                  <p key={index} className={index === 0 ? "text-foreground font-semibold leading-relaxed" : ""}>
                    {paragraph}
                  </p>
                ))
             ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-border/60 rounded-2xl">
                   <p className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground/60">Conteúdo protegido ou em revisão.</p>
                </div>
             )}
          </div>
          
          {/* Bottom Call out */}
          <div className="mt-10 rounded-2xl bg-primary/5 border border-primary/20 p-5">
             <p className="font-display text-sm font-bold text-foreground">Esta orientação foi útil?</p>
             <p className="mt-1 text-[11px] font-medium text-muted-foreground">Seu feedback ajuda a refinar continuamente as matrizes de apoio do sistema central.</p>
             <div className="mt-4 flex gap-3">
                <button className="flex-1 rounded-xl bg-background border border-border/60 py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-colors">Sim, ajudou</button>
                <button className="flex-1 rounded-xl bg-background border border-border/60 py-2.5 text-xs font-bold text-muted-foreground shadow-sm hover:text-primary transition-colors">Não entendi</button>
             </div>
          </div>
        </motion.section>

      </motion.div>
    </AppLayout>
  );
}
