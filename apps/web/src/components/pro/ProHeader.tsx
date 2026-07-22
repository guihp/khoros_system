import Link from "next/link";
import type { CrpStatus } from "@khoros/shared";
import { firstName, greetingForNow } from "./format-pro";

interface ProHeaderProps {
  fullName: string | null | undefined;
  crpNumero: string | undefined;
  crpRegiao: string | undefined;
  crpStatus: CrpStatus | undefined;
  publicProfileId: string | undefined;
}

export function ProHeader({
  fullName,
  crpNumero,
  crpRegiao,
  crpStatus,
  publicProfileId,
}: ProHeaderProps) {
  const name = firstName(fullName);
  const verified = crpStatus === "VERIFIED";

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm text-calm-600">{greetingForNow()}{name ? "," : ""}</p>
        <h1 className="font-display text-3xl tracking-tight text-calm-900 sm:text-4xl">
          {name || "Seu painel"}
        </h1>
        {crpNumero && crpRegiao && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-calm-600">
            <span>
              CRP {crpNumero}/{crpRegiao}
            </span>
            {verified ? (
              <span className="inline-flex items-center rounded-md bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-600">
                Verificado
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-warn-100 px-2 py-0.5 text-xs font-medium text-warn-700">
                {crpStatus === "PENDING" ? "Em análise" : "Pendência"}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/perfil" className="font-medium text-brand-700 underline hover:text-brand-800">
          Editar perfil
        </Link>
        {publicProfileId && (
          <Link
            href={`/profissional/${publicProfileId}`}
            className="font-medium text-calm-600 underline hover:text-calm-800"
          >
            Ver perfil público
          </Link>
        )}
      </div>
    </header>
  );
}
