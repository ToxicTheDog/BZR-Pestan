import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, AlertTriangle, Info } from 'lucide-react';

/**
 * Sve što lebdi iznad strane ide direktno na `<body>`.
 *
 * Razlog: bilo koji predak sa `transform`, `filter` ili `contain` postaje
 * containing block za `position: fixed` potomke — tada `inset-0` više ne
 * znači „ceo prozor" nego „ta kutija", pa se modal ili fioka iseku. Portal
 * to sprečava bez obzira na to šta se kasnije doda u omotač strane.
 */
function Sloj({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

/* ------------------------------ Toast ------------------------------ */

type Ton = 'ok' | 'greska' | 'info';
type Poruka = { id: number; tekst: string; ton: Ton };

const ToastCtx = createContext<(tekst: string, ton?: Ton) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [poruke, setPoruke] = useState<Poruka[]>([]);

  const javi = useCallback((tekst: string, ton: Ton = 'ok') => {
    const id = Date.now() + Math.random();
    setPoruke((p) => [...p, { id, tekst, ton }]);
    window.setTimeout(() => setPoruke((p) => p.filter((x) => x.id !== id)), 4500);
  }, []);

  const ikona = { ok: Check, greska: AlertTriangle, info: Info };

  return (
    <ToastCtx.Provider value={javi}>
      {children}
      <Sloj>
      <div className="no-print pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[22rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-2 lg:left-auto lg:right-6 lg:translate-x-0">
        {poruke.map((p) => {
          const I = ikona[p.ton];
          return (
            <div
              key={p.id}
              role="status"
              className={`pointer-events-auto flex animate-rise items-start gap-2 rounded-card border px-3 py-2.5 text-sm shadow-pop ${
                p.ton === 'greska'
                  ? 'border-signal-danger/25 bg-signal-dangerBg text-signal-danger'
                  : p.ton === 'info'
                    ? 'border-signal-info/25 bg-signal-infoBg text-signal-info'
                    : 'border-line bg-ink text-paper'
              }`}
            >
              <I size={15} className="mt-0.5 shrink-0" />
              <span>{p.tekst}</span>
            </div>
          );
        })}
      </div>
      </Sloj>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ------------------------------ Modal ------------------------------ */

export function Modal({
  open, onClose, naslov, opis, children, sirina = 'max-w-xl', podnozje,
}: {
  open: boolean;
  onClose: () => void;
  naslov: string;
  opis?: string;
  children: ReactNode;
  sirina?: string;
  podnozje?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const naTaster = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', naTaster);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', naTaster);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Sloj>
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/35 p-4 pt-[6vh] backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={naslov}
        className={`w-full ${sirina} animate-pop rounded-card border border-line bg-paper shadow-pop`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="naslov text-base">{naslov}</h2>
            {opis && <p className="mt-0.5 text-micro text-ink-muted">{opis}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost -mr-2 px-1.5" aria-label="Zatvori">
            <X size={16} />
          </button>
        </header>
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">{children}</div>
        {podnozje && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
            {podnozje}
          </footer>
        )}
      </div>
    </div>
    </Sloj>
  );
}

/* ------------------------------ Fioka ------------------------------ */

export function Fioka({
  open, onClose, naslov, nadnaslov, children, akcije,
}: {
  open: boolean;
  onClose: () => void;
  naslov: ReactNode;
  nadnaslov?: string;
  children: ReactNode;
  akcije?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const naTaster = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', naTaster);
    return () => window.removeEventListener('keydown', naTaster);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Sloj>
    <div className="no-print fixed inset-0 z-50 flex justify-end bg-ink/30">
      <button className="flex-1 cursor-default" aria-label="Zatvori" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl animate-rise flex-col border-l border-line bg-paper shadow-pop">
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            {nadnaslov && <div className="eyebrow mb-1">{nadnaslov}</div>}
            <h2 className="naslov truncate text-lg">{naslov}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {akcije}
            <button onClick={onClose} className="btn-ghost px-1.5" aria-label="Zatvori">
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
    </Sloj>
  );
}

/* ------------------------------ Polja ------------------------------ */

export function Polje({
  label, hint, children, greska,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  greska?: string | null;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {greska ? <span className="mt-1 block text-micro text-signal-danger">{greska}</span> : hint ? <span className="hint block">{hint}</span> : null}
    </label>
  );
}

export function Pretraga({
  value, onChange, placeholder = 'Pretraga…', sirina = 'w-full sm:w-72',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  sirina?: string;
}) {
  return (
    <div className={`relative ${sirina}`}>
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        className="input pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Prekidac({
  ukljucen, onChange, label, opis, disabled,
}: {
  ukljucen: boolean;
  onChange: (v: boolean) => void;
  label: string;
  opis?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {opis && <div className="text-micro text-ink-muted">{opis}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ukljucen}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!ukljucen)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-40 ${
          ukljucen ? 'border-ink bg-ink' : 'border-line-strong bg-surface-deep'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-paper transition-all ${
            ukljucen ? 'left-[1.15rem]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------ Oznake ------------------------------ */

export type TonOznake = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'accent';

const TONOVI: Record<TonOznake, string> = {
  ok: 'bg-signal-okBg text-signal-ok',
  warn: 'bg-signal-warnBg text-signal-warn',
  danger: 'bg-signal-dangerBg text-signal-danger',
  info: 'bg-signal-infoBg text-signal-info',
  neutral: 'bg-surface-deep text-ink-muted',
  accent: 'bg-safety-50 text-safety-600',
};

export function Oznaka({ ton = 'neutral', children }: { ton?: TonOznake; children: ReactNode }) {
  return <span className={`chip ${TONOVI[ton]}`}>{children}</span>;
}

export function Tacka({ ton }: { ton: TonOznake }) {
  const boje: Record<TonOznake, string> = {
    ok: 'bg-signal-ok',
    warn: 'bg-signal-warn',
    danger: 'bg-signal-danger',
    info: 'bg-signal-info',
    neutral: 'bg-ink-faint',
    accent: 'bg-safety-500',
  };
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${boje[ton]}`} />;
}

/* ------------------------------ Prazno ------------------------------ */

export function Prazno({ naslov, hint, akcija }: { naslov: string; hint?: string; akcija?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 px-5 py-10">
      <div className="h-px w-14 bg-line-strong" />
      <div className="text-sm font-medium">{naslov}</div>
      {hint && <div className="max-w-md text-micro text-ink-muted">{hint}</div>}
      {akcija && <div className="mt-2">{akcija}</div>}
    </div>
  );
}

/* --------------------------- Traka udela --------------------------- */

export function Traka({ udeo, ton = 'neutral' }: { udeo: number; ton?: TonOznake }) {
  const boje: Record<TonOznake, string> = {
    ok: 'bg-signal-ok',
    warn: 'bg-signal-warn',
    danger: 'bg-signal-danger',
    info: 'bg-signal-info',
    neutral: 'bg-ink',
    accent: 'bg-safety-500',
  };
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-deep">
      <div
        className={`h-full ${boje[ton]} transition-[width] duration-500`}
        style={{ width: `${Math.min(100, Math.max(2, udeo * 100))}%` }}
      />
    </div>
  );
}

/* ------------------------------ Kartice ----------------------------- */

export function Odeljak({
  naslov, nadnaslov, akcije, children, ravno,
}: {
  naslov: string;
  nadnaslov?: string;
  akcije?: ReactNode;
  children: ReactNode;
  ravno?: boolean;
}) {
  return (
    <section className="panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div>
          {nadnaslov && <div className="eyebrow">{nadnaslov}</div>}
          <h2 className="naslov text-sm">{naslov}</h2>
        </div>
        {akcije && <div className="flex flex-wrap items-center gap-1.5">{akcije}</div>}
      </header>
      <div className={ravno ? '' : 'px-4 py-3'}>{children}</div>
    </section>
  );
}

/** Podatak u dosijeu: sitna oznaka gore, vrednost ispod. */
export function Podatak({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="eyebrow">{label}</div>
      <div className={`mt-0.5 truncate text-sm ${mono ? 'font-mono tnum' : ''}`}>{children}</div>
    </div>
  );
}

/* ----------------------- Potvrda brisanja itd. ---------------------- */

export function Potvrda({
  open, naslov, tekst, potvrdiTekst = 'Potvrdi', onPotvrdi, onClose, opasno,
}: {
  open: boolean;
  naslov: string;
  tekst: string;
  potvrdiTekst?: string;
  onPotvrdi: () => void;
  onClose: () => void;
  opasno?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov={naslov}
      sirina="max-w-md"
      podnozje={
        <>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button
            className={opasno ? 'btn-danger' : 'btn-primary'}
            onClick={() => {
              onPotvrdi();
              onClose();
            }}
          >
            {potvrdiTekst}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{tekst}</p>
    </Modal>
  );
}

/* ------------------------------ Tabovi ------------------------------ */

export function Tabovi<T extends string>({
  vrednost, onChange, stavke,
}: {
  vrednost: T;
  onChange: (v: T) => void;
  stavke: { id: T; label: string; broj?: number }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line">
      {stavke.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            vrednost === s.id
              ? 'border-safety-500 text-ink'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          {s.label}
          {s.broj !== undefined && (
            <span className="ml-1.5 font-mono text-eyebrow text-ink-faint tnum">{s.broj}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Filter u obliku niza dugmića — koristi se svuda gde ima statusa. */
export function Filteri<T extends string>({
  vrednost, onChange, stavke,
}: {
  vrednost: T;
  onChange: (v: T) => void;
  stavke: readonly (readonly [T, string])[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-card border border-line bg-surface p-0.5">
      {stavke.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-card px-2 py-1 text-micro font-medium transition-colors ${
            vrednost === k ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-paper hover:text-ink'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Sitni brojač u zaglavlju stranica — „14 od 32". */
export function Brojac({ prikazano, ukupno, jedinica }: { prikazano: number; ukupno: number; jedinica: string }) {
  const tekst = useMemo(
    () => (prikazano === ukupno ? `${ukupno} ${jedinica}` : `${prikazano} od ${ukupno} ${jedinica}`),
    [prikazano, ukupno, jedinica],
  );
  return <span className="font-mono text-micro text-ink-faint tnum">{tekst}</span>;
}
