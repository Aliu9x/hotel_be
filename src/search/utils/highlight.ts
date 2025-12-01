export function vnAscii(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

export function buildHighlightParts(source: string, query: string) {
  const asciiSrc = vnAscii(source);
  const asciiQ = vnAscii(query);
  if (!query || !asciiQ) return [{ text: source, matched: false }];
  const idx = asciiSrc.indexOf(asciiQ);
  if (idx === -1) return [{ text: source, matched: false }];
  const parts: { text: string; matched: boolean }[] = [];
  if (idx > 0) parts.push({ text: source.slice(0, idx), matched: false });
  parts.push({ text: source.slice(idx, idx + query.length), matched: true });
  if (idx + query.length < source.length) {
    parts.push({ text: source.slice(idx + query.length), matched: false });
  }
  return parts;
}
