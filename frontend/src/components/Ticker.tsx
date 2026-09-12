import { Link } from 'react-router-dom';
import type { Presek } from '../lib/izbor';
import { Tacka, type TonOznake } from './ui';

type Vest = { tekst: string; ton: TonOznake; to: string };

/**
 * Traka stanja koja klizi ispod zaglavlja — jedini „pregled svega"
 * koji ne troši visinu strane. Zaustavlja se kad se pređe mišem.
 */
export function Ticker({ presek }: { presek: Presek }) {
  const vesti: Vest[] = [];

  if (presek.isteklo.length)
    vesti.push({ tekst: `${presek.isteklo.length} zaduženja sa isteklim rokom`, ton: 'danger', to: '/zaduzenja?filter=isteklo' });
  if (presek.kriticno.length)
    vesti.push({ tekst: `${presek.kriticno.length} ističe u naredna 2 dana`, ton: 'danger', to: '/zaduzenja?filter=kriticno' });
  if (presek.uskoro.length)
    vesti.push({ tekst: `${presek.uskoro.length} ističe ove nedelje`, ton: 'warn', to: '/zaduzenja?filter=uskoro' });
  if (presek.cekaOdobrenje.length)
    vesti.push({ tekst: `${presek.cekaOdobrenje.length} zahteva čeka odobrenje`, ton: 'info', to: '/odobrenja' });
  if (presek.cekaPotpis.length)
    vesti.push({ tekst: `${presek.cekaPotpis.length} zaduženja čeka potpis primaoca`, ton: 'accent', to: '/zaduzenja?filter=ceka_potpis' });
  if (presek.kontroleKasne.length)
    vesti.push({ tekst: `${presek.kontroleKasne.length} kontrola kasni`, ton: 'danger', to: '/kontrole' });
  if (presek.kontroleNaRedu.length)
    vesti.push({ tekst: `sledeća kontrola: ${presek.kontroleNaRedu[0].naziv}`, ton: 'neutral', to: '/kontrole' });
  if (presek.niskeZalihe.length)
    vesti.push({ tekst: `${presek.niskeZalihe.length} artikala ispod minimalne zalihe`, ton: 'warn', to: '/inventar?filter=niske' });
  if (presek.atestIstice.length)
    vesti.push({ tekst: `${presek.atestIstice.length} atesta ističe u 30 dana`, ton: 'warn', to: '/inventar?filter=atest' });
  if (presek.istekliLekarski.length)
    vesti.push({ tekst: `${presek.istekliLekarski.length} lekarskih uverenja ističe`, ton: 'info', to: '/zaposleni' });
  if (presek.istekleObuke.length)
    vesti.push({ tekst: `${presek.istekleObuke.length} obuka BZR ističe`, ton: 'info', to: '/zaposleni' });

  vesti.push({ tekst: `${presek.aktivna.length} aktivnih zaduženja`, ton: 'ok', to: '/zaduzenja' });
  vesti.push({ tekst: `${presek.slobodnoKomada} komada slobodno u magacinu`, ton: 'neutral', to: '/inventar' });

  const traka = (kljuc: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={kljuc === 'b'}>
      {vesti.map((v, i) => (
        <Link
          key={`${kljuc}-${i}`}
          to={v.to}
          className="flex items-center gap-2 whitespace-nowrap border-r border-line px-4 py-1.5 font-mono text-eyebrow uppercase text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Tacka ton={v.ton} />
          {v.tekst}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="no-print group relative overflow-hidden border-b border-line bg-paper">
      <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
        {traka('a')}
        {traka('b')}
      </div>
      {/* Blago stapanje na ivicama, da tekst ne „iseca" naglo. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent" />
    </div>
  );
}
