import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do blog e site da KHOROS.",
};

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-khoros">
      <h1 className="text-3xl font-bold font-serif mb-6">Termos de Uso</h1>
      <p><em>Última atualização: julho de 2025</em></p>

      <h2>1. Aceitação</h2>
      <p>
        Ao acessar este site, você concorda com estes termos. Se não concordar, por favor
        não utilize o site.
      </p>

      <h2>2. Natureza do conteúdo</h2>
      <p>
        O blog KHOROS oferece conteúdo informativo e educativo sobre saúde mental.
        Não constitui consulta, diagnóstico ou tratamento profissional.
      </p>

      <h2>3. Lista de espera</h2>
      <p>
        A inscrição na lista de espera não garante acesso à plataforma nem constitui
        relação terapêutica. É um registro de interesse para fins de validação e comunicação futura.
      </p>

      <h2>4. Propriedade intelectual</h2>
      <p>
        Todo conteúdo textual, visual e de marca é propriedade da KHOROS, salvo indicação contrária.
        É permitido compartilhar links para os artigos.
      </p>

      <h2>5. Limitação de responsabilidade</h2>
      <p>
        A KHOROS não se responsabiliza por decisões tomadas com base exclusivamente no conteúdo
        do blog. Em situações de crise, busque ajuda profissional imediata (CVV 188, SAMU 192).
      </p>
    </div>
  );
}
