/**
 * Tạo danh sách các ngày dạng YYYY-MM-DD từ from (inclusive) đến to (exclusive).
 */
export function buildDateRange(fromISO: string, toISO: string): string[] {
  const from = new Date(fromISO + 'T00:00:00Z');
  const to = new Date(toISO + 'T00:00:00Z');
  if (!(from instanceof Date) || !(to instanceof Date) || isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error('Invalid dates');
  }
  if (to <= from) {
    throw new Error('toDate must be after fromDate');
  }
  const out: string[] = [];
  let cursor = new Date(from);
  while (cursor < to) {
    const yyyy = cursor.getUTCFullYear();
    const mm = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getUTCDate()).padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}