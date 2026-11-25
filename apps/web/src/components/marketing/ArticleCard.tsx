import { blogHref } from "@/lib/hosts";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Article } from "@/lib/blog/content";
import { CategoryImage } from "./CategoryImage";

interface ArticleCardProps {
  article: Article;
  /** Card largo (destaque) com imagem ao lado em telas grandes. */
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const categoryName = article.categoryName;
  const imageSrc = article.image || "/images/categories/saude-emocional.jpg";
  const imageAlt = article.imageAlt || article.title;

  return (
    <article
      className={`group h-full bg-white rounded-[var(--radius-card)] overflow-hidden ring-1 ring-calm-200 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:ring-brand-200 hover:-translate-y-0.5 transition-all duration-300 ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      <Link
        href={blogHref(`/${article.category}/${article.slug}`)}
        className={`flex h-full flex-col ${featured ? "md:grid md:grid-cols-2" : ""}`}
      >
        <CategoryImage
          src={imageSrc}
          alt={imageAlt}
          variant="card"
          className={featured ? "md:h-full md:min-h-64 md:rounded-none" : ""}
        />
        <div className={`flex flex-1 flex-col p-6 ${featured ? "md:p-8 md:justify-center" : ""}`}>
          {categoryName && (
            <span className="self-start rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
              {categoryName}
            </span>
          )}
          <h3
            className={`mt-3 font-semibold text-calm-900 leading-snug group-hover:text-brand-700 transition-colors ${
              featured ? "text-2xl" : "text-lg line-clamp-2"
            }`}
          >
            {article.title}
          </h3>
          <p className={`mt-2 text-calm-600 leading-relaxed ${featured ? "" : "text-sm line-clamp-2"}`}>
            {article.description}
          </p>
          <div className="mt-auto pt-5 flex items-center gap-2 text-xs text-calm-500">
            <time dateTime={article.publishedAt}>
              {format(new Date(article.publishedAt), "d MMM yyyy", { locale: ptBR })}
            </time>
            <span aria-hidden>·</span>
            <span>{article.readingTime}</span>
            <span className="ml-auto font-semibold text-brand-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              Ler →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
