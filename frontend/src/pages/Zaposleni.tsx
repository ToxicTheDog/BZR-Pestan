import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  brojAktivnihZaduzenja, nazivSektora, poPrezimenu, punoIme, rokZaduzenja, slovoZaposlenog,
  traziZaposlenog, vidljivaZaduzenja, vidljiviZaposleni,
} from '../lib/izbor';
import { danaDo, datum, useSada } from '../lib/format';
import type { Zaposleni as TZaposleni } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import {
  Brojac, Filteri, Fioka, Modal, Odeljak, Oznaka, Podatak, Polje, Prazno, Pretraga, useToast,
  useVise, Vise,
} from '../components/ui';
import { RokOznaka } from '../components/Rok';

const prazan: Omit<TZaposleni, 'id'> = {
  ime: '', prezime: '', radnoMesto: '', sektorId: '', lokacija: 'Hala 1',
  email: '', telefon: '', datumZaposlenja: new Date().toISOString(), brojCipela: '', konfekcija: '',
  aktivan: true, lekarskiVazi: null, obukaBzrVazi: null,
};

type Filter = 'svi' | 'zaduzeni' | 'rokovi' | 'neaktivni';

const FILTERI = [
  ['svi', 'Svi'],
  ['zaduzeni', 'Sa zaduženjem'],
  ['rokovi', 'Rokovi ističu'],
  ['neaktivni', 'Neaktivni'],
] as const;

/** Lekarski ili obuka BZR koji je istekao ili ističe u narednih mesec dana. */
function rokPri(z: TZaposleni): boolean {
  return [z.lekarskiVazi, z.obukaBzrVazi].some((iso) => {
    const d = danaDo(iso);
    return d !== null && d <= 30;
  });
}

