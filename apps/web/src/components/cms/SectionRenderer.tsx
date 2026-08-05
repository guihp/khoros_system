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
  /** When set to "home", ensures dual signup CTAs (paciente + psicólogo). */
  pageSlug?: string;
}

type CtaButton = CmsSectionConfig<"hero">["ctas"][number];

function buttonClass(variant: CtaButton["variant"] = "primary"): string {
  if (variant === "secondary") {
    return "inline-flex justify-center px-8 py-3 border-2 border-khoros-cyan text-khoros-cyan-dark font-medium rounded-full hover:bg-khoros-mint transition-colors";
  }
  if (variant === "link") {
    return "text-khoros-cyan-dark font-medium hover:underline";
  }
  return "inline-flex justify-center px-8 py-3 bg-khoros-cyan text-white font-medium rounded-full hover:bg-khoros-cyan-dark transition-colors";
}

/** Expand bare /cadastro into dual role CTAs; inject them on home if missing. */
function resolveCtaButtons(
  buttons: CtaButton[],
  opts: { ensureDualSignup?: boolean },
): CtaButton[] {
  const expanded: CtaButton[] = [];
  for (const btn of buttons) {
    const isBareCadastro =
      btn.href === "/cadastro" ||
      (btn.href.startsWith("/cadastro?") && !/[?&]role=/.test(btn.href));
    if (isBareCadastro) {
      expanded.push({
        label: "Sou paciente",
        href: "/cadastro?role=PATIENT",
        variant: "primary",
      });
      expanded.push({
        label: "Sou psicólogo",
        href: "/cadastro?role=PSYCHOLOGIST",
        variant: "secondary",
      });
      continue;
    }
    expanded.push(btn);
  }

  const hasPatient = expanded.some((b) => b.href.includes("role=PATIENT"));
  const hasPsych = expanded.some((b) => b.href.includes("role=PSYCHOLOGIST"));
  if (opts.ensureDualSignup && !(hasPatient && hasPsych)) {
    return [
      {
        label: "Sou paciente",
        href: "/cadastro?role=PATIENT",
        variant: "primary",
      },
      {
        label: "Sou psicólogo",
        href: "/cadastro?role=PSYCHOLOGIST",
        variant: "secondary",
      },
      ...expanded.filter((b) => !b.href.startsWith("/cadastro")),
    ];
  }
  return expanded;
}

