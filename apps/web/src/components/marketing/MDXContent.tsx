import { MDXRemote } from "next-mdx-remote/rsc";

const components = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl sm:text-[1.7rem] font-semibold text-calm-900 mt-12 mb-4 scroll-mt-24" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold text-calm-900 mt-9 mb-3" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-calm-700 leading-[1.8] mb-5" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc marker:text-brand-400 pl-6 mb-5 space-y-2 text-calm-700 leading-[1.75]" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal marker:text-brand-500 marker:font-semibold pl-6 mb-5 space-y-2 text-calm-700 leading-[1.75]" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-calm-900" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-8 rounded-r-2xl border-l-4 border-brand-400 bg-brand-50 px-6 py-4 text-lg italic text-calm-800"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-600" {...props} />
  ),
};

interface MDXContentProps {
  source: string;
  /** "article": tipografia de leitura (serifada, maior) para o corpo do artigo. */
  variant?: "default" | "article";
}

export function MDXContent({ source, variant = "default" }: MDXContentProps) {
  return (
    <div className={variant === "article" ? "prose-khoros font-serif text-[1.13rem]" : "prose-khoros"}>
      <MDXRemote source={source} components={components} />
    </div>
  );
}
