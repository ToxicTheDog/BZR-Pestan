import { AlarmClock, CircleCheck, Infinity as InfinityIcon, TriangleAlert } from 'lucide-react';
import type { Rok, StatusRoka } from '../lib/format';
import { Traka, type TonOznake } from './ui';

export const TON_ROKA: Record<StatusRoka, TonOznake> = {
  trajno: 'neutral',
  u_roku: 'ok',
  uskoro: 'warn',
  kriticno: 'danger',
  isteklo: 'danger',
};

export const NAZIV_ROKA: Record<StatusRoka, string> = {
  trajno: 'Trajno',
  u_roku: 'U roku',
  uskoro: 'Ističe uskoro',
  kriticno: 'Ističe danas-sutra',
  isteklo: 'Rok istekao',
};

const IKONA: Record<StatusRoka, typeof AlarmClock> = {
  trajno: InfinityIcon,
  u_roku: CircleCheck,
  uskoro: AlarmClock,
  kriticno: AlarmClock,
  isteklo: TriangleAlert,
};

const KLASA: Record<StatusRoka, string> = {
  trajno: 'bg-surface-deep text-ink-muted',
  u_roku: 'bg-signal-okBg text-signal-ok',
  uskoro: 'bg-signal-warnBg text-signal-warn',
  kriticno: 'bg-signal-dangerBg text-signal-danger',
  isteklo: 'bg-signal-danger text-paper',
};

/**
 * Živo odbrojavanje roka zaduženja. Ista komponenta stoji u tabeli,
 * u dosijeu i u kartonu — status se nigde ne računa dva puta.
 */
export function RokOznaka({ rok, sitno }: { rok: Rok; sitno?: boolean }) {
  const I = IKONA[rok.status];
  return (
    <span
      className={`chip ${KLASA[rok.status]} ${sitno ? '' : 'px-2 py-1'}`}
      title={`${NAZIV_ROKA[rok.status]} — ${rok.tekst}`}
    >
      <I size={sitno ? 11 : 12} />
      <span className="tnum">{rok.status === 'trajno' ? 'trajno' : rok.tekst}</span>
    </span>
  );
}

/** Odbrojavanje sa trakom potrošenog roka — koristi se u detaljima. */
export function RokTraka({ rok }: { rok: Rok }) {
  if (rok.status === 'trajno') {
    return (
      <div className="flex items-center gap-2 text-micro text-ink-muted">
        <InfinityIcon size={13} /> Trajno zaduženje — bez roka vraćanja.
      </div>
    );
  }
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="eyebrow">{NAZIV_ROKA[rok.status]}</span>
        <span
          className={`font-mono text-sm font-semibold tnum ${
            rok.status === 'isteklo' || rok.status === 'kriticno'
              ? 'text-signal-danger'
              : rok.status === 'uskoro'
                ? 'text-signal-warn'
                : 'text-ink'
          }`}
        >
          {rok.tekst}
        </span>
      </div>
      <Traka udeo={rok.udeo} ton={TON_ROKA[rok.status]} />
    </div>
  );
}
