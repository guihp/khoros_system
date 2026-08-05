import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Article } from "@/lib/blog/content";
import { CategoryImage } from "./CategoryImage";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryName = article.categoryName;
  const imageSrc = article.image || "/images/categories/saude-emocional.jpg";
  const imageAlt = article.imageAlt || article.title;

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/blog/${article.category}/${article.slug}`}>
        <CategoryImage src={imageSrc} alt={imageAlt} variant="card" />
        <div className="p-5">
          {categoryName && (
            <span className="text-xs font-medium text-khoros-cyan-dark uppercase tracking-wide">
              {categoryName}
            </span>
          )}
          <h3 className="font-semibold text-foreground mt-1 mb-2 group-hover:text-khoros-cyan-dark transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-khoros-slate line-clamp-2 mb-3">
            {article.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-khoros-slate">
            <time dateTime={article.publishedAt}>
              {format(new Date(article.publishedAt), "d 'de' MMMM yyyy", { locale: ptBR })}
            </time>
            <span>·</span>
            <span>{article.readingTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
