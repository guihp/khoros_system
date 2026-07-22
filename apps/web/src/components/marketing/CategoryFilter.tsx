"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categories } from "@/lib/blog/categories";

export function CategoryFilter() {
  const searchParams = useSearchParams();
  const active = searchParams.get("categoria");

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link
        href="/blog"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !active
            ? "bg-khoros-cyan text-white"
            : "bg-muted text-khoros-slate hover:bg-khoros-mint"
        }`}
      >
        Todos
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/blog?categoria=${cat.slug}`}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat.slug
              ? "bg-khoros-cyan text-white"
              : "bg-muted text-khoros-slate hover:bg-khoros-mint"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
