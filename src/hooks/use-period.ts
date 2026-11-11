import { useMemo, useState } from 'react';

import { DateRange, PeriodKind, getRange } from '@/lib/period';

export function usePeriod(initial: PeriodKind = 'month') {
  const [kind, setKind] = useState<PeriodKind>(initial);
  const [custom, setCustom] = useState<DateRange>(() => getRange('month', { from: '', to: '' }));
  const range = useMemo(() => getRange(kind, custom), [kind, custom]);
  return { kind, setKind, custom, setCustom, range };
}

export type PeriodState = ReturnType<typeof usePeriod>;
