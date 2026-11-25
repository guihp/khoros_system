import { parseTermText } from "@khoros/shared";

/** Renderiza o texto simples de um termo (parágrafos + itens "- "). */
export function TermText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-2 text-sm text-calm-600 ${className}`}>
      {parseTermText(text).map((b, i) =>
        b.kind === "p" ? (
          <p key={i}>{b.text}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
