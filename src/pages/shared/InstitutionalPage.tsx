import { BookOpenCheck, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { helpArticlesByRole, institutionalContent } from "@/lib/demo-content";
import { useAuthStore } from "@/stores/auth-store";

type InstitutionalTopic = keyof typeof institutionalContent;

const topicTitles: Record<InstitutionalTopic, string> = {
  ajuda: "Ajuda",
  sobre: "Sobre o sistema",
  permissoes: "Permissoes",
  seguranca: "Seguranca",
  notificacoes: "Politica de notificacoes",
};

export default function InstitutionalPage({ topic }: { topic: InstitutionalTopic }) {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  const sections = institutionalContent[topic];
  const articles = helpArticlesByRole[currentUser.perfil];

  return (
    <AppLayout title={topicTitles[topic]} subtitle="Conteudo institucional generico, claro e pronto para demonstracao.">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/60 bg-card/90 p-5 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <BookOpenCheck className="h-3.5 w-3.5" />
            Conteudo institucional
          </div>
          <h2 className="text-xl font-semibold text-foreground">{topicTitles[topic]}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta pagina reforca contexto, orientacao e confianca de uso sem depender de integracoes reais.
          </p>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
          </section>
        ))}

        <section className="rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-card">
          <h3 className="text-base font-semibold text-foreground">Leituras relacionadas</h3>
          <div className="mt-4 space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3">
                <ChevronRight className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{article.category}</p>
                  <p className="text-sm font-medium text-foreground">{article.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{article.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
