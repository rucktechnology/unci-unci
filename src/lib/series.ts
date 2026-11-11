import type { Expense } from '@/db';

import { DateRange, fromISODate, toISODate } from './period';

const MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export type Bucket = { from: string; to: string; label: string };
export type Granularity = 'day' | 'week' | 'month';

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((fromISODate(to).getTime() - fromISODate(from).getTime()) / 86400000) + 1;
}

function monthBuckets(range: DateRange): Bucket[] {
  const end = fromISODate(range.to);
  const out: Bucket[] = [];
  let cur = fromISODate(range.from);
  while (cur <= end) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const last = monthEnd < end ? monthEnd : end;
    out.push({ from: toISODate(cur), to: toISODate(last), label: MONTHS_SHORT[cur.getMonth()] });
    cur = addDays(last, 1);
  }
  return out;
}

function weekBuckets(range: DateRange): Bucket[] {
  const end = fromISODate(range.to);
  const out: Bucket[] = [];
  let cur = fromISODate(range.from);
  while (cur <= end) {
    const last = addDays(cur, 6) < end ? addDays(cur, 6) : end;
    const a = cur.getDate();
    const b = last.getDate();
    out.push({ from: toISODate(cur), to: toISODate(last), label: a === b ? String(a) : `${a}–${b}` });
    cur = addDays(last, 1);
  }
  return out;
}

function dayBuckets(range: DateRange): Bucket[] {
  const end = fromISODate(range.to);
  const out: Bucket[] = [];
  for (let cur = fromISODate(range.from); cur <= end; cur = addDays(cur, 1)) {
    out.push({ from: toISODate(cur), to: toISODate(cur), label: String(cur.getDate()) });
  }
  return out;
}

/** Granularità del grafico settimanale in base alla durata del periodo. */
export function weeklyGranularity(range: DateRange): Granularity {
  const days = daysBetween(range.from, range.to);
  return days <= 14 ? 'day' : days <= 62 ? 'week' : 'month';
}

export function weeklyBuckets(range: DateRange): Bucket[] {
  const g = weeklyGranularity(range);
  return g === 'day' ? dayBuckets(range) : g === 'week' ? weekBuckets(range) : monthBuckets(range);
}

/** Per il cumulativo: un punto al giorno, o al mese per periodi lunghi. */
export function cumulativeBuckets(range: DateRange): Bucket[] {
  return daysBetween(range.from, range.to) <= 92 ? dayBuckets(range) : monthBuckets(range);
}

/** Totale (in centesimi) delle spese nel bucket, opzionalmente per una sola categoria. */
export function sumIn(expenses: Expense[], b: Bucket, categoryId?: number): number {
  let total = 0;
  for (const e of expenses) {
    if (e.data >= b.from && e.data <= b.to && (categoryId === undefined || e.category_id === categoryId)) {
      total += e.importo;
    }
  }
  return total;
}

/** Massimo "tondo" (1, 2, 5 × 10^k) >= value, in euro. */
export function niceMax(valueEuro: number): number {
  if (valueEuro <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(valueEuro)));
  for (const m of [1, 2, 4, 5, 10]) if (m * pow >= valueEuro) return m * pow;
  return 10 * pow;
}
