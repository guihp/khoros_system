import { z } from "zod";

/**
 * Textos dos termos exibidos ao paciente. Editáveis pelo admin
 * (platform_settings: texto_termo_consentimento / texto_termo_lgpd).
 * Formato simples: parágrafos separados por linha em branco; linhas que
 * começam com "- " viram itens de lista.
 */
export const DEFAULT_TERMO_CONSENTIMENTO = `Este é o termo de consentimento para atendimento psicológico online (teleatendimento por vídeo), conforme a Resolução CFP nº 09/2024.

- O atendimento é realizado por psicólogo(a) identificado(a) com nome completo e inscrição ativa no CRP (região/número), em território nacional.
- As sessões não são gravadas. Somente o(a) psicólogo(a) responsável pelo seu atendimento acessa seus registros e prontuário, protegidos por criptografia.
- Recomendamos estar em local privado, com conexão estável. Falhas técnicas podem interromper a sessão.
- O atendimento online não é indicado para situações de crise, urgência ou emergência: nesses casos a plataforma encaminha para canais especializados (CVV 188, SAMU 192, CAPS) e não realiza atendimento presencial nem de emergência.
- Você pode retirar este consentimento e encerrar o atendimento a qualquer momento.`;

export const DEFAULT_TERMO_LGPD = `Seus dados de saúde são sensíveis: usamos criptografia em repouso e em trânsito, e apenas o psicólogo responsável pelo seu atendimento acessa seu prontuário. Você pode solicitar exportação ou exclusão dos seus dados a qualquer momento.`;

export type TermBlock = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

/** Converte o texto simples do termo em blocos (parágrafos / listas). */
export function parseTermText(text: string): TermBlock[] {
  const blocks: TermBlock[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => { if (para.length) blocks.push({ kind: "p", text: para.join(" ") }); para = []; };
    const flushList = () => { if (list.length) blocks.push({ kind: "ul", items: list }); list = []; };
    for (const line of lines) {
      if (/^[-•*]\s+/.test(line)) { flushPara(); list.push(line.replace(/^[-•*]\s+/, "")); }
      else { flushList(); para.push(line); }
    }
    flushPara();
    flushList();
  }
  return blocks;
}

/** Próxima versão: AAAA-MM-DD-vN (N sobe se já houve versão no mesmo dia). */
export function nextTermVersion(current: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const m = current.match(/^(\d{4}-\d{2}-\d{2})-v(\d+)$/);
  const n = m && m[1] === day ? Number(m[2]) + 1 : 1;
  return `${day}-v${n}`;
}

export const termUpdateSchema = z.object({
  tipo: z.enum(["TERMO_CONSENTIMENTO", "LGPD"]),
  texto: z.string().trim().min(20).max(20000),
  /** true = gera nova versão e todos os pacientes precisam aceitar de novo. */
  exigirReaceite: z.boolean(),
});
export type TermUpdate = z.infer<typeof termUpdateSchema>;