export function Zaposleni() {
  const { baza, akcije, ja, smem } = useStore();
  const javi = useToast();
  const sada = useSada(1000);
  const [pretraga, setPretraga] = useState('');
  const [sektorId, setSektorId] = useState('svi');
  const [filter, setFilter] = useState<Filter>('svi');
  const [slovo, setSlovo] = useState<string | null>(null);
  const [detalj, setDetalj] = useState<TZaposleni | null>(null);
  const [forma, setForma] = useState<Omit<TZaposleni, 'id'> | null>(null);

  // Vide se samo zaposleni iz sektora u nadležnosti naloga.
  const svi = useMemo(() => vidljiviZaposleni(baza, ja), [baza, ja]);
  const aktivnaZaduzenja = useMemo(() => brojAktivnihZaduzenja(baza), [baza]);

  /* Pretraga i filteri idu pre azbučnika — slova se računaju nad onim što je
     ostalo, pa nikad ne ponudimo slovo koje daje prazan spisak. */
  const nadjeni = useMemo(
    () =>
      svi
        .filter((z) => sektorId === 'svi' || z.sektorId === sektorId)
        .filter((z) => {
          if (filter === 'zaduzeni') return (aktivnaZaduzenja.get(z.id) ?? 0) > 0;
          if (filter === 'rokovi') return rokPri(z);
          if (filter === 'neaktivni') return !z.aktivan;
          return true;
        })
        .filter((z) => traziZaposlenog(baza, z, pretraga))
        .sort(poPrezimenu),
    [svi, baza, sektorId, filter, pretraga, aktivnaZaduzenja],
  );

  const slova = useMemo(() => {
    const skup = new Map<string, number>();
    for (const z of nadjeni) skup.set(slovoZaposlenog(z), (skup.get(slovoZaposlenog(z)) ?? 0) + 1);
    return Array.from(skup.entries()).sort((a, b) => a[0].localeCompare(b[0], 'sr'));
  }, [nadjeni]);

  const lista = useMemo(
    () => (slovo ? nadjeni.filter((z) => slovoZaposlenog(z) === slovo) : nadjeni),
    [nadjeni, slovo],
  );
  const { deo, ostalo, jos, korak } = useVise(lista, 50);

  const sektoriUListi = useMemo(
    () => baza.sektori.filter((s) => svi.some((z) => z.sektorId === s.id)),
    [baza.sektori, svi],
  );

  return (
    <>
      <Zaglavlje
        nadnaslov="Evidencija"
        naslov="Zaposleni"
        opis="Podaci koji ulaze u karton: radno mesto, veličine, lekarski pregled i obuka BZR."
        meta={
          <>
            <Metrika label="U nadležnosti" vrednost={svi.length} />
            <Metrika label="Sa zaduženjem" vrednost={svi.filter((z) => (aktivnaZaduzenja.get(z.id) ?? 0) > 0).length} />
            <Metrika label="Rokovi ističu" vrednost={svi.filter(rokPri).length} ton="warn" />
          </>
        }
        akcije={
          smem('zaposleni.upis') && (
            <button className="btn-accent" onClick={() => setForma(prazan)}>
              <Plus size={15} /> Dodaj zaposlenog
            </button>
          )
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga
          value={pretraga}
          onChange={(v) => {
            setPretraga(v);
            setSlovo(null);
          }}
          placeholder="Ime, prezime, radno mesto, sektor, e-pošta…"
          sirina="w-full sm:w-80"
        />
        <select
          className="input w-auto py-1.5 text-micro"
          value={sektorId}
          onChange={(e) => {
            setSektorId(e.target.value);
            setSlovo(null);
          }}
          aria-label="Sektor"
        >
          <option value="svi">Svi sektori</option>
          {sektoriUListi.map((s) => (
            <option key={s.id} value={s.id}>{s.naziv}</option>
          ))}
        </select>
        <Filteri
          vrednost={filter}
          onChange={(v) => {
            setFilter(v);
            setSlovo(null);
          }}
          stavke={FILTERI}
        />
        <span className="ml-auto">
          <Brojac prikazano={lista.length} ukupno={svi.length} jedinica="zaposlenih" />
        </span>
      </div>

      {/* Azbučnik: na spisku od šest stotina imena skok na slovo je brži od skrola. */}
      {slova.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-0.5">
          <button
            onClick={() => setSlovo(null)}
            className={`slovo w-auto px-2.5 font-sans ${
              slovo === null ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-surface'
            }`}
          >
            Sva slova
          </button>
          {slova.map(([s, broj]) => (
            <button
              key={s}
              onClick={() => setSlovo(slovo === s ? null : s)}
              title={`${broj} zaposlenih`}
              className={`slovo ${slovo === s ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-surface'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="panel overflow-hidden">
        {lista.length === 0 ? (
          <Prazno
            naslov="Nema zaposlenog po ovim uslovima"
            hint="Proverite pojam pretrage, izabrani sektor i filter — traži se samo u sektorima u vašoj nadležnosti."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-surface">
                  <tr>
                    <th className="th">Ime i prezime</th>
                    <th className="th">Radno mesto</th>
                    <th className="th w-40">Sektor</th>
                    <th className="th w-24">Obuća / konf.</th>
                    <th className="th w-28">Lekarski</th>
                    <th className="th w-28">Obuka BZR</th>
                    <th className="th w-24 text-right">Zaduženja</th>
                  </tr>
                </thead>
                <tbody>
                  {deo.map((z) => (
                    <tr key={z.id} className="row cursor-pointer" onClick={() => setDetalj(z)}>
                      <td className="td font-medium">
                        <span className="flex items-center gap-2">
                          <span className="truncate">{punoIme(z)}</span>
                          {!z.aktivan && <Oznaka ton="neutral">neaktivan</Oznaka>}
                        </span>
                      </td>
                      <td className="td text-micro">{z.radnoMesto}</td>
                      <td className="td text-micro">{nazivSektora(baza, z.sektorId)}</td>
                      <td className="td font-mono text-micro tnum">
                        {z.brojCipela} / {z.konfekcija}
                      </td>
                      <td className="td"><RokPolje iso={z.lekarskiVazi} /></td>
                      <td className="td"><RokPolje iso={z.obukaBzrVazi} /></td>
                      <td className="td text-right font-mono text-sm tnum">{aktivnaZaduzenja.get(z.id) ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Vise ostalo={ostalo} korak={korak} onVise={jos} />
          </>
        )}
      </div>

      <Fioka
        open={Boolean(detalj)}
        onClose={() => setDetalj(null)}
        nadnaslov={detalj ? nazivSektora(baza, detalj.sektorId) : undefined}
        naslov={detalj ? punoIme(detalj) : ''}
        akcije={
          detalj && (
            <Link to={`/kartoni?z=${detalj.id}`} className="btn-secondary px-2 py-1 text-micro">
              <ClipboardList size={13} /> Karton
            </Link>
          )
        }
      >
        {detalj && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Podatak label="Radno mesto">{detalj.radnoMesto}</Podatak>
              <Podatak label="Lokacija">{detalj.lokacija}</Podatak>
              <Podatak label="U radnom odnosu od" mono>{datum(detalj.datumZaposlenja)}</Podatak>
              <Podatak label="E-pošta" mono>{detalj.email}</Podatak>
              <Podatak label="Telefon" mono>{detalj.telefon}</Podatak>
              <Podatak label="Broj obuće / konfekcija" mono>
                {detalj.brojCipela} / {detalj.konfekcija}
              </Podatak>
              <Podatak label="Lekarski važi do" mono>{datum(detalj.lekarskiVazi)}</Podatak>
              <Podatak label="Obuka BZR važi do" mono>{datum(detalj.obukaBzrVazi)}</Podatak>
              <Podatak label="Status">
                <Oznaka ton={detalj.aktivan ? 'ok' : 'neutral'}>{detalj.aktivan ? 'Aktivan' : 'Neaktivan'}</Oznaka>
              </Podatak>
            </div>

            <Odeljak naslov="Zaduženja" nadnaslov="Trenutno i ranije" ravno>
              <ul className="divide-y divide-line">
                {vidljivaZaduzenja(baza, ja)
                  .filter((z) => z.zaposleniId === detalj.id)
                  .map((z) => {
                    const rok = rokZaduzenja(baza, z, sada);
                    return (
                      <li key={z.id} className="flex items-center justify-between gap-3 px-4 py-2">
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-micro tnum">{z.broj}</span>
                          <span className="block truncate text-micro text-ink-muted">{datum(z.signedAt)}</span>
                        </span>
                        {z.status === 'aktivno' ? <RokOznaka rok={rok} sitno /> : <Oznaka ton="neutral">{z.status}</Oznaka>}
                      </li>
                    );
                  })}
              </ul>
            </Odeljak>
          </div>
        )}
      </Fioka>

      <Modal
        open={Boolean(forma)}
        onClose={() => setForma(null)}
        naslov="Novi zaposleni"
        sirina="max-w-2xl"
        podnozje={
          <>
            <button className="btn-secondary" onClick={() => setForma(null)}>Odustani</button>
            <button
              className="btn-primary"
              disabled={!forma?.ime.trim() || !forma?.prezime.trim() || !forma?.sektorId}
              onClick={() => {
                akcije.dodajZaposlenog(forma!);
                javi('Zaposleni je dodat.');
                setForma(null);
              }}
            >
              Snimi
            </button>
          </>
        }
      >
        {forma && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Polje label="Ime">
              <input className="input" value={forma.ime} onChange={(e) => setForma({ ...forma, ime: e.target.value })} autoFocus />
            </Polje>
            <Polje label="Prezime">
              <input className="input" value={forma.prezime} onChange={(e) => setForma({ ...forma, prezime: e.target.value })} />
            </Polje>
            <Polje label="Radno mesto">
              <input className="input" value={forma.radnoMesto} onChange={(e) => setForma({ ...forma, radnoMesto: e.target.value })} />
            </Polje>
            <Polje label="Sektor" hint="Određuje ko vidi i ko odobrava njegova zaduženja.">
              <select className="input" value={forma.sektorId} onChange={(e) => setForma({ ...forma, sektorId: e.target.value })}>
                <option value="">— izaberite sektor —</option>
                {baza.sektori.map((s) => (
                  <option key={s.id} value={s.id}>{s.naziv}</option>
                ))}
              </select>
            </Polje>
            <Polje label="Lokacija">
              <input className="input" value={forma.lokacija} onChange={(e) => setForma({ ...forma, lokacija: e.target.value })} />
            </Polje>
            <Polje label="E-pošta">
              <input className="input font-mono" value={forma.email} onChange={(e) => setForma({ ...forma, email: e.target.value })} />
            </Polje>
            <Polje label="Broj obuće">
              <input className="input font-mono tnum" value={forma.brojCipela} onChange={(e) => setForma({ ...forma, brojCipela: e.target.value })} />
            </Polje>
            <Polje label="Veličina konfekcije">
              <input className="input font-mono" value={forma.konfekcija} onChange={(e) => setForma({ ...forma, konfekcija: e.target.value })} />
            </Polje>
          </div>
        )}
      </Modal>
    </>
  );
}

function Metrika({ label, vrednost, ton }: { label: string; vrednost: number; ton?: 'warn' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`font-mono text-lg font-semibold tnum ${
          vrednost === 0 ? 'text-ink-faint' : ton === 'warn' ? 'text-signal-warn' : ''
        }`}
      >
        {vrednost}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function RokPolje({ iso }: { iso: string | null }) {
  const d = danaDo(iso);
  if (d === null) return <span className="text-micro text-ink-faint">—</span>;
  const ton = d < 0 ? 'danger' : d <= 30 ? 'warn' : 'neutral';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`font-mono text-micro tnum ${ton === 'danger' ? 'text-signal-danger' : ton === 'warn' ? 'text-signal-warn' : ''}`}>
        {datum(iso)}
      </span>
      {d < 0 && <Oznaka ton="danger">isteklo</Oznaka>}
    </span>
  );
}
