import Link from "next/link";

interface ProActiveSessionBannerProps {
  sessionId: string;
}

export function ProActiveSessionBanner({ sessionId }: ProActiveSessionBannerProps) {
  return (
    <div className="rounded-card border border-sage-100 bg-sage-100/40 px-4 py-4 sm:px-5">
      <p className="text-sm text-calm-800">Você tem uma consulta em andamento.</p>
      <Link
        href={`/pro/sessao/${sessionId}`}
        className="mt-2 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
      >
        Voltar para a sessão
      </Link>
    </div>
  );
}