function HeroSection({ config }: { config: CmsSectionConfig<"hero"> }) {
  const ctas = config.ctas ?? [];
  return (
    <section className="bg-gradient-to-b from-khoros-mint/60 to-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        {config.eyebrow && (
          <p className="text-khoros-cyan-dark font-medium mb-4 tracking-wide uppercase text-sm">
            {config.eyebrow}
          </p>
        )}
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-serif leading-tight max-w-3xl mx-auto">
          {config.title}
        </h1>
        {config.subtitle && (
          <p className="text-lg text-khoros-slate max-w-2xl mx-auto mb-8 leading-relaxed">
            {config.subtitle}
          </p>
        )}
        {ctas.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {ctas.map((cta) => (
              <Link key={`${cta.href}-${cta.label}`} href={cta.href} className={buttonClass(cta.variant)}>
                {cta.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function CategoryGridSection({ config }: { config: CmsSectionConfig<"category_grid"> }) {
  const categories = await getAllCategories();
  const featured = categories.slice(0, config.limit ?? 6);
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="text-2xl font-semibold mb-2">{config.title ?? "Temas em destaque"}</h2>
      <p className="text-khoros-slate mb-8">
        Conteúdo organizado por assunto para facilitar sua busca.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featured.map((cat) => (
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
  );
}

async function ArticleListSection({ config }: { config: CmsSectionConfig<"article_list"> }) {
  const articles = config.categorySlug
    ? (await getAllArticles()).filter((a) => a.category === config.categorySlug)
    : await getAllArticles();
  const items = articles.slice(0, config.limit ?? 6);
  return (
    <section className="bg-muted/50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-semibold mb-2">{config.title ?? "Artigos recentes"}</h2>
        <p className="text-khoros-slate mb-8">
          Leituras acolhedoras, baseadas em evidências e revisadas por profissionais.
        </p>
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

function CtaBandSection({
  config,
  ensureDualSignup,
}: {
  config: CmsSectionConfig<"cta_band">;
  ensureDualSignup?: boolean;
}) {
  const buttons = resolveCtaButtons(config.buttons, { ensureDualSignup });
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="bg-khoros-warm border border-border rounded-3xl p-8 sm:p-12">
        <h2 className="text-2xl font-semibold mb-4">{config.title}</h2>
        {config.text && (
          <p className="text-khoros-slate max-w-xl mx-auto mb-6">{config.text}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {buttons.map((btn) => (
            <Link key={`${btn.href}-${btn.label}`} href={btn.href} className={buttonClass(btn.variant)}>
              {btn.label}
            </Link>
          ))}
        </div>
        {!buttons.some((b) => b.href.startsWith("/entrar")) && (
          <p className="mt-5 text-sm text-khoros-slate">
            Já tem conta?{" "}
            <Link href="/entrar" className="text-khoros-cyan-dark font-medium hover:underline">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

function FaqSection({ config }: { config: CmsSectionConfig<"faq"> }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {config.title && <h2 className="text-xl font-semibold mb-4">{config.title}</h2>}
      <FAQAccordion items={config.items} id={config.title ? `faq-${config.title}` : undefined} />
    </section>
  );
}

function StepsSection({ config }: { config: CmsSectionConfig<"steps"> }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {config.title && <h2 className="text-2xl font-semibold mb-6 text-center">{config.title}</h2>}
      <div className="space-y-6">
        {config.items.map((step, i) => (
          <div
            key={`${step.title}-${i}`}
            className="flex flex-col sm:flex-row gap-4 p-6 bg-card border border-border rounded-2xl"
          >
            <div className="sm:w-10 shrink-0 text-khoros-cyan-dark font-serif text-2xl font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
              <p className="text-khoros-slate">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CrisisBannerSection({ config }: { config: CmsSectionConfig<"crisis_banner"> }) {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div role="alert" className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
        <p className="font-semibold text-amber-900 mb-2">{config.title}</p>
        <p className="text-sm text-amber-800 mb-3">{config.text}</p>
        <CrisisResources variant="inline" />
      </div>
    </section>
  );
}

function ValidationBlockSection({ config }: { config: CmsSectionConfig<"validation_block"> }) {
  return (
    <section
      id="lista-espera"
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
    >
      <div className="bg-khoros-warm border border-border rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-semibold mb-3">{config.title}</h2>
        <p className="text-khoros-slate mb-6 max-w-md mx-auto">{config.text}</p>
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
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 text-center">
      {config.title && <h2 className="text-lg font-semibold mb-2">{config.title}</h2>}
      <p className="text-xs text-khoros-slate italic max-w-2xl mx-auto">{config.text}</p>
    </section>
  );
}

async function renderSection(
  section: SectionWithMeta,
  opts: { ensureDualSignup?: boolean },
) {
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
      return (
        <CtaBandSection
          key={section.id}
          config={section.config}
          ensureDualSignup={opts.ensureDualSignup}
        />
      );
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
  const ensureDualSignup = pageSlug === "home";
  const hasCtaBand = sections.some((s) => s.type === "cta_band");

  const rendered = await Promise.all(
    sections.map((section) => renderSection(section, { ensureDualSignup })),
  );

  return (
    <>
      {rendered}
      {ensureDualSignup && !hasCtaBand && (
        <CtaBandSection
          ensureDualSignup
          config={{
            title: "Converse com um especialista na hora",
            text: "Psicólogos com CRP verificado, por vídeo, pagando só os minutos que usar — sem hora marcada. Crie sua conta como paciente ou como profissional.",
            buttons: [
              { label: "Sou paciente", href: "/cadastro?role=PATIENT", variant: "primary" },
              { label: "Sou psicólogo", href: "/cadastro?role=PSYCHOLOGIST", variant: "secondary" },
            ],
          }}
        />
      )}
      {ensureDualSignup && !sections.some((s) => s.type === "disclaimer") && (
        <DisclaimerSection config={{ text: siteConfig.goldenRule }} />
      )}
    </>
  );
}
