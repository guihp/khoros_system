import { blogHref } from "@/lib/hosts";
import Image from "next/image";
import Link from "next/link";
import type { CmsSection, CmsSectionConfig } from "@khoros/shared";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { CategoryImage } from "@/components/marketing/CategoryImage";
import { CrisisResources } from "@/components/marketing/CrisisResources";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { MDXContent } from "@/components/marketing/MDXContent";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { getAllArticles } from "@/lib/blog/content";
import { getAllCategories } from "@/lib/blog/categories";
import { siteConfig } from "@/lib/blog/site";

type SectionWithMeta = CmsSection & { id: string; position: number };

interface SectionRendererProps {
  sections: SectionWithMeta[];
  /** Used for home-only fallbacks (e.g. disclaimer). */
  pageSlug?: string;
}

type CtaButton = CmsSectionConfig<"hero">["ctas"][number];

function buttonClass(variant: CtaButton["variant"] = "primary"): string {
  if (variant === "secondary") return "btn-secondary";
  if (variant === "link") return "font-semibold text-brand-700 hover:text-brand-800 underline-offset-4 hover:underline";
  return "btn-primary";
}

function SectionHeading({
  eyebrow,
  title,
  text,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "text-center mx-auto" : ""}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-3xl sm:text-[2.1rem] font-semibold text-calm-900 leading-tight">{title}</h2>
      {text && <p className="mt-3 text-calm-600 text-lg leading-relaxed">{text}</p>}
    </div>
  );
}

const HERO_POINTS = [
  "Conteúdo baseado em evidências",
  "Acolhimento sem julgamento",
  "Privacidade e sigilo (LGPD)",
];

// Onda 0: CTAs de cadastro (Sou paciente / Sou psicólogo) removidos do marketing.
// Para relançar: restaurar links em Header.tsx + reativar expansão de /cadastro aqui.

