import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import { punoIme, rokZaduzenja } from '../lib/izbor';
import { danaDo, datum, sadrzi, useSada } from '../lib/format';
import type { Zaposleni as TZaposleni } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import { Brojac, Fioka, Modal, Odeljak, Oznaka, Podatak, Polje, Prazno, Pretraga, useToast } from '../components/ui';
import { RokOznaka } from '../components/Rok';

const prazan: Omit<TZaposleni, 'id'> = {
  ime: '', prezime: '', radnoMesto: '', organizacionaJedinica: '', lokacija: 'Hala 1',
  email: '', telefon: '', datumZaposlenja: new Date().toISOString(), brojCipela: '', konfekcija: '',
  aktivan: true, lekarskiVazi: null, obukaBzrVazi: null,
};

export function Zaposleni() {
  const { baza, akcije, smem } = useStore();
  const javi = useToast();
  const sada = useSada(1000);
  const [pretraga, setPretraga] = useState('');
  const [detalj, setDetalj] = useState<TZaposleni | null>(null);
  const [forma, setForma] = useState<Omit<TZaposleni, 'id'> | null>(null);

  const lista = useMemo(
    () =>
      baza.zaposleni.filter(
        (z) => !pretraga || sadrzi(punoIme(z), pretraga) || sadrzi(z.radnoMesto, pretraga) || sadrzi(z.organizacionaJedinica, pretraga),
      ),
    [baza.zaposleni, pretraga],
  );

  const sluzbe = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const z of baza.zaposleni) mapa.set(z.organizacionaJedinica, (mapa.get(z.organizacionaJedinica) ?? 0) + 1);
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [baza.zaposleni]);

  return (
    <>
      <Zaglavlje
        nadnaslov="Evidencija"
        naslov="Zaposleni"
        opis="Podaci koji ulaze u karton: radno mesto, veličine, lekarski pregled i obuka BZR."
        akcije={
          smem('zaposleni.upis') && (
            <button className="btn-accent" onClick={() => setForma(prazan)}>
              <Plus size={15} /> Dodaj zaposlenog
            </button>
          )
        }
        meta={
          <>
            {sluzbe.slice(0, 6).map(([naziv, broj]) => (
              <span key={naziv} className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm font-semibold tnum">{broj}</span>
                <span className="eyebrow">{naziv}</span>
              </span>
            ))}
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga value={pretraga} onChange={setPretraga} placeholder="Ime, radno mesto, služba…" />
        <span className="ml-auto">
          <Brojac prikazano={lista.length} ukupno={baza.zaposleni.length} jedinica="zaposlenih" />
        </span>
      </div>

      <div className="panel overflow-hidden">
        {lista.length === 0 ? (
          <Prazno naslov="Nema zaposlenih po ovom pojmu" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-surface">
                <tr>
                  <th className="th">Ime i prezime</th>
                  <th className="th">Radno mesto</th>
                  <th className="th w-40">Služba</th>
                  <th className="th w-24">Obuća / konf.</th>
                  <th className="th w-28">Lekarski</th>
                  <th className="th w-28">Obuka BZR</th>
                  <th className="th w-24 text-right">Zaduženja</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((z) => {
                  const aktivna = baza.zaduzenja.filter((x) => x.zaposleniId === z.id && x.status === 'aktivno');
                  return (
                    <tr key={z.id} className="row cursor-pointer" onClick={() => setDetalj(z)}>
                      <td className="td font-medium">{punoIme(z)}</td>
                      <td className="td text-micro">{z.radnoMesto}</td>
                      <td className="td text-micro">{z.organizacionaJedinica}</td>
                      <td className="td font-mono text-micro tnum">
                        {z.brojCipela} / {z.konfekcija}
                      </td>
                      <td className="td"><RokPolje iso={z.lekarskiVazi} /></td>
                      <td className="td"><RokPolje iso={z.obukaBzrVazi} /></td>
                      <td className="td text-right font-mono text-sm tnum">{aktivna.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Fioka
        open={Boolean(detalj)}
        onClose={() => setDetalj(null)}
        nadnaslov={detalj?.organizacionaJedinica}
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
                {baza.zaduzenja
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
              disabled={!forma?.ime.trim() || !forma?.prezime.trim()}
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
            <Polje label="Organizaciona jedinica">
              <input className="input" value={forma.organizacionaJedinica} onChange={(e) => setForma({ ...forma, organizacionaJedinica: e.target.value })} />
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
