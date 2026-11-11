import { toISODate } from './period';

/** Formatta centesimi come "€ 1.234,50". */
export function formatEuro(cents: number): string {
  const euros = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, '0');
  return `€ ${groupThousands(String(euros))},${rest}`;
}

export function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Converte la stringa del tastierino ("24,5") in centesimi. */
export function parseAmountToCents(input: string): number {
  const [int = '', dec = ''] = input.split(',');
  return Number(int || '0') * 100 + Number((dec + '00').slice(0, 2));
}

/** Data locale di oggi come "YYYY-MM-DD". */
export function todayISO(): string {
  return toISODate(new Date());
}
