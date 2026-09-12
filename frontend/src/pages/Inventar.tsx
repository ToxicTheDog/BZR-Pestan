import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { OZNAKA_STANJA, kategorijaOpreme, nadjiZaposlenog, punoIme, vaziRok } from '../lib/izbor';
import { danaDo, danaRec, datum, novac, sadrzi } from '../lib/format';
import type { Kategorija, Oprema, StanjeOpreme } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import {
  Brojac, Fioka, Filteri, Modal, Odeljak, Oznaka, Podatak, Polje, Potvrda, Prazno, Pretraga,
  Traka, type TonOznake, useToast,
} from '../components/ui';

const TON_STANJA: Record<StanjeOpreme, TonOznake> = {
  slobodno: 'ok',
  zaduzeno: 'info',
  servis: 'warn',
  rezervisano: 'accent',
  otpisano: 'danger',
};

const FILTERI = [
  ['sve', 'Sve'],
  ['slobodno', 'Slobodno'],
  ['zaduzeno', 'Zaduženo'],
  ['servis', 'Servis'],
  ['niske', 'Niske zalihe'],
  ['atest', 'Atest ističe'],
] as const;

type Filter = (typeof FILTERI)[number][0];

const prazna = (kategorijaId: string): Omit<Oprema, 'id'> => ({
  inv: '',
  naziv: '',
  kategorijaId,
  proizvodjac: '',
  model: '',
  serijski: '',
  velicina: '',
  stanje: 'slobodno',
  lokacija: 'Magacin A',
  kolicina: 1,
  minZaliha: 0,
  cena: 0,
  datumNabavke: new Date().toISOString(),
  atestVazi: null,
  rokDana: null,
  napomena: '',
});

