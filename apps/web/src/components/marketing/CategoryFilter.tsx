"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface CategoryFilterProps {
  categories: Array<{ slug: string; name: string }>;
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const searchParams = useSearchParams();
  const active = searchParams.get("categoria");

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 mb-10 overflow-x-auto sm:flex-wrap pb-1 [scrollbar-width:none]">
      <Link
        href="/blog"
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ring-1 ${
          !active
            ? "bg-brand-600 text-white ring-brand-600"
            : "bg-white text-calm-700 ring-calm-200 hover:ring-brand-300 hover:text-brand-800"
        }`}
      >
        Todos
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/blog?categoria=${cat.slug}`}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ring-1 ${
            active === cat.slug
              ? "bg-brand-600 text-white ring-brand-600"
              : "bg-white text-calm-700 ring-calm-200 hover:ring-brand-300 hover:text-brand-800"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
