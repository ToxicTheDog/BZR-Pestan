import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, ShieldCheck } from 'lucide-react';
import { useStore } from '../lib/store';
import { nadjiOpremu, nadjiZaposlenog, nazivSektora, punoIme } from '../lib/izbor';
import { danaRec, datumVreme, otisak } from '../lib/format';
import type { StanjeVracene, Zaduzenje } from '../lib/types';
import { Modal, Polje, useToast } from './ui';
import { PotpisPad } from './Potpis';

/**
 * Pop-up koji iskače čim je zaduženje spremno: primalac se potpisuje,
 * uslužilac overava svojim potpisom, i tek tada kreće odbrojavanje roka.
 */
export function DijalogPotpisa({
  zaduzenje, open, onClose, onPotpisano,
}: {
  zaduzenje: Zaduzenje | null;
  open: boolean;
  onClose: () => void;
  onPotpisano?: () => void;
}) {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [potpisPrimaoca, setPotpisPrimaoca] = useState<string | null>(null);
  const [koristiSacuvani, setKoristiSacuvani] = useState(true);
  const [potpisIzdavaoca, setPotpisIzdavaoca] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPotpisPrimaoca(null);
      setPotpisIzdavaoca(null);
      setKoristiSacuvani(Boolean(ja?.potpis));
    }
  }, [open, ja]);

  const zaposleni = zaduzenje ? nadjiZaposlenog(baza, zaduzenje.zaposleniId) : undefined;
  const potpisUsluzioca = koristiSacuvani ? ja?.potpis ?? null : potpisIzdavaoca;

  const pregledOtiska = useMemo(
    () => (zaduzenje ? otisak(`${zaduzenje.broj}|${ja?.fullName ?? ''}|pregled`) : ''),
    [zaduzenje, ja],
  );

  if (!zaduzenje) return null;

  const obavezan = baza.podesavanja.potpisi.obavezanPriZaduzenju;
  const moze = (!obavezan || potpisPrimaoca) && (!obavezan || potpisUsluzioca);

  function potvrdi() {
    if (!zaduzenje) return;
    akcije.potpisiZaduzenje(zaduzenje.id, potpisPrimaoca ?? '', potpisUsluzioca);
    javi(
      zaduzenje.rokDana > 0
        ? `Potpisano. Rok od ${danaRec(zaduzenje.rokDana)} počinje da teče od ovog trenutka.`
        : 'Potpisano. Zaduženje je trajno, bez roka vraćanja.',
    );
    onPotpisano?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov={`Potpis zaduženja ${zaduzenje.broj}`}
      opis="Potpisom se potvrđuje prijem opreme i pokreće se rok zaduženja."
      sirina="max-w-3xl"
      podnozje={
        <>
          <span className="mr-auto flex items-center gap-1.5 text-micro text-ink-muted">
            <AlarmClock size={13} />
            {zaduzenje.rokDana > 0
              ? `Rok: ${danaRec(zaduzenje.rokDana)} od trenutka potpisa`
              : 'Trajno zaduženje — bez roka'}
          </span>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button className="btn-accent" onClick={potvrdi} disabled={!moze}>
            Potpiši i pokreni rok
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Levo: šta se tačno preuzima. */}
        <div className="space-y-3">
          <div className="panel-quiet px-3 py-2.5">
            <div className="eyebrow">Prima</div>
            <div className="text-sm font-medium">{punoIme(zaposleni)}</div>
            <div className="text-micro text-ink-muted">
              {zaposleni?.radnoMesto} · {nazivSektora(baza, zaposleni?.sektorId)}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-1">Stavke</div>
            <ul className="divide-y divide-line border-y border-line">
              {zaduzenje.stavke.map((s) => {
                const o = nadjiOpremu(baza, s.opremaId);
                return (
                  <li key={s.opremaId} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{o?.naziv ?? 'Oprema'}</span>
                      <span className="font-mono text-eyebrow text-ink-faint">
                        {o?.inv} {s.velicina && `· vel. ${s.velicina}`}
                      </span>
                    </span>
                    <span className="font-mono text-sm tnum">×{s.kolicina}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {baza.podesavanja.potpisi.digitalniPotpisAktivan && (
            <div className="rounded-card border border-signal-info/25 bg-signal-infoBg px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-signal-info">
                <ShieldCheck size={14} />
                <span className="eyebrow text-signal-info">Digitalni potpis</span>
              </div>
              <div className="mt-1.5 space-y-0.5 font-mono text-micro tnum">
                <div>{ja?.sertifikat ?? 'PEST-CA-DEMO'}</div>
                <div className="break-all text-ink-muted">{pregledOtiska}</div>
                <div className="text-ink-faint">{datumVreme(new Date().toISOString())}</div>
              </div>
            </div>
          )}
        </div>

        {/* Desno: dva potpisa, jedan ispod drugog. */}
        <div className="space-y-4">
          <PotpisPad label={`Potpis primaoca — ${punoIme(zaposleni)}`} onChange={setPotpisPrimaoca} />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label mb-0">Potpis uslužioca — {ja?.fullName}</span>
              {ja?.potpis && (
                <button
                  type="button"
                  className="btn-ghost px-1.5 py-1 text-micro"
                  onClick={() => setKoristiSacuvani((v) => !v)}
                >
                  {koristiSacuvani ? 'Potpiši ručno' : 'Koristi sačuvani potpis'}
                </button>
              )}
            </div>
            {koristiSacuvani && ja?.potpis ? (
              <div className="flex h-[92px] items-end rounded-card border border-line-strong bg-surface px-4 pb-2">
                <img src={ja.potpis} alt="Sačuvani potpis" className="max-h-full object-contain object-left-bottom" />
              </div>
            ) : (
              <PotpisPad label=" " visina={92} onChange={setPotpisIzdavaoca} />
            )}
          </div>

          {obavezan && !moze && (
            <p className="text-micro text-signal-warn">
              Oba potpisa su obavezna — tako je podešeno u konfiguraciji portala.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

const STANJA: [StanjeVracene, string, string][] = [
  ['ispravno', 'Ispravno', 'Vraća se u magacin kao slobodno.'],
  ['habanje', 'Uobičajeno habanje', 'Ostaje u upotrebi uz napomenu.'],
  ['osteceno', 'Oštećeno', 'Ide na servis, izlazi iz upotrebe.'],
  ['nestalo', 'Nestalo', 'Otpisuje se po zapisniku.'],
];

/** Razduženje: potpis onoga ko vraća i onoga ko prima opremu nazad. */
export function DijalogRazduzenja({
  zaduzenje, open, onClose,
}: {
  zaduzenje: Zaduzenje | null;
  open: boolean;
  onClose: () => void;
}) {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [stanje, setStanje] = useState<StanjeVracene>('ispravno');
  const [napomena, setNapomena] = useState('');
  const [potpisVratioca, setPotpisVratioca] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStanje('ispravno');
      setNapomena('');
      setPotpisVratioca(null);
    }
  }, [open]);

  if (!zaduzenje) return null;

  const zaposleni = nadjiZaposlenog(baza, zaduzenje.zaposleniId);
  const obavezan = baza.podesavanja.potpisi.obavezanPriRazduzenju;
  const moze = !obavezan || Boolean(potpisVratioca);

  function potvrdi() {
    if (!zaduzenje) return;
    const r = akcije.razduzi(zaduzenje.id, {
      stanje,
      napomena,
      potpisVratioca: potpisVratioca ?? '',
      potpisPrimaoca: ja?.potpis ?? null,
    });
    javi(`Razduženje ${r.broj} je evidentirano.`);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov={`Razduženje — ${zaduzenje.broj}`}
      opis="Oprema se vraća u magacin; stanje pri povratu upisuje uslužilac."
      sirina="max-w-2xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button className="btn-primary" onClick={potvrdi} disabled={!moze}>
            Razduži i potpiši
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="panel-quiet px-3 py-2.5">
            <div className="eyebrow">Vraća</div>
            <div className="text-sm font-medium">{punoIme(zaposleni)}</div>
            <div className="text-micro text-ink-muted">
              {zaduzenje.stavke.length} stavki · izdato {datumVreme(zaduzenje.signedAt)}
            </div>
          </div>

          <fieldset>
            <legend className="label">Stanje vraćene opreme</legend>
            <div className="space-y-1">
              {STANJA.map(([k, naziv, opis]) => (
                <label
                  key={k}
                  className={`flex cursor-pointer items-start gap-2 rounded-card border px-2.5 py-2 transition-colors ${
                    stanje === k ? 'border-ink bg-surface' : 'border-line hover:bg-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="stanje"
                    className="mt-1 accent-[#14161A]"
                    checked={stanje === k}
                    onChange={() => setStanje(k)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{naziv}</span>
                    <span className="block text-micro text-ink-muted">{opis}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="space-y-3">
          <PotpisPad label={`Potpis — ${punoIme(zaposleni)}`} onChange={setPotpisVratioca} />
          <Polje label="Napomena" hint="Vidljiva u kartonu i u zapisniku o razduženju.">
            <textarea
              className="input min-h-[76px]"
              value={napomena}
              onChange={(e) => setNapomena(e.target.value)}
              placeholder="npr. vraćeno kompletno, bez oštećenja"
            />
          </Polje>
          <div className="text-micro text-ink-muted">
            Overava: <span className="font-medium text-ink">{ja?.fullName}</span> ·{' '}
            <span className="font-mono tnum">{ja?.sertifikat ?? 'PEST-CA-DEMO'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
