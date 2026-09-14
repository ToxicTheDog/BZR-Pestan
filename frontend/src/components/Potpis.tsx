import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, ShieldCheck, Undo2 } from 'lucide-react';
import { otisak } from '../lib/format';

/**
 * Potpis u aplikaciji. Radi mišem, prstom i olovkom; crta se u
 * koordinatama platna pomnoženim sa devicePixelRatio, pa linija
 * ostaje oštra i na telefonu i na tablet-u u magacinu.
 */
/** Na dodirnom ekranu se potpisuje prstom, pa polje mora da bude veće. */
const NA_DODIR = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

export function PotpisPad({
  onChange, visina = 150, label,
}: {
  onChange: (dataUrl: string | null) => void;
  visina?: number;
  label?: string;
}) {
  const visinaPolja = NA_DODIR ? Math.round(visina * 1.35) : visina;
  const ref = useRef<HTMLCanvasElement>(null);
  const crta = useRef(false);
  const potezi = useRef<[number, number][][]>([]);
  const [prazno, setPrazno] = useState(true);

  function ctx() {
    const c = ref.current!;
    const k = c.getContext('2d')!;
    k.lineCap = 'round';
    k.lineJoin = 'round';
    k.lineWidth = NA_DODIR ? 2.8 : 2.2;
    k.strokeStyle = '#14161A';
    return k;
  }

  function pripremi() {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const sirina = c.parentElement?.clientWidth ?? 400;
    c.width = sirina * dpr;
    c.height = visinaPolja * dpr;
    c.style.width = `${sirina}px`;
    c.style.height = `${visinaPolja}px`;
    const k = ctx();
    k.setTransform(dpr, 0, 0, dpr, 0, 0);
    nacrtaj();
  }

  function nacrtaj() {
    const c = ref.current;
    if (!c) return;
    const k = ctx();
    const dpr = window.devicePixelRatio || 1;
    k.clearRect(0, 0, c.width / dpr, c.height / dpr);
    for (const potez of potezi.current) {
      k.beginPath();
      potez.forEach(([x, y], i) => (i === 0 ? k.moveTo(x, y) : k.lineTo(x, y)));
      k.stroke();
    }
  }

  useEffect(() => {
    pripremi();
    const naResize = () => pripremi();
    window.addEventListener('resize', naResize);
    return () => window.removeEventListener('resize', naResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tacka(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function pocni(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    ref.current?.setPointerCapture(e.pointerId);
    crta.current = true;
    potezi.current.push([tacka(e)]);
  }

  function vuci(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!crta.current) return;
    e.preventDefault();
    potezi.current[potezi.current.length - 1].push(tacka(e));
    nacrtaj();
  }

  function zavrsi() {
    if (!crta.current) return;
    crta.current = false;
    posalji();
  }

  function posalji() {
    const imaPotez = potezi.current.some((p) => p.length > 1);
    setPrazno(!imaPotez);
    onChange(imaPotez ? ref.current!.toDataURL('image/png') : null);
  }

  function obrisi() {
    potezi.current = [];
    nacrtaj();
    posalji();
  }

  function nazad() {
    potezi.current.pop();
    nacrtaj();
    posalji();
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label mb-0">{label ?? 'Potpis'}</span>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost px-1.5 py-1 text-micro" onClick={nazad} disabled={prazno}>
            <Undo2 size={13} /> Nazad
          </button>
          <button type="button" className="btn-ghost px-1.5 py-1 text-micro" onClick={obrisi} disabled={prazno}>
            <Eraser size={13} /> Obriši
          </button>
        </div>
      </div>

      <div className="relative rounded-card border border-line-strong bg-surface">
        {prazno && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-ink-faint">
            <PenLine size={16} />
            <span className="text-micro">Potpišite se ovde — mišem ili prstom</span>
          </div>
        )}
        {/* Linija za potpis, kao na papirnom obrascu. */}
        <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-line-strong" />
        <canvas
          ref={ref}
          className="block w-full cursor-crosshair touch-none"
          onPointerDown={pocni}
          onPointerMove={vuci}
          onPointerUp={zavrsi}
          onPointerLeave={zavrsi}
          onPointerCancel={zavrsi}
        />
      </div>
    </div>
  );
}

/** Prikaz već snimljenog potpisa na „papiru". */
export function PrikazPotpisa({
  potpis, ime, uloga, vreme, visina = 'h-16',
}: {
  potpis: string | null;
  ime: string;
  uloga: string;
  vreme?: string;
  visina?: string;
}) {
  return (
    <div className="min-w-0">
      <div className={`flex ${visina} items-end border-b border-ink/70 px-1`}>
        {potpis ? (
          <img src={potpis} alt={`Potpis — ${ime}`} className="max-h-full max-w-full object-contain object-left-bottom" />
        ) : (
          <span className="pb-1 font-mono text-micro text-ink-faint">nije potpisano</span>
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-micro font-medium">{ime}</span>
        <span className="eyebrow shrink-0">{uloga}</span>
      </div>
      {vreme && <div className="font-mono text-eyebrow text-ink-faint tnum">{vreme}</div>}
    </div>
  );
}

/** Blok digitalnog potpisa — sertifikat, otisak i vreme overe. */
export function DigitalniBlok({
  potpisnik, sertifikat, otisakVrednost, vreme,
}: {
  potpisnik: string;
  sertifikat: string;
  otisakVrednost: string;
  vreme: string;
}) {
  return (
    <div className="rounded-card border border-signal-info/25 bg-signal-infoBg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-signal-info">
        <ShieldCheck size={14} />
        <span className="eyebrow text-signal-info">Digitalni potpis — overeno</span>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        <div>
          <dt className="eyebrow">Potpisnik</dt>
          <dd className="text-micro font-medium">{potpisnik}</dd>
        </div>
        <div>
          <dt className="eyebrow">Sertifikat</dt>
          <dd className="font-mono text-micro tnum">{sertifikat}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="eyebrow">Otisak dokumenta</dt>
          <dd className="break-all font-mono text-micro tnum">{otisakVrednost}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="eyebrow">Vreme overe</dt>
          <dd className="font-mono text-micro tnum">{vreme}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Pomoćna: otisak za dokument koji se tek potpisuje. */
export function pripremiOtisak(kljuc: string): string {
  return otisak(kljuc);
}
