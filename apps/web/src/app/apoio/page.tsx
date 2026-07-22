import { CRISIS_CHANNELS } from "@khoros/shared";

export default function ApoioPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-calm-900">Apoio imediato</h1>
      <p className="mt-2 text-sm text-calm-600">
        Se você está em crise, pensando em se machucar, ou vivendo uma situação de violência ou
        emergência, procure ajuda agora por um destes canais. A KHOROS é um espaço de
        acompanhamento contínuo e não substitui atendimento de urgência ou emergência.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {CRISIS_CHANNELS.map((canal) => (
          <div key={canal.nome} className="rounded-card border border-brand-200 bg-brand-50 p-5">
            <p className="text-base font-semibold text-calm-900">{canal.nome}</p>
            <p className="mt-1 text-lg font-medium text-brand-700">{canal.contato}</p>
            <p className="mt-1 text-sm text-calm-600">{canal.detalhe}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-calm-200 bg-white p-5">
        <p className="text-sm font-medium text-calm-900">Chat online</p>
        <p className="mt-1 text-sm text-calm-600">
          O CVV também atende por chat, 24 horas por dia, em{" "}
          <a
            href="https://cvv.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline hover:text-brand-800"
          >
            cvv.org.br
          </a>
          .
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-calm-600">
        Você não está sozinho(a). Pedir ajuda é um ato de cuidado consigo mesmo(a).
      </p>
    </main>
  );
}
