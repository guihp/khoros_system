import type { Metadata } from "next";
import Image from "next/image";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { siteConfig } from "@/lib/blog/site";

export const metadata: Metadata = {
  title: "Como a KHOROS vai funcionar",
  description:
    "Conheça a proposta da KHOROS: consultoria instantânea por vídeo com especialistas em saúde mental, paga por minuto, sem agendamento.",
};

const steps = [
  {
    title: "Você precisa de orientação",
    description:
      "Em um momento de ansiedade, dúvida ou conflito, você acessa a KHOROS pelo celular ou computador.",
    image: "/images/steps/conectar.jpg",
    imageAlt: "Pessoa buscando orientação pelo celular",
  },
  {
    title: "Conectamos na hora",
    description:
      "Sem burocracia de agenda. Um psicólogo disponível se conecta com você por vídeo em minutos.",
    image: "/images/steps/video.jpg",
    imageAlt: "Consulta por vídeo com profissional de saúde mental",
  },
  {
    title: "Pague só pelos minutos",
    description:
      "Transparência total: você paga apenas pelo tempo de conversa utilizado. Sem mensalidade, sem pacote fechado.",
    image: "/images/steps/minutos.jpg",
    imageAlt: "Relógio representando pagamento por minuto",
  },
  {
    title: "Com privacidade e sigilo",
    description:
      "Ambiente seguro, sigilo profissional e profissionais registrados no CRP, seguindo a regulamentação do CFP.",
    image: "/images/steps/privacidade.jpg",
    imageAlt: "Ambiente privado e seguro para atendimento",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-12">
        <p className="text-khoros-cyan-dark font-medium mb-2 uppercase text-sm tracking-wide">
          Em fase de lançamento
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-4">
          Como a KHOROS vai funcionar
        </h1>
        <p className="text-lg text-khoros-slate leading-relaxed">
          A KHOROS nasce para tornar o acesso à saúde mental mais simples, humano e imediato.
          Ainda estamos construindo a plataforma — mas já queremos ouvir você.
        </p>
      </header>

      <div className="space-y-6 mb-12">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row gap-4 p-6 bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="relative h-32 sm:h-24 sm:w-32 shrink-0 rounded-xl overflow-hidden">
              <Image
                src={step.image}
                alt={step.imageAlt}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">{step.title}</h2>
              <p className="text-khoros-slate">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-khoros-mint/50 border border-border rounded-2xl p-6 sm:p-8 mb-12">
        <h2 className="text-xl font-semibold mb-3">Por que estamos fazendo isso?</h2>
        <p className="text-khoros-slate leading-relaxed mb-4">
          Muitas pessoas precisam de orientação profissional, mas enfrentam barreiras: falta de
          horário, dificuldade de agendar, custo fixo alto ou simplesmente não saber por onde começar.
          A KHOROS quer reduzir essas barreiras com um modelo flexível e acolhedor.
        </p>
        <p className="text-khoros-slate leading-relaxed">
          Este blog é a primeira etapa: validar, com conteúdo de qualidade, quantas pessoas ainda
          precisam de atendimento mesmo após se informar. Acolher sempre vem antes de converter.
        </p>
      </section>

      <section
        id="lista-espera"
        className="bg-khoros-warm border border-border rounded-3xl p-8 text-center"
      >
        <h2 className="text-2xl font-semibold mb-3">Quer ser avisado(a)?</h2>
        <p className="text-khoros-slate mb-6 max-w-md mx-auto">
          Atendimento online, de qualquer lugar. Avisamos por e-mail quando a KHOROS estiver
          disponível para você falar com um especialista. Sem pressão, sem venda.
        </p>
        <WaitlistForm />
      </section>

      <p className="text-xs text-khoros-slate text-center mt-8 italic">
        {siteConfig.disclaimer}
      </p>
    </div>
  );
}
