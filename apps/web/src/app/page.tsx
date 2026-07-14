import { formatBRL } from "@khoros/shared";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-calm-900">
        Um espaço seguro para conversar, <span className="text-brand-600">agora</span>.
      </h1>
      <p className="mt-4 text-lg text-calm-600">
        Psicólogos verificados pelo CRP, por vídeo, pagando apenas os minutos que usar — a
        partir de {formatBRL(200)}/minuto.
      </p>
      <p className="mt-10 text-sm text-calm-400">
        Plataforma em construção · Slice 0 (fundação) concluído
      </p>
    </main>
  );
}
