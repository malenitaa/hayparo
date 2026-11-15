// Serializa JSON-LD para meterlo dentro de un <script> con
// dangerouslySetInnerHTML. JSON.stringify no escapa "<", así que un texto
// con "</script>" (por ejemplo un `message` que vino de Gemini) cerraría el
// bloque y lo que siga se interpretaría como HTML. "\u003c" es el mismo
// carácter para cualquier parser de JSON, así que el JSON-LD sigue válido.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
