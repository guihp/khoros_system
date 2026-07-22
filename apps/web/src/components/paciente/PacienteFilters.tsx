"use client";

export const ESPECIALIDADE_OPTIONS = [
  "Ansiedade",
  "Depressão",
  "Burnout",
  "Estresse",
  "Luto",
  "Autoestima",
  "Relacionamentos",
  "Terapia de casal",
  "Conflitos familiares",
  "Síndrome do impostor",
  "Dependência emocional",
  "Saúde emocional",
] as const;

export const ABORDAGEM_OPTIONS = [
  "TCC",
  "Psicanálise",
  "Gestalt",
  "Humanista",
  "ACT",
  "Terapia sistêmica",
  "Terapia cognitivo-comportamental",
] as const;

export const MIN_NOTA_OPTIONS = [
  { value: "", label: "Qualquer" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4,5+" },
  { value: "5", label: "5" },
] as const;

export interface PacienteFilterValues {
  q: string;
  especialidade: string;
  abordagem: string;
  precoMin: string;
  precoMax: string;
  minNota: string;
  disponivel: boolean;
}

interface PacienteFiltersProps {
  values: PacienteFilterValues;
  onChange: (patch: Partial<PacienteFilterValues>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const fieldClass =
  "w-full rounded-md border border-calm-200 bg-white px-3 py-2 text-sm text-calm-900 outline-none placeholder:text-calm-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200";

export function PacienteFilters({
  values,
  onChange,
  onClear,
  hasActiveFilters,
}: PacienteFiltersProps) {
  return (
    <section
      aria-label="Busca e filtros"
      className="rounded-card border border-calm-200/80 bg-white/90 p-4 shadow-[0_1px_0_rgba(22,34,34,0.04)] sm:p-5"
    >
      <label className="block">
        <span className="sr-only">Buscar por nome</span>
        <input
          type="search"
          value={values.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Buscar por nome…"
          autoComplete="off"
          className={fieldClass}
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-calm-600">Especialidade</span>
          <select
            value={values.especialidade}
            onChange={(e) => onChange({ especialidade: e.target.value })}
            className={fieldClass}
          >
            <option value="">Todas</option>
            {ESPECIALIDADE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-calm-600">Abordagem</span>
          <select
            value={values.abordagem}
            onChange={(e) => onChange({ abordagem: e.target.value })}
            className={fieldClass}
          >
            <option value="">Todas</option>
            {ABORDAGEM_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-calm-600">Preço mín. (R$/min)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={values.precoMin}
            onChange={(e) => onChange({ precoMin: e.target.value })}
            placeholder="0"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-calm-600">Preço máx. (R$/min)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={values.precoMax}
            onChange={(e) => onChange({ precoMax: e.target.value })}
            placeholder="—"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-calm-600">Nota mínima</span>
          <select
            value={values.minNota}
            onChange={(e) => onChange({ minNota: e.target.value })}
            className={fieldClass}
          >
            {MIN_NOTA_OPTIONS.map((opt) => (
              <option key={opt.value || "any"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-calm-600">Disponibilidade</span>
          <button
            type="button"
            aria-pressed={values.disponivel}
            onClick={() => onChange({ disponivel: !values.disponivel })}
            className={`inline-flex h-[38px] items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors ${
              values.disponivel
                ? "border-sage-600/30 bg-sage-100 text-sage-600"
                : "border-calm-200 bg-calm-50 text-calm-600 hover:border-calm-300"
            }`}
          >
            Só disponíveis agora
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-brand-700 underline hover:text-brand-800"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </section>
  );
}
