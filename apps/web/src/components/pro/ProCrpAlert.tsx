import { formatCrp } from "@khoros/shared";
import type { CrpStatus } from "@khoros/shared";

interface ProCrpAlertProps {
  crpNumero: string;
  crpRegiao: string;
  crpStatus: CrpStatus;
}

export function ProCrpAlert({ crpNumero, crpRegiao, crpStatus }: ProCrpAlertProps) {
  if (crpStatus === "VERIFIED") return null;

  return (
    <div className="rounded-card border border-warn-100 bg-warn-100/50 px-4 py-4 text-sm text-warn-700 sm:px-5">
      Sua inscrição ({formatCrp(crpRegiao, crpNumero)}) está{" "}
      {crpStatus === "PENDING" ? "em análise" : "com pendência"} pela administração. Você poderá
      ficar disponível assim que for verificada.
    </div>
  );
}
