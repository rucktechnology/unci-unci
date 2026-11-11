export type PeriodKind = '7d' | 'month' | 'year' | 'range';

export type DateRange = { from: string; to: string };

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];
const MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Calcola l'intervallo [from, to] (estremi inclusi) per il periodo scelto. */
export function getRange(kind: PeriodKind, custom: DateRange, now = new Date()): DateRange {
  switch (kind) {
    case '7d': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return { from: toISODate(start), to: toISODate(now) };
    }
    case 'month':
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case 'year':
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    case 'range':
      return custom;
  }
}

export function periodTitle(kind: PeriodKind, range: DateRange, now = new Date()): string {
  switch (kind) {
    case '7d':
      return 'Ultimi 7 giorni';
    case 'month':
      return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    case 'year':
      return String(now.getFullYear());
    case 'range':
      return `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`;
  }
}

export function periodSpentLabel(kind: PeriodKind): string {
  switch (kind) {
    case '7d':
      return 'Speso negli ultimi 7 giorni';
    case 'month':
      return 'Speso questo mese';
    case 'year':
      return "Speso quest'anno";
    case 'range':
      return "Speso nell'intervallo";
  }
}

export function periodCountLabel(kind: PeriodKind, count: number): string {
  const spese = `${count} ${count === 1 ? 'spesa' : 'spese'}`;
  switch (kind) {
    case '7d':
      return `${spese} negli ultimi 7 giorni`;
    case 'month':
      return `${spese} in questo mese`;
    case 'year':
      return `${spese} quest'anno`;
    case 'range':
      return `${spese} nell'intervallo`;
  }
}
