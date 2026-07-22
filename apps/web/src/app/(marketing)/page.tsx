import Link from "next/link";
import { getAllArticles } from "@/lib/blog/content";
import { categories } from "@/lib/blog/categories";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { CategoryImage } from "@/components/marketing/CategoryImage";
import { siteConfig } from "@/lib/blog/site";

export default function HomePage() {
  const recentArticles = getAllArticles().slice(0, 6);
  const featuredCategories = categories.slice(0, 6);

  return (
    <>
      <section className="bg-gradient-to-b from-khoros-mint/60 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="text-khoros-cyan-dark font-medium mb-4 tracking-wide uppercase text-sm">
            Saúde mental com acolhimento
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-serif leading-tight max-w-3xl mx-auto">
            Informação de qualidade para cuidar da sua saúde emocional
          </h1>
          <p className="text-lg text-khoros-slate max-w-2xl mx-auto mb-8 leading-relaxed">
            A KHOROS está construindo uma forma nova de acessar psicólogos — na hora, por vídeo,
            pagando só pelos minutos. Enquanto isso, explore conteúdo baseado em evidências
            para entender, acolher e cuidar de você.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/blog"
              className="px-8 py-3 bg-khoros-cyan text-white font-medium rounded-full hover:bg-khoros-cyan-dark transition-colors"
            >
              Explorar o blog
            </Link>
            <Link
              href="/como-funciona"
              className="px-8 py-3 border-2 border-khoros-cyan text-khoros-cyan-dark font-medium rounded-full hover:bg-khoros-mint transition-colors"
            >
              Como a KHOROS vai funcionar
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-semibold mb-2">Temas em destaque</h2>
        <p className="text-khoros-slate mb-8">
          Conteúdo organizado por assunto para facilitar sua busca.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/categoria/${cat.slug}`}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:border-khoros-cyan/40 hover:shadow-sm transition-all group"
            >
              <CategoryImage src={cat.image} alt={cat.imageAlt} variant="card" />
              <div className="p-5">
                <h3 className="font-semibold group-hover:text-khoros-cyan-dark transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-khoros-slate mt-1 line-clamp-2">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/blog" className="text-khoros-cyan-dark font-medium hover:underline">
            Ver todos os temas →
          </Link>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold mb-2">Artigos recentes</h2>
          <p className="text-khoros-slate mb-8">
            Leituras acolhedoras, baseadas em evidências e revisadas por profissionais.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map((article) => (
              <ArticleCard key={`${article.category}-${article.slug}`} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-khoros-warm border border-border rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl font-semibold mb-4">
            Converse com um especialista na hora
          </h2>
          <p className="text-khoros-slate max-w-xl mx-auto mb-6">
            Psicólogos com CRP verificado, por vídeo, pagando só os minutos que usar — sem
            hora marcada. Entre na plataforma ou crie sua conta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/entrar"
              className="inline-flex justify-center px-8 py-3 bg-khoros-cyan text-white font-medium rounded-full hover:bg-khoros-cyan-dark transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex justify-center px-8 py-3 border-2 border-khoros-cyan text-khoros-cyan-dark font-medium rounded-full hover:bg-khoros-mint transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
        <p className="text-xs text-khoros-slate mt-8 italic max-w-2xl mx-auto">
          {siteConfig.goldenRule}
        </p>
      </section>
    </>
  );
}
