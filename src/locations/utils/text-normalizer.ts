export function toAscii(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function toSlug(input: string): string {
  return toAscii(input).replace(/\s+/g, '-');
}

export function normHeader(h: string): string {
  return toAscii(h).replace(/[^a-z0-9]/g, '');
}