export function Inventar() {
  const { baza, akcije, smem } = useStore();
  const javi = useToast();
  const [params, setParams] = useSearchParams();
  const [pretraga, setPretraga] = useState('');
  const [kategorija, setKategorija] = useState<string>('sve');
  const [detalj, setDetalj] = useState<Oprema | null>(null);
  const [forma, setForma] = useState<{ rezim: 'novo' | 'izmena'; podaci: Omit<Oprema, 'id'>; id?: string } | null>(null);
  const [brisanje, setBrisanje] = useState<Oprema | null>(null);
  const [kategorijeOtvorene, setKategorijeOtvorene] = useState(false);

  const filter = (params.get('filter') as Filter) || 'sve';
  const postaviFilter = (v: Filter) => {
    const next = new URLSearchParams(params);
    if (v === 'sve') next.delete('filter');
    else next.set('filter', v);
    setParams(next, { replace: true });
  };

  const prikazana = useMemo(
    () =>
      baza.oprema.filter((o) => {
        if (kategorija !== 'sve' && o.kategorijaId !== kategorija) return false;
        if (filter === 'niske' && !(o.minZaliha > 0 && o.kolicina <= o.minZaliha)) return false;
        if (filter === 'atest') {
          const d = danaDo(o.atestVazi);
          if (d === null || d > 30) return false;
        }
        if (['slobodno', 'zaduzeno', 'servis'].includes(filter) && o.stanje !== filter) return false;
        if (!pretraga) return true;
        return (
          sadrzi(o.naziv, pretraga) || sadrzi(o.inv, pretraga) ||
          sadrzi(o.proizvodjac, pretraga) || sadrzi(o.model, pretraga) || sadrzi(o.serijski, pretraga)
        );
      }),
    [baza.oprema, kategorija, filter, pretraga],
  );

  const statistika = (k: Kategorija) => {
    const stavke = baza.oprema.filter((o) => o.kategorijaId === k.id);
    const slobodno = stavke.filter((o) => o.stanje === 'slobodno').length;
    const zaduzeno = stavke.filter((o) => o.stanje === 'zaduzeno').length;
    const ostalo = stavke.length - slobodno - zaduzeno;
    return { ukupno: stavke.length, slobodno, zaduzeno, ostalo };
  };

  return (
    <>
      <Zaglavlje
        nadnaslov="Magacin"
        naslov="Inventar opreme"
        opis="Sredstva i oprema za ličnu zaštitu, alat i potrošni materijal — sa rokovima i atestima."
        akcije={
          <>
            {smem('inventar.upis') && (
              <button className="btn-secondary" onClick={() => setKategorijeOtvorene(true)}>
                <Settings2 size={15} /> Kategorije i rokovi
              </button>
            )}
            {smem('inventar.upis') && (
              <button
                className="btn-accent"
                onClick={() => setForma({ rezim: 'novo', podaci: prazna(baza.kategorije[0].id) })}
              >
                <Plus size={15} /> Dodaj opremu
              </button>
            )}
          </>
        }
      />

      {/* Kategorije kao gusta horizontalna traka, ne kao mreža kartica. */}
      <div className="mb-4 overflow-x-auto border-y border-line">
        <div className="flex min-w-max">
          <button
            onClick={() => setKategorija('sve')}
            className={`w-40 shrink-0 border-r border-line px-3 py-2.5 text-left transition-colors ${
              kategorija === 'sve' ? 'bg-surface' : 'hover:bg-surface'
            }`}
          >
            <div className="eyebrow">Sve kategorije</div>
            <div className="font-mono text-lg font-semibold tnum">{baza.oprema.length}</div>
            <div className="mt-1.5">
              <Traka udeo={1} ton="neutral" />
            </div>
          </button>
          {baza.kategorije.map((k) => {
            const s = statistika(k);
            return (
              <button
                key={k.id}
                onClick={() => setKategorija(k.id)}
                className={`w-44 shrink-0 border-r border-line px-3 py-2.5 text-left transition-colors ${
                  kategorija === k.id ? 'bg-surface' : 'hover:bg-surface'
                }`}
              >
                <div className="eyebrow truncate">{k.sifra}</div>
                <div className="truncate text-sm font-medium">{k.naziv}</div>
                <div className="mt-0.5 flex items-baseline gap-2 font-mono text-micro tnum">
                  <span className="text-signal-ok">{s.slobodno}</span>
                  <span className="text-ink-faint">/</span>
                  <span className="text-signal-info">{s.zaduzeno}</span>
                  <span className="ml-auto text-ink-faint">{k.rokDana > 0 ? `${k.rokDana} d` : 'trajno'}</span>
                </div>
                <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-surface-deep">
                  {s.ukupno > 0 && (
                    <>
                      <i className="block bg-signal-ok" style={{ width: `${(s.slobodno / s.ukupno) * 100}%` }} />
                      <i className="block bg-signal-info" style={{ width: `${(s.zaduzeno / s.ukupno) * 100}%` }} />
                      <i className="block bg-signal-warn" style={{ width: `${(s.ostalo / s.ukupno) * 100}%` }} />
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga value={pretraga} onChange={setPretraga} placeholder="Naziv, inv. broj, serijski…" />
        <Filteri vrednost={filter} onChange={postaviFilter} stavke={FILTERI} />
        <span className="ml-auto">
          <Brojac prikazano={prikazana.length} ukupno={baza.oprema.length} jedinica="stavki" />
        </span>
      </div>

      <div className="panel overflow-hidden">
        {prikazana.length === 0 ? (
          <Prazno naslov="Nema opreme po ovom filteru" hint="Promenite kategoriju, filter ili pojam pretrage." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px]">
              <thead className="bg-surface">
                <tr>
                  <th className="th w-32">Inv. broj</th>
                  <th className="th">Naziv</th>
                  <th className="th w-40">Kategorija</th>
                  <th className="th w-28">Veličina</th>
                  <th className="th w-24 text-right">Stanje</th>
                  <th className="th w-24">Rok</th>
                  <th className="th w-28">Atest</th>
                  <th className="th w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {prikazana.map((o) => {
                  const kat = kategorijaOpreme(baza, o);
                  const atest = danaDo(o.atestVazi);
                  const nisko = o.minZaliha > 0 && o.kolicina <= o.minZaliha;
                  return (
                    <tr key={o.id} className="row cursor-pointer" onClick={() => setDetalj(o)}>
                      <td className="td font-mono text-micro tnum">{o.inv}</td>
                      <td className="td">
                        <div className="font-medium">{o.naziv}</div>
                        <div className="text-micro text-ink-faint">
                          {o.proizvodjac} {o.model}
                        </div>
                      </td>
                      <td className="td text-micro">{kat?.naziv}</td>
                      <td className="td font-mono text-micro">{o.velicina || '—'}</td>
                      <td className="td text-right font-mono text-sm tnum">
                        {o.minZaliha > 0 ? (
                          <span className={nisko ? 'font-semibold text-signal-warn' : ''}>
                            {o.kolicina}
                            <span className="text-ink-faint">/{o.minZaliha}</span>
                          </span>
                        ) : (
                          <span className="text-ink-faint">1</span>
                        )}
                      </td>
                      <td className="td font-mono text-micro tnum">
                        {vaziRok(baza, o) > 0 ? `${vaziRok(baza, o)} d` : '—'}
                      </td>
                      <td className="td">
                        {o.atestVazi ? (
                          <span className={`font-mono text-micro tnum ${atest !== null && atest <= 30 ? 'text-signal-warn' : ''}`}>
                            {datum(o.atestVazi)}
                          </span>
                        ) : (
                          <span className="text-micro text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="td">
                        <Oznaka ton={TON_STANJA[o.stanje]}>{OZNAKA_STANJA[o.stanje]}</Oznaka>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalj opreme */}
      <Fioka
        open={Boolean(detalj)}
        onClose={() => setDetalj(null)}
        nadnaslov={detalj?.inv}
        naslov={detalj?.naziv ?? ''}
        akcije={
          detalj && smem('inventar.upis') ? (
            <>
              <button
                className="btn-secondary px-2 py-1 text-micro"
                onClick={() => {
                  const { id: _id, ...ostatak } = detalj;
                  setForma({ rezim: 'izmena', podaci: ostatak, id: detalj.id });
                  setDetalj(null);
                }}
              >
                <Pencil size={13} /> Izmeni
              </button>
              {smem('inventar.brisanje') && (
                <button className="btn-danger px-2 py-1 text-micro" onClick={() => setBrisanje(detalj)}>
                  <Trash2 size={13} /> Otpiši
                </button>
              )}
            </>
          ) : null
        }
      >
        {detalj && <DetaljOpreme oprema={detalj} />}
      </Fioka>

      {/* Forma opreme */}
      <FormaOpreme
        stanje={forma}
        onClose={() => setForma(null)}
        onSnimi={(podaci, id) => {
          if (id) {
            akcije.izmeniOpremu(id, podaci);
            javi('Oprema je izmenjena.');
          } else {
            akcije.dodajOpremu(podaci);
            javi('Oprema je upisana u inventar.');
          }
          setForma(null);
        }}
      />

      <Potvrda
        open={Boolean(brisanje)}
        naslov={`Otpis — ${brisanje?.naziv ?? ''}`}
        tekst="Stavka se uklanja iz inventara. Postojeća zaduženja ostaju u evidenciji i kartonima."
        potvrdiTekst="Otpiši"
        opasno
        onClose={() => setBrisanje(null)}
        onPotvrdi={() => {
          akcije.obrisiOpremu(brisanje!.id);
          javi('Oprema je otpisana.', 'info');
          setDetalj(null);
        }}
      />

      <DijalogKategorija open={kategorijeOtvorene} onClose={() => setKategorijeOtvorene(false)} />
    </>
  );
}

function DetaljOpreme({ oprema }: { oprema: Oprema }) {
  const { baza } = useStore();
  const kat = kategorijaOpreme(baza, oprema);
  const zaduzenja = baza.zaduzenja.filter((z) => z.stavke.some((s) => s.opremaId === oprema.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Oznaka ton={TON_STANJA[oprema.stanje]}>{OZNAKA_STANJA[oprema.stanje]}</Oznaka>
        <span className="font-mono text-micro text-ink-faint tnum">{oprema.inv}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Podatak label="Kategorija">{kat?.naziv}</Podatak>
        <Podatak label="Proizvođač">{oprema.proizvodjac || '—'}</Podatak>
        <Podatak label="Model">{oprema.model || '—'}</Podatak>
        <Podatak label="Serijski broj" mono>{oprema.serijski || '—'}</Podatak>
        <Podatak label="Veličina">{oprema.velicina || '—'}</Podatak>
        <Podatak label="Lokacija">{oprema.lokacija}</Podatak>
        <Podatak label="Rok zaduženja">
          {vaziRok(baza, oprema) > 0 ? danaRec(vaziRok(baza, oprema)) : 'trajno'}
          {oprema.rokDana === null && <span className="text-ink-faint"> (iz kategorije)</span>}
        </Podatak>
        <Podatak label="Atest važi do" mono>{datum(oprema.atestVazi)}</Podatak>
        <Podatak label="Nabavljeno" mono>{datum(oprema.datumNabavke)}</Podatak>
        <Podatak label="Nabavna cena" mono>{novac(oprema.cena)}</Podatak>
        <Podatak label="Na stanju" mono>
          {oprema.minZaliha > 0 ? `${oprema.kolicina} (min ${oprema.minZaliha})` : String(oprema.kolicina)}
        </Podatak>
      </div>

      {oprema.napomena && <div className="panel-quiet px-3 py-2.5 text-sm text-ink-muted">{oprema.napomena}</div>}

      <Odeljak naslov="Istorija zaduženja" nadnaslov={`${zaduzenja.length} zapisa`} ravno>
        {zaduzenja.length === 0 ? (
          <Prazno naslov="Oprema još nije zaduživana" />
        ) : (
          <ul className="divide-y divide-line">
            {zaduzenja.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{punoIme(nadjiZaposlenog(baza, z.zaposleniId))}</span>
                  <span className="font-mono text-eyebrow text-ink-faint tnum">
                    {z.broj} · {datum(z.signedAt)}
                  </span>
                </span>
                <Oznaka ton={z.status === 'aktivno' ? 'ok' : 'neutral'}>{z.status}</Oznaka>
              </li>
            ))}
          </ul>
        )}
      </Odeljak>
    </div>
  );
}

function FormaOpreme({
  stanje, onClose, onSnimi,
}: {
  stanje: { rezim: 'novo' | 'izmena'; podaci: Omit<Oprema, 'id'>; id?: string } | null;
  onClose: () => void;
  onSnimi: (podaci: Omit<Oprema, 'id'>, id?: string) => void;
}) {
  const { baza } = useStore();
  const [podaci, setPodaci] = useState<Omit<Oprema, 'id'> | null>(null);

  const trenutni = podaci ?? stanje?.podaci ?? null;
  const postavi = (izmene: Partial<Oprema>) => setPodaci({ ...(trenutni as Omit<Oprema, 'id'>), ...izmene });

  if (!stanje || !trenutni) {
    return (
      <Modal open={Boolean(stanje)} onClose={onClose} naslov="Oprema">
        <div />
      </Modal>
    );
  }

  const kat = baza.kategorije.find((k) => k.id === trenutni.kategorijaId);

  return (
    <Modal
      open
      onClose={() => {
        setPodaci(null);
        onClose();
      }}
      naslov={stanje.rezim === 'novo' ? 'Nova oprema' : `Izmena — ${trenutni.naziv}`}
      opis="Rok zaduženja se nasleđuje iz kategorije, osim ako se ovde ne upiše drugačije."
      sirina="max-w-2xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={() => { setPodaci(null); onClose(); }}>Odustani</button>
          <button
            className="btn-primary"
            disabled={!trenutni.naziv.trim() || !trenutni.inv.trim()}
            onClick={() => {
              onSnimi(trenutni, stanje.id);
              setPodaci(null);
            }}
          >
            Snimi
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Polje label="Inventarski broj">
          <input className="input font-mono" value={trenutni.inv} onChange={(e) => postavi({ inv: e.target.value })} autoFocus />
        </Polje>
        <Polje label="Naziv">
          <input className="input" value={trenutni.naziv} onChange={(e) => postavi({ naziv: e.target.value })} />
        </Polje>
        <Polje label="Kategorija" hint={kat ? `Rok kategorije: ${kat.rokDana > 0 ? danaRec(kat.rokDana) : 'trajno'}` : undefined}>
          <select className="input" value={trenutni.kategorijaId} onChange={(e) => postavi({ kategorijaId: e.target.value })}>
            {baza.kategorije.map((k) => (
              <option key={k.id} value={k.id}>{k.naziv}</option>
            ))}
          </select>
        </Polje>
        <Polje label="Stanje">
          <select className="input" value={trenutni.stanje} onChange={(e) => postavi({ stanje: e.target.value as StanjeOpreme })}>
            {(Object.keys(OZNAKA_STANJA) as StanjeOpreme[]).map((s) => (
              <option key={s} value={s}>{OZNAKA_STANJA[s]}</option>
            ))}
          </select>
        </Polje>
        <Polje label="Proizvođač">
          <input className="input" value={trenutni.proizvodjac} onChange={(e) => postavi({ proizvodjac: e.target.value })} />
        </Polje>
        <Polje label="Model">
          <input className="input" value={trenutni.model} onChange={(e) => postavi({ model: e.target.value })} />
        </Polje>
        <Polje label="Serijski broj">
          <input className="input font-mono" value={trenutni.serijski} onChange={(e) => postavi({ serijski: e.target.value })} />
        </Polje>
        <Polje label="Veličina">
          <input className="input" value={trenutni.velicina} onChange={(e) => postavi({ velicina: e.target.value })} />
        </Polje>
        <Polje label="Lokacija">
          <input className="input" value={trenutni.lokacija} onChange={(e) => postavi({ lokacija: e.target.value })} />
        </Polje>
        <Polje label="Rok zaduženja (dana)" hint="Prazno = nasleđuje kategoriju. 0 = trajno.">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={trenutni.rokDana ?? ''}
            placeholder={String(kat?.rokDana ?? 0)}
            onChange={(e) => postavi({ rokDana: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Količina">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={trenutni.kolicina}
            onChange={(e) => postavi({ kolicina: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Minimalna zaliha" hint="0 za komadnu opremu koja se prati pojedinačno.">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={trenutni.minZaliha}
            onChange={(e) => postavi({ minZaliha: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Nabavna cena (RSD)">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={trenutni.cena}
            onChange={(e) => postavi({ cena: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Atest važi do">
          <input
            type="date"
            className="input font-mono"
            value={trenutni.atestVazi ? trenutni.atestVazi.slice(0, 10) : ''}
            onChange={(e) => postavi({ atestVazi: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </Polje>
        <div className="sm:col-span-2">
          <Polje label="Napomena">
            <textarea className="input min-h-[64px]" value={trenutni.napomena} onChange={(e) => postavi({ napomena: e.target.value })} />
          </Polje>
        </div>
      </div>
    </Modal>
  );
}

function DijalogKategorija({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { baza, akcije } = useStore();
  const javi = useToast();

  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov="Kategorije i rokovi zaduženja"
      opis="Rok koji ovde upišete postaje podrazumevani rok za svu opremu iz kategorije."
      sirina="max-w-3xl"
      podnozje={<button className="btn-primary" onClick={onClose}>Gotovo</button>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-surface">
            <tr>
              <th className="th">Kategorija</th>
              <th className="th w-24">Šifra</th>
              <th className="th w-32">Rok (dana)</th>
              <th className="th w-32">Odobrenje</th>
            </tr>
          </thead>
          <tbody>
            {baza.kategorije.map((k) => (
              <tr key={k.id} className="row">
                <td className="td">
                  <div className="font-medium">{k.naziv}</div>
                  <div className="text-micro text-ink-faint">{k.opis}</div>
                </td>
                <td className="td font-mono text-micro">{k.sifra}</td>
                <td className="td">
                  <input
                    type="number"
                    min={0}
                    className="input w-24 py-1 font-mono text-micro tnum"
                    value={k.rokDana}
                    onChange={(e) => akcije.izmeniKategoriju(k.id, { rokDana: Math.max(0, Number(e.target.value)) })}
                  />
                </td>
                <td className="td">
                  <label className="flex items-center gap-2 text-micro">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[#D2650B]"
                      checked={k.zahtevaOdobrenje}
                      onChange={(e) => {
                        akcije.izmeniKategoriju(k.id, { zahtevaOdobrenje: e.target.checked });
                        javi(e.target.checked ? 'Kategorija sada traži odobrenje.' : 'Odobrenje više nije obavezno.');
                      }}
                    />
                    traži odobrenje
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
