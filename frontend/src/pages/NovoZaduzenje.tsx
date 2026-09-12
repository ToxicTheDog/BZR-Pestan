import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { kategorijaOpreme, punoIme, vaziRok } from '../lib/izbor';
import { danaRec, datum, sadrzi } from '../lib/format';
import type { Oprema, StavkaZaduzenja, Zaduzenje } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import { Odeljak, Oznaka, Polje, Prazno, Pretraga, useToast } from '../components/ui';
import { DijalogPotpisa } from '../components/Dijalozi';

export function NovoZaduzenje() {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const idi = useNavigate();

  const [zaposleniId, setZaposleniId] = useState('');
  const [pretragaZap, setPretragaZap] = useState('');
  const [pretragaOpr, setPretragaOpr] = useState('');
  const [kategorija, setKategorija] = useState('sve');
  const [stavke, setStavke] = useState<StavkaZaduzenja[]>([]);
  const [rokDana, setRokDana] = useState<number | null>(null);
  const [napomena, setNapomena] = useState('');
  const [napravljeno, setNapravljeno] = useState<Zaduzenje | null>(null);

  const zaposleni = baza.zaposleni.find((z) => z.id === zaposleniId);

  const listaZaposlenih = useMemo(
    () =>
      baza.zaposleni.filter(
        (z) =>
          z.aktivan &&
          (!pretragaZap ||
            sadrzi(punoIme(z), pretragaZap) ||
            sadrzi(z.radnoMesto, pretragaZap) ||
            sadrzi(z.organizacionaJedinica, pretragaZap)),
      ),
    [baza.zaposleni, pretragaZap],
  );

  const dostupna = useMemo(
    () =>
      baza.oprema.filter((o) => {
        const slobodno = o.stanje === 'slobodno' && (o.minZaliha === 0 || o.kolicina > 0);
        if (!slobodno) return false;
        if (kategorija !== 'sve' && o.kategorijaId !== kategorija) return false;
        if (!pretragaOpr) return true;
        return sadrzi(o.naziv, pretragaOpr) || sadrzi(o.inv, pretragaOpr) || sadrzi(o.proizvodjac, pretragaOpr);
      }),
    [baza.oprema, kategorija, pretragaOpr],
  );

  /** Rok zaduženja je najkraći rok među izabranim stavkama — osim ako ga ne pregazi uslužilac. */
  const predlozenRok = useMemo(() => {
    const rokovi = stavke
      .map((s) => baza.oprema.find((o) => o.id === s.opremaId))
      .filter(Boolean)
      .map((o) => vaziRok(baza, o as Oprema))
      .filter((r) => r > 0);
    return rokovi.length ? Math.min(...rokovi) : 0;
  }, [stavke, baza]);

  const konacanRok = rokDana ?? predlozenRok;

  const trebaOdobrenje = useMemo(
    () =>
      stavke.some((s) => {
        const o = baza.oprema.find((x) => x.id === s.opremaId);
        return kategorijaOpreme(baza, o)?.zahtevaOdobrenje ?? false;
      }),
    [stavke, baza],
  );

  function dodaj(o: Oprema) {
    setStavke((p) =>
      p.some((s) => s.opremaId === o.id)
        ? p.map((s) => (s.opremaId === o.id ? { ...s, kolicina: s.kolicina + 1 } : s))
        : [...p, { opremaId: o.id, kolicina: 1, velicina: o.velicina }],
    );
  }

  function promeniKolicinu(id: string, delta: number) {
    setStavke((p) =>
      p
        .map((s) => (s.opremaId === id ? { ...s, kolicina: Math.max(0, s.kolicina + delta) } : s))
        .filter((s) => s.kolicina > 0),
    );
  }

  function sacuvaj() {
    const z = akcije.napraviZaduzenje({
      zaposleniId,
      stavke,
      rokDana: konacanRok,
      napomena,
      trebaOdobrenje,
    });
    if (trebaOdobrenje) {
      javi(`Zahtev ${z.broj} je poslat odobriocu.`, 'info');
      idi('/zaduzenja?filter=ceka_odobrenje');
    } else {
      // Bez odobrenja se odmah otvara pop-up za potpis — rok kreće od potpisa.
      setNapravljeno(z);
    }
  }

  const spremno = Boolean(zaposleniId) && stavke.length > 0;

  return (
    <>
      <Zaglavlje
        nadnaslov="Zaduženja"
        naslov="Novo zaduženje"
        opis="Izaberite zaposlenog i opremu; potpis se traži odmah nakon snimanja."
        akcije={
          <>
            <button className="btn-secondary" onClick={() => idi('/zaduzenja')}>Odustani</button>
            <button className="btn-accent" onClick={sacuvaj} disabled={!spremno}>
              <Check size={15} /> {trebaOdobrenje ? 'Pošalji na odobrenje' : 'Snimi i potpiši'}
            </button>
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5">
          {/* Korak 1 */}
          <Odeljak
            naslov="Zaposleni"
            nadnaslov="Korak 1"
            ravno
            akcije={<Pretraga value={pretragaZap} onChange={setPretragaZap} placeholder="Ime, radno mesto…" sirina="w-56" />}
          >
            <div className="max-h-64 overflow-y-auto">
              <ul className="divide-y divide-line">
                {listaZaposlenih.map((z) => (
                  <li key={z.id}>
                    <button
                      onClick={() => setZaposleniId(z.id)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        zaposleniId === z.id ? 'bg-surface' : 'hover:bg-surface'
                      }`}
                    >
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full border ${
                          zaposleniId === z.id ? 'border-safety-500 bg-safety-500' : 'border-line-strong'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{punoIme(z)}</span>
                        <span className="block truncate text-micro text-ink-muted">
                          {z.radnoMesto} · {z.organizacionaJedinica} · obuća {z.brojCipela} · konf. {z.konfekcija}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Odeljak>

          {/* Korak 2 */}
          <Odeljak
            naslov="Oprema iz magacina"
            nadnaslov="Korak 2"
            ravno
            akcije={
              <>
                <select className="input w-auto py-1 text-micro" value={kategorija} onChange={(e) => setKategorija(e.target.value)}>
                  <option value="sve">Sve kategorije</option>
                  {baza.kategorije.map((k) => (
                    <option key={k.id} value={k.id}>{k.naziv}</option>
                  ))}
                </select>
                <Pretraga value={pretragaOpr} onChange={setPretragaOpr} placeholder="Naziv, inv. broj…" sirina="w-48" />
              </>
            }
          >
            {dostupna.length === 0 ? (
              <Prazno naslov="Nema slobodne opreme" hint="Promenite kategoriju ili proverite stanje u inventaru." />
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <ul className="divide-y divide-line">
                  {dostupna.map((o) => {
                    const kat = kategorijaOpreme(baza, o);
                    const rok = vaziRok(baza, o);
                    const izabrano = stavke.find((s) => s.opremaId === o.id);
                    return (
                      <li key={o.id} className="flex items-center gap-3 px-4 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{o.naziv}</span>
                          <span className="block truncate font-mono text-eyebrow text-ink-faint">
                            {o.inv} · {kat?.naziv} {o.velicina && `· vel. ${o.velicina}`}
                            {o.minZaliha > 0 && ` · na stanju ${o.kolicina}`}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-eyebrow text-ink-faint tnum">
                          {rok > 0 ? danaRec(rok) : 'trajno'}
                        </span>
                        {kat?.zahtevaOdobrenje && <Oznaka ton="info">odobrenje</Oznaka>}
                        <button className="btn-secondary shrink-0 px-2 py-1 text-micro" onClick={() => dodaj(o)}>
                          <Plus size={12} /> {izabrano ? `×${izabrano.kolicina}` : 'Dodaj'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Odeljak>

          {/* Korak 3 */}
          <Odeljak naslov="Rok i napomena" nadnaslov="Korak 3">
            <div className="grid gap-4 sm:grid-cols-2">
              <Polje
                label="Rok zaduženja (dana)"
                hint={
                  predlozenRok > 0
                    ? `Predlog iz kategorije: ${danaRec(predlozenRok)}. Uslužilac može da ga skrati ili produži.`
                    : 'Bez roka — trajno zaduženje.'
                }
              >
                <input
                  type="number"
                  min={0}
                  className="input font-mono tnum"
                  value={konacanRok}
                  onChange={(e) => setRokDana(Math.max(0, Number(e.target.value)))}
                />
              </Polje>
              <Polje label="Napomena" hint="Vidljiva u kartonu, zapisniku i e-pošti.">
                <textarea className="input min-h-[72px]" value={napomena} onChange={(e) => setNapomena(e.target.value)} />
              </Polje>
            </div>
          </Odeljak>
        </div>

        {/* Uska rekapitulacija */}
        <aside className="space-y-4">
          <Odeljak naslov="Rekapitulacija" nadnaslov="Zaduženje" ravno>
            <dl className="divide-y divide-line">
              <Stavka label="Zaposleni" vrednost={zaposleni ? punoIme(zaposleni) : 'nije izabran'} />
              <Stavka label="Služba" vrednost={zaposleni?.organizacionaJedinica ?? '—'} />
              <Stavka label="Stavki" vrednost={String(stavke.length)} />
              <Stavka
                label="Rok"
                vrednost={konacanRok > 0 ? danaRec(konacanRok) : 'trajno'}
              />
              <Stavka
                label="Ističe"
                vrednost={
                  konacanRok > 0 ? datum(new Date(Date.now() + konacanRok * 86400000).toISOString()) : '—'
                }
              />
              <Stavka label="Izdaje" vrednost={ja?.fullName ?? '—'} />
            </dl>
            {trebaOdobrenje && (
              <p className="border-t border-line px-4 py-2.5 text-micro text-signal-info">
                Bar jedna stavka traži odobrenje — zahtev prvo ide odobriocu, potpis se traži posle odobrenja.
              </p>
            )}
          </Odeljak>

          <Odeljak naslov="Izabrana oprema" nadnaslov={`${stavke.length} stavki`} ravno>
            {stavke.length === 0 ? (
              <Prazno naslov="Lista je prazna" hint="Dodajte opremu iz magacina." />
            ) : (
              <ul className="divide-y divide-line">
                {stavke.map((s) => {
                  const o = baza.oprema.find((x) => x.id === s.opremaId);
                  return (
                    <li key={s.opremaId} className="flex items-center gap-2 px-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-micro font-medium">{o?.naziv}</span>
                        <span className="block truncate font-mono text-eyebrow text-ink-faint">{o?.inv}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button className="btn-ghost px-1 py-0.5" onClick={() => promeniKolicinu(s.opremaId, -1)} aria-label="Manje">
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center font-mono text-micro tnum">{s.kolicina}</span>
                        <button className="btn-ghost px-1 py-0.5" onClick={() => promeniKolicinu(s.opremaId, 1)} aria-label="Više">
                          <Plus size={12} />
                        </button>
                        <button
                          className="btn-ghost px-1 py-0.5 text-signal-danger"
                          onClick={() => setStavke((p) => p.filter((x) => x.opremaId !== s.opremaId))}
                          aria-label="Ukloni"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Odeljak>
        </aside>
      </div>

      <DijalogPotpisa
        zaduzenje={napravljeno}
        open={Boolean(napravljeno)}
        onClose={() => setNapravljeno(null)}
        onPotpisano={() => idi('/zaduzenja')}
      />
    </>
  );
}

function Stavka({ label, vrednost }: { label: string; vrednost: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="truncate text-micro font-medium">{vrednost}</dd>
    </div>
  );
}
