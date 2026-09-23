import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Boxes, ClipboardList, ClipboardCheck, FileSignature, Gauge, LogOut, Mail, Menu, Network,
  ScrollText, Settings2, ShieldCheck, Stamp, UserCog, Users, X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { napraviPresek } from '../lib/izbor';
import { useSada, inicijali } from '../lib/format';
import { ULOGE } from '../lib/permissions';
import type { Permission } from '../lib/types';

type Stavka = {
  to: string;
  label: string;
  ikona: typeof Gauge;
  pravo?: Permission;
  broj?: number;
  hitno?: boolean;
};

export function Shell({ children }: { children: ReactNode }) {
  const { baza, ja, odjava, smem } = useStore();
  const sada = useSada(1000);
  const presek = napraviPresek(baza, sada, ja);
  const [meni, setMeni] = useState(false);
  const lokacija = useLocation();

  const grupe: { naslov: string; stavke: Stavka[] }[] = [
    {
      naslov: 'Rad',
      stavke: [
        { to: '/pregled', label: 'Pregled', ikona: Gauge },
        {
          to: '/zaduzenja', label: 'Zaduženja', ikona: FileSignature, pravo: 'zaduzenja.vidi',
          broj: presek.isteklo.length + presek.kriticno.length, hitno: true,
        },
        { to: '/razduzenja', label: 'Razduženja', ikona: Stamp, pravo: 'zaduzenja.vidi' },
        {
          to: '/odobrenja', label: 'Odobrenja', ikona: ClipboardCheck, pravo: 'odobrenja.vidi',
          broj: presek.cekaOdobrenje.length,
        },
        {
          to: '/kontrole', label: 'Kontrole i provere', ikona: ShieldCheck, pravo: 'kontrole.vidi',
          broj: presek.kontroleKasne.length, hitno: true,
        },
      ],
    },
    {
      naslov: 'Evidencija',
      stavke: [
        { to: '/inventar', label: 'Inventar', ikona: Boxes, pravo: 'inventar.vidi' },
        { to: '/kartoni', label: 'Kartoni', ikona: ClipboardList, pravo: 'kartoni.vidi' },
        { to: '/zaposleni', label: 'Zaposleni', ikona: Users, pravo: 'zaposleni.vidi' },
        { to: '/posta', label: 'Pošta', ikona: Mail, pravo: 'mail.vidi' },
      ],
    },
    {
      naslov: 'Administracija',
      stavke: [
        { to: '/sektori', label: 'Sektori', ikona: Network, pravo: 'sektori.upravljaj' },
        { to: '/nalozi', label: 'Nalozi i prava', ikona: UserCog, pravo: 'nalozi.upravljaj' },
        { to: '/podesavanja', label: 'Podešavanja', ikona: Settings2, pravo: 'podesavanja.upravljaj' },
        { to: '/logovi', label: 'Logovi', ikona: ScrollText, pravo: 'logovi.vidi' },
      ],
    },
  ];

  const klasaLinka = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2.5 border-l-2 py-2 pl-3 pr-2 text-sm transition-colors ${
      isActive
        ? 'border-safety-500 bg-surface font-medium text-ink'
        : 'border-transparent text-ink-muted hover:border-line-strong hover:bg-surface hover:text-ink'
    }`;

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobilna traka */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper px-4 py-2.5 lg:hidden">
        <Znak />
        <button className="btn-secondary" onClick={() => setMeni((v) => !v)} aria-label="Meni">
          {meni ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <div className="lg:flex">
        <div
          className={`${meni ? 'block' : 'hidden'} no-print border-b border-line bg-paper lg:block lg:w-[15.5rem] lg:shrink-0 lg:border-b-0 lg:border-r`}
        >
        <aside className="lg:sticky lg:top-0 lg:h-screen">
          <div className="flex h-full flex-col">
            <div className="hidden border-b border-line px-4 py-4 lg:block">
              <Znak />
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto py-3" onClick={() => setMeni(false)}>
              {grupe.map((g) => {
                const vidljive = g.stavke.filter((s) => !s.pravo || smem(s.pravo));
                if (!vidljive.length) return null;
                return (
                  <div key={g.naslov} className="mb-4">
                    <div className="eyebrow px-4 pb-1.5">{g.naslov}</div>
                    {vidljive.map((s) => (
                      <NavLink key={s.to} to={s.to} className={klasaLinka}>
                        <s.ikona size={15} className="shrink-0 opacity-70" />
                        <span className="flex-1 truncate">{s.label}</span>
                        {!!s.broj && (
                          <span
                            className={`chip tnum ${
                              s.hitno ? 'bg-signal-danger text-paper' : 'bg-surface-deep text-ink-muted'
                            }`}
                          >
                            {s.broj}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-line px-4 py-3">
              <NavLink to="/moj-nalog" className="flex items-center gap-2.5 rounded-card p-1 hover:bg-surface">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-ink font-mono text-micro font-semibold text-paper">
                  {inicijali(ja?.fullName ?? '')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{ja?.fullName}</span>
                  <span className="eyebrow">{ja ? ULOGE[ja.role].naziv : ''}</span>
                </span>
              </NavLink>
              <button onClick={odjava} className="btn-ghost mt-1.5 w-full justify-start px-1 py-1 text-micro">
                <LogOut size={13} /> Odjavi se
              </button>
            </div>
          </div>
        </aside>
        </div>

        <main className="min-w-0 flex-1">
          <div key={lokacija.pathname} className="animate-fade px-4 py-5 lg:px-7 lg:py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function Znak() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-card bg-safety-500 text-paper">
        <ShieldCheck size={17} />
      </span>
      <span className="leading-none">
        <span className="naslov block text-[0.95rem]">BZR portal</span>
        <span className="eyebrow">Peštan d.o.o.</span>
      </span>
    </div>
  );
}

/**
 * Zaglavlje stranice: sitan nadnaslov, krupan naslov levo,
 * radnje desno i puna linija ispod — izgled dosijea, ne kartice.
 */
export function Zaglavlje({
  nadnaslov, naslov, opis, akcije, meta,
}: {
  nadnaslov: string;
  naslov: string;
  opis?: string;
  akcije?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow mb-1.5 flex items-center gap-2">
            <span className="inline-block h-2 w-6 rule-ticks" />
            {nadnaslov}
          </div>
          <h1 className="naslov text-2xl lg:text-[1.75rem]">{naslov}</h1>
          {opis && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{opis}</p>}
        </div>
        {akcije && <div className="no-print flex flex-wrap items-center gap-1.5">{akcije}</div>}
      </div>
      {meta && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">{meta}</div>}
      <div className="mt-4 h-px w-full bg-line" />
    </header>
  );
}

/**
 * Asimetrična podela strane: glavni tok levo, uski „dosije" desno.
 * Namerno nije 3 jednake kolone — desna traka je gusta i uža.
 */
export function SaDosijeom({ children, dosije }: { children: ReactNode; dosije: ReactNode }) {
  return (
    <div className="grid items-start gap-5 tablet:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_19.5rem]">
      <div className="min-w-0 space-y-5">{children}</div>
      <aside className="space-y-4">{dosije}</aside>
    </div>
  );
}
