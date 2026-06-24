import { Fragment, type ReactNode } from "react";

/**
 * Renderizador Markdown ligero para la recomendación del LLM.
 *
 * El modelo devuelve Markdown (encabezados `#`, **negritas**, *cursivas* y
 * listas numeradas/viñetas). En lugar de añadir una dependencia pesada
 * (react-markdown + remark) que arriesga incompatibilidades con Next.js 16,
 * parseamos el subconjunto que el prompt produce y lo maquetamos con la
 * estética plana oscura/dorada de OmniCine. Soporta justo lo necesario:
 * encabezados, párrafos, listas ordenadas (con badge numérico) y viñetas.
 */

// --- Inline: **negrita** y *cursiva* -----------------------------------------
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Captura **negrita** o *cursiva* (contenido sin asteriscos internos).
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("**")) {
      nodes.push(
        <strong key={i++} className="font-semibold text-white">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={i++} className="font-medium text-white/90 not-italic">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return nodes;
}

// --- Bloques ------------------------------------------------------------------
type Block =
  | { kind: "h"; level: number; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; ordered: boolean; num?: string; text: string };

function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ") });
      para = [];
    }
  };
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.+)/);
    if (h) {
      flush();
      blocks.push({ kind: "h", level: h[1].length, text: h[2] });
      continue;
    }
    const ol = line.match(/^(\d+)[.)]\s+(.+)/);
    if (ol) {
      flush();
      blocks.push({ kind: "li", ordered: true, num: ol[1], text: ol[2] });
      continue;
    }
    const ul = line.match(/^[-•]\s+(.+)/);
    if (ul) {
      flush();
      blocks.push({ kind: "li", ordered: false, text: ul[1] });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

export default function AssistantAnswer({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.kind === "h") {
          return (
            <h3
              key={idx}
              className="pt-1 text-sm font-semibold tracking-wide text-white"
            >
              {renderInline(b.text)}
            </h3>
          );
        }
        if (b.kind === "li") {
          return (
            <div key={idx} className="flex gap-3">
              {b.ordered ? (
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-300 ring-1 ring-gold-500/30">
                  {b.num}
                </span>
              ) : (
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/70" />
              )}
              <p className="text-sm leading-relaxed text-white/80">
                {renderInline(b.text)}
              </p>
            </div>
          );
        }
        return (
          <p key={idx} className="text-sm leading-relaxed text-white/75">
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}