function HeroSection({ config }: { config: CmsSectionConfig<"hero"> }) {
  const ctas = config.ctas ?? [];
  return (
    <section className="atmosphere-hero relative overflow-hidden -mt-[72px] pt-[72px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-rise-in">
          {config.eyebrow && (
            <p className="eyebrow mb-5">
              <span className="h-px w-6 bg-brand-400" aria-hidden />
              {config.eyebrow}
            </p>
          )}
          <h1 className="text-[2.4rem] leading-[1.1] sm:text-5xl lg:text-[3.4rem] font-semibold text-calm-900">
            {config.title}
          </h1>
          {config.subtitle && (
            <p className="mt-6 text-lg text-calm-600 max-w-xl leading-relaxed">{config.subtitle}</p>
          )}
          {ctas.length > 0 && (
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              {ctas.map((cta) => (
                <Link key={`${cta.href}-${cta.label}`} href={cta.href} className={buttonClass(cta.variant)}>
                  {cta.label}
                </Link>
              ))}
            </div>
          )}
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-calm-600">
            {HERO_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-500" aria-hidden>
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden lg:block" aria-hidden>
          <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-100/60 rotate-3" />
          <div className="relative rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-700 p-12 shadow-[var(--shadow-lift)]">
            <Image
              src="/brand/butterfly-white.png"
              alt=""
              width={800}
              height={560}
              priority
              className="w-full h-auto opacity-95 animate-drift-slow"
            />
            <p className="mt-8 text-center font-display text-white/90 text-lg tracking-wide">
              cuidado · escuta · confiança
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function CategoryGridSection({ config }: { config: CmsSectionConfig<"category_grid"> }) {
  const [categories, articles] = await Promise.all([getAllCategories(), getAllArticles()]);
  const publishedSlugs = new Set(articles.map((a) => a.category));
  const visibleCategories = categories.filter((c) => publishedSlugs.has(c.slug));
  const featured = visibleCategories.slice(0, config.limit ?? 6);
  if (featured.length === 0) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <SectionHeading
        eyebrow="Explore por tema"
        title={config.title ?? "Temas em destaque"}
        text="Conteúdo organizado por assunto para facilitar sua busca."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {featured.map((cat) => (
          <Link
            key={cat.slug}
            href={blogHref(`/categoria/${cat.slug}`)}
            className="group bg-white rounded-[var(--radius-card)] overflow-hidden ring-1 ring-calm-200 hover:ring-brand-200 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <CategoryImage src={cat.image} alt={cat.imageAlt} variant="card" />
            <div className="p-5">
              <h3 className="font-semibold text-calm-900 group-hover:text-brand-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-sm text-calm-600 mt-1 line-clamp-2">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link href={blogHref("/")} className="btn-secondary">
          Ver todos os temas
        </Link>
      </div>
    </section>
  );
}

async function ArticleListSection({ config }: { config: CmsSectionConfig<"article_list"> }) {
  const articles = config.categorySlug
    ? (await getAllArticles()).filter((a) => a.category === config.categorySlug)
    : await getAllArticles();
  const items = articles.slice(0, config.limit ?? 6);
  if (items.length === 0) return null;
  return (
    <section className="bg-brand-50/70 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Leituras"
          title={config.title ?? "Artigos recentes"}
          text="Leituras acolhedoras e baseadas em evidências."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((article) => (
            <ArticleCard key={`${article.category}-${article.slug}`} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RichTextSection({ config }: { config: CmsSectionConfig<"rich_text"> }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <MDXContent source={config.markdown} />
    </section>
  );
}

function CtaBandSection({ config }: { config: CmsSectionConfig<"cta_band"> }) {
  const buttons = config.buttons;
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-800 px-6 py-14 sm:px-14 text-center">
        <Image
          src="/brand/butterfly-white.png"
          alt=""
          aria-hidden
          width={400}
          height={280}
          className="pointer-events-none absolute -right-10 -bottom-10 w-72 opacity-[0.08]"
        />
        <h2 className="relative text-3xl font-semibold text-white mb-4">{config.title}</h2>
        {config.text && (
          <p className="relative text-brand-100 max-w-xl mx-auto mb-8 text-lg">{config.text}</p>
        )}
        <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
          {buttons.map((btn) => (
            <Link
              key={`${btn.href}-${btn.label}`}
              href={btn.href}
              className={
                btn.variant === "secondary"
                  ? "btn-secondary !bg-transparent !text-white !border-white/30 hover:!bg-white/10"
                  : btn.variant === "link"
                    ? "font-semibold text-white underline-offset-4 hover:underline"
                    : "btn-primary !bg-white !text-brand-800 hover:!bg-brand-50"
              }
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ config }: { config: CmsSectionConfig<"faq"> }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {config.title && <h2 className="text-2xl font-semibold text-calm-900 mb-6">{config.title}</h2>}
      <FAQAccordion items={config.items} id={config.title ? `faq-${config.title}` : undefined} />
    </section>
  );
}

function StepsSection({ config }: { config: CmsSectionConfig<"steps"> }) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {config.title && <SectionHeading eyebrow="Passo a passo" title={config.title} center />}
      <ol className="grid gap-5 md:grid-cols-2">
        {config.items.map((step, i) => (
          <li
            key={`${step.title}-${i}`}
            className="relative flex gap-5 p-6 sm:p-7 bg-white rounded-[var(--radius-card)] ring-1 ring-calm-200 shadow-[var(--shadow-soft)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-lg font-semibold text-brand-700">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-lg text-calm-900 mb-1.5">{step.title}</h3>
              <p className="text-calm-600 leading-relaxed">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CrisisBannerSection({ config }: { config: CmsSectionConfig<"crisis_banner"> }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div role="alert" className="bg-sand-50 ring-1 ring-sand-100 rounded-2xl p-5 sm:p-6">
        <p className="font-semibold text-calm-900 mb-2">{config.title}</p>
        <p className="text-sm text-calm-700 mb-3">{config.text}</p>
        <CrisisResources variant="inline" />
      </div>
    </section>
  );
}

function ValidationBlockSection({ config }: { config: CmsSectionConfig<"validation_block"> }) {
  return (
    <section
      id="lista-espera"
      className="max-w-3xl mx-auto px-4 sm:px-6 py-12 scroll-mt-24"
    >
      <div className="relative overflow-hidden bg-white ring-1 ring-brand-100 shadow-[var(--shadow-lift)] rounded-[2rem] p-8 sm:p-12 text-center">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-300 via-brand-500 to-brand-300" aria-hidden />
        <Image
          src="/brand/butterfly-green.png"
          alt=""
          aria-hidden
          width={120}
          height={84}
          className="mx-auto mb-5 h-12 w-auto opacity-80"
        />
        <h2 className="text-3xl font-semibold text-calm-900 mb-3">{config.title}</h2>
        <p className="text-calm-600 mb-8 max-w-md mx-auto text-lg">{config.text}</p>
        {config.formId === "waitlist" ? (
          <WaitlistForm />
        ) : config.cta ? (
          <Link href={config.cta.href} className={buttonClass(config.cta.variant)}>
            {config.cta.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function DisclaimerSection({ config }: { config: CmsSectionConfig<"disclaimer"> }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 pt-4 text-center">
      {config.title && <h2 className="text-base font-semibold text-calm-800 mb-2">{config.title}</h2>}
      <p className="text-xs text-calm-500 italic max-w-2xl mx-auto leading-relaxed">{config.text}</p>
    </section>
  );
}

async function renderSection(section: SectionWithMeta) {
  switch (section.type) {
    case "hero":
      return <HeroSection key={section.id} config={section.config} />;
    case "category_grid":
      return <CategoryGridSection key={section.id} config={section.config} />;
    case "article_list":
      return <ArticleListSection key={section.id} config={section.config} />;
    case "rich_text":
      return <RichTextSection key={section.id} config={section.config} />;
    case "cta_band":
      return <CtaBandSection key={section.id} config={section.config} />;
    case "faq":
      return <FaqSection key={section.id} config={section.config} />;
    case "steps":
      return <StepsSection key={section.id} config={section.config} />;
    case "crisis_banner":
      return <CrisisBannerSection key={section.id} config={section.config} />;
    case "validation_block":
      return <ValidationBlockSection key={section.id} config={section.config} />;
    case "disclaimer":
      return <DisclaimerSection key={section.id} config={section.config} />;
    default:
      return null;
  }
}

export async function SectionRenderer({ sections, pageSlug }: SectionRendererProps) {
  const rendered = await Promise.all(sections.map((section) => renderSection(section)));

  return (
    <>
      {rendered}
      {pageSlug === "home" && !sections.some((s) => s.type === "disclaimer") && (
        <DisclaimerSection config={{ text: siteConfig.goldenRule }} />
      )}
    </>
  );
}
