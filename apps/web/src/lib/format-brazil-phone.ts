/**
 * Celular BR (padrão 9º dígito): DDD (2) + 9 + 8 dígitos → (XX) 9 XXXX-XXXX
 * @see https://www.gov.br/anatel/pt-br/regulado/numeracao/plano-de-numeracao-brasileiro
 */
const MOBILE_DIGITS = 11;

/** Mantém só dígitos, limita a 11 e garante o 9 fixo após o DDD. */
export function normalizeBrazilMobileDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > MOBILE_DIGITS) {
    digits = digits.slice(0, MOBILE_DIGITS);
  }
  if (digits.length > 2 && digits[2] !== "9") {
    digits = `${digits.slice(0, 2)}9${digits.slice(2).replace(/^9/, "")}`.slice(0, MOBILE_DIGITS);
  }
  return digits;
}

/** Máscara de digitação: (XX) 9 XXXX-XXXX */
export function formatBrazilMobileDisplay(digits: string): string {
  const d = normalizeBrazilMobileDigits(digits);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 1) return `(${ddd}) ${rest}`;
  if (rest.length <= 5) return `(${ddd}) ${rest[0]} ${rest.slice(1)}`;
  return `(${ddd}) ${rest[0]} ${rest.slice(1, 5)}-${rest.slice(5)}`;
}

export function isValidBrazilMobile(digits: string): boolean {
  return /^\d{2}9\d{8}$/.test(normalizeBrazilMobileDigits(digits));
}
