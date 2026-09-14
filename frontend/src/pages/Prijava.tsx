import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../lib/store';
import { ULOGE } from '../lib/permissions';
import { datumVreme, inicijali } from '../lib/format';
import { Polje } from '../components/ui';

/** Moduli u traci koja klizi — bez tri jednake kolone sa ikonicama. */
const MODULI = [
  'Zaduženja sa potpisom u aplikaciji',
  'Razduženja i stanje vraćene opreme',
  'Digitalni potpis sa otiskom dokumenta',
  'Rokovi koji otkucavaju od trenutka potpisa',
  'Lični kartoni LZO — Obrazac 6',
  'Kontrole, provere i nalazi',
  'Odobravanje izdavanja opreme',
  'Inventar po kategorijama i atestima',
  'Automatska e-pošta i podsetnici',
  'Nalozi, uloge i prava po korisniku',
];

export function Prijava() {
  const { baza, prijava } = useStore();
  const [username, setUsername] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [greska, setGreska] = useState<string | null>(null);

  const demoNalozi = baza.nalozi.filter((n) => n.aktivan);

  function posalji(e: React.FormEvent) {
    e.preventDefault();
    const r = prijava(username, lozinka);
    if (!r.ok) setGreska(r.greska);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="flex-1 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
      {/* Levo: prijava. Namerno nije centrirana — poravnata je uz levu ivicu. */}
      <div className="flex min-w-0 flex-col overflow-hidden px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-card bg-safety-500 text-paper">
            <ShieldCheck size={19} />
          </span>
          <span className="leading-none">
            <span className="naslov block text-[0.95rem]">BZR portal</span>
            <span className="eyebrow">Peštan d.o.o. — Aranđelovac</span>
          </span>
        </div>

        <div className="my-auto max-w-md py-10">
          <div className="eyebrow mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-10 rule-ticks" />
            Prijava na portal
          </div>
          <h1 className="naslov text-[2.15rem] leading-[1.06] sm:text-[2.7rem]">
            Bezbednost i zdravlje
            <br />
            na radu.
            <span className="block text-ink-faint">Bez papira.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Zaduženja, razduženja, potpisi, kartoni i kontrole — na jednom mestu.
            Rok počinje da teče onog trenutka kad se zaposleni potpiše.
          </p>

          <form onSubmit={posalji} className="mt-7 space-y-3.5">
            <Polje label="Korisničko ime">
              <input
                className="input font-mono"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setGreska(null);
                }}
                autoFocus
                autoComplete="username"
                placeholder="npr. admin"
              />
            </Polje>
            <Polje label="Lozinka" hint="Demo prihvata bilo koju lozinku od 4 i više znakova.">
              <input
                className="input"
                type="password"
                value={lozinka}
                onChange={(e) => {
                  setLozinka(e.target.value);
                  setGreska(null);
                }}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Polje>

            {greska && (
              <div className="rounded-card border border-signal-danger/25 bg-signal-dangerBg px-3 py-2 text-sm text-signal-danger">
                {greska}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5">
              Prijavi se <ArrowRight size={15} />
            </button>
          </form>
        </div>

      </div>

      {/* Desno: gusta kolona sa demo nalozima — uža i drugačije boje. */}
      <aside className="border-t border-line bg-surface px-6 py-8 sm:px-12 lg:border-l lg:border-t-0 lg:px-8 lg:py-12">
        <div className="eyebrow mb-1">Demo nalozi</div>
        <p className="mb-5 max-w-xs text-micro text-ink-muted">
          Frontend radi nad demo podacima u pregledaču. Izaberite nalog da vidite
          portal iz ugla te uloge.
        </p>

        <ul className="divide-y divide-line border-y border-line">
          {demoNalozi.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => {
                  setUsername(n.username);
                  setLozinka('demo1234');
                  setGreska(null);
                }}
                className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-paper"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-card border border-line bg-paper font-mono text-micro font-semibold">
                  {inicijali(n.fullName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{n.fullName}</span>
                    <span className="eyebrow shrink-0">{ULOGE[n.role].kratko}</span>
                  </span>
                  <span className="block truncate font-mono text-micro text-ink-muted">{n.username}</span>
                  <span className="mt-0.5 block text-micro text-ink-faint">{ULOGE[n.role].opis}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
          <Brojka label="Komada opreme" vrednost={baza.oprema.length} />
          <Brojka label="Zaduženja" vrednost={baza.zaduzenja.length} />
          <Brojka label="Zaposlenih" vrednost={baza.zaposleni.length} />
          <Brojka label="Kontrola" vrednost={baza.kontrole.length} />
        </dl>

        <p className="mt-6 border-t border-line pt-3 font-mono text-eyebrow uppercase text-ink-faint">
          Demo podaci pripremljeni {datumVreme(new Date().toISOString())}
        </p>
      </aside>
      </div>

      {/* Moduli — statičan red preko cele širine; ništa se ne pomera. */}
      <div className="overflow-x-auto border-t border-line">
        <div className="flex min-w-max">
          {MODULI.map((m, i) => (
            <span
              key={i}
              className="flex items-center gap-2 whitespace-nowrap border-r border-line px-4 py-2 font-mono text-eyebrow uppercase text-ink-muted"
            >
              <span className="text-safety-500">{String(i + 1).padStart(2, '0')}</span>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Brojka({ label, vrednost }: { label: string; vrednost: number }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="font-mono text-xl font-semibold tnum">{vrednost}</dd>
    </div>
  );
}
