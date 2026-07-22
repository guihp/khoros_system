/** Helpers de formatação do perfil do paciente — reutiliza o DNA do painel pro. */

export {
  formatMinutesFromSeconds,
  formatSessionDuration,
  formatSessionWhen,
  firstName,
} from "@/components/pro/format-pro";

export function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function sessionStatusLabel(status: string): string {
  switch (status) {
    case "ENDED":
      return "Encerrada";
    case "ACTIVE":
      return "Em andamento";
    case "SUSPENDED":
      return "Suspensa";
    case "PENDING":
      return "Pendente";
    default:
      return status;
  }
}
