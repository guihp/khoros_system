import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade (LGPD)",
  description: "Como a KHOROS coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-khoros">
      <h1 className="text-3xl font-bold font-serif mb-6">Política de Privacidade</h1>
      <p><em>Última atualização: julho de 2025</em></p>

      <h2>1. Quem somos</h2>
      <p>
        A KHOROS é responsável pelo tratamento dos dados pessoais coletados neste site,
        em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li><strong>Lista de aviso:</strong> nome e e-mail (quando você se inscreve voluntariamente)</li>
        <li><strong>Analytics:</strong> dados anonimizados de navegação (páginas visitadas, origem do tráfego)</li>
        <li><strong>Eventos de validação:</strong> interações com o bloco &quot;Este conteúdo ajudou você?&quot; (sem identificação pessoal)</li>
      </ul>

      <h2>3. Finalidade</h2>
      <p>Utilizamos seus dados para:</p>
      <ul>
        <li>Avisá-lo(a) quando a plataforma KHOROS estiver disponível para atendimento online</li>
        <li>Medir interesse e demanda por temas e regiões (validação Onda 0)</li>
        <li>Melhorar a experiência e o conteúdo do blog</li>
      </ul>

      <h2>4. Base legal</h2>
      <p>
        O tratamento baseia-se no consentimento (art. 7º, I, LGPD) para a lista de espera,
        e no legítimo interesse (art. 7º, IX) para analytics anonimizados.
      </p>

      <h2>5. Compartilhamento</h2>
      <p>
        Não vendemos seus dados. Podemos compartilhar com provedores de infraestrutura
        (hospedagem, banco de dados, analytics) sob contratos de proteção de dados.
      </p>

      <h2>6. Seus direitos</h2>
      <p>Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados
        entrando em contato pelo e-mail: privacidade@khoros.com.br</p>

      <h2>7. Retenção</h2>
      <p>
        Mantemos os dados da lista de espera enquanto a plataforma não for lançada ou até
        você solicitar a exclusão.
      </p>
    </div>
  );
}
