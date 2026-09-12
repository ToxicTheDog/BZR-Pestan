import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Anchor, ArrowLeft, ChevronRight, Ear, Footprints, Glasses, HardHat, Hand, Package,
  Pencil, Plus, Shirt, Trash2, Wind, Wrench, FolderInput,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { OZNAKA_STANJA, kategorijaOpreme, nadjiZaposlenog, punoIme, vaziRok } from '../lib/izbor';
import { danaDo, danaRec, datum, novac, sadrzi } from '../lib/format';
import type { Kategorija, Oprema, StanjeOpreme, TipKategorije } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import {
  Brojac, Fioka, Filteri, Modal, Odeljak, Oznaka, Podatak, Polje, Potvrda, Prazno, Pretraga,
  type TonOznake, useToast,
} from '../components/ui';

/** Ikone kategorija — vrednost polja `ikona` bira jednu od ovih. */
const IKONE: Record<string, typeof Package> = {
  'hard-hat': HardHat, glasses: Glasses, ear: Ear, wind: Wind, hand: Hand,
  footprints: Footprints, shirt: Shirt, anchor: Anchor, wrench: Wrench, package: Package,
};
const IMENA_IKONA = Object.keys(IKONE);

const TON_STANJA: Record<StanjeOpreme, TonOznake> = {
  slobodno: 'ok',
  zaduzeno: 'info',
  servis: 'warn',
  rezervisano: 'accent',
  otpisano: 'danger',
};

const TIPOVI: Record<TipKategorije, string> = {
  LZO: 'Lična zaštitna oprema',
  ALAT: 'Alat i uređaji',
  POTROSNO: 'Potrošni materijal',
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

const praznaOprema = (kategorijaId: string): Omit<Oprema, 'id'> => ({
  inv: '', naziv: '', kategorijaId, proizvodjac: '', model: '', serijski: '', velicina: '',
  stanje: 'slobodno', lokacija: 'Magacin A', kolicina: 1, minZaliha: 0, cena: 0,
  datumNabavke: new Date().toISOString(), atestVazi: null, rokDana: null, napomena: '',
});

const praznaKategorija = (): Omit<Kategorija, 'id'> => ({
  naziv: '', sifra: '', tip: 'LZO', ikona: 'package', rokDana: 365, zahtevaOdobrenje: false, opis: '',
});

export function Inventar() {
  const { baza, akcije, smem } = useStore();
  const javi = useToast();
  const [params, setParams] = useSearchParams();
  const [pretraga, setPretraga] = useState('');
  const [detalj, setDetalj] = useState<Oprema | null>(null);
  const [formaOpreme, setFormaOpreme] = useState<{ podaci: Omit<Oprema, 'id'>; id?: string } | null>(null);
  const [formaKat, setFormaKat] = useState<{ podaci: Omit<Kategorija, 'id'>; id?: string } | null>(null);
  const [brisanjeOpreme, setBrisanjeOpreme] = useState<Oprema | null>(null);
  const [brisanjeKat, setBrisanjeKat] = useState<Kategorija | null>(null);
  const [izabrane, setIzabrane] = useState<Set<string>>(new Set());
  const [premestaj, setPremestaj] = useState(false);

  const filter = (params.get('filter') as Filter) || 'sve';
  /** `null` = prikaz kategorija, `'sve'` = sva oprema, inače id kategorije. */
  const kategorijaId = params.get('kat');
  const kategorija = baza.kategorije.find((k) => k.id === kategorijaId) ?? null;

  function postavi(kljuc: string, vrednost: string | null) {
    const next = new URLSearchParams(params);
    if (vrednost) next.set(kljuc, vrednost);
    else next.delete(kljuc);
    setParams(next, { replace: true });
  }

  function otvoriKategoriju(id: string | null) {
    setIzabrane(new Set());
    setPretraga('');
    postavi('kat', id);
  }

  const statistika = (katId: string) => {
    const stavke = baza.oprema.filter((o) => o.kategorijaId === katId);
    const slobodno = stavke.filter((o) => o.stanje === 'slobodno').length;
    const zaduzeno = stavke.filter((o) => o.stanje === 'zaduzeno').length;
    const ostalo = stavke.length - slobodno - zaduzeno;
    const nisko = stavke.filter((o) => o.minZaliha > 0 && o.kolicina <= o.minZaliha).length;
    return { ukupno: stavke.length, slobodno, zaduzeno, ostalo, nisko };
  };

  const prikazana = useMemo(
    () =>
      baza.oprema.filter((o) => {
        if (kategorijaId && kategorijaId !== 'sve' && o.kategorijaId !== kategorijaId) return false;
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
    [baza.oprema, kategorijaId, filter, pretraga],
  );

  const uUpotrebi = (katId: string) => baza.oprema.some((o) => o.kategorijaId === katId);

  function prebaci(id: string) {
    setIzabrane((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  /* ----------------------- Prikaz kategorija ----------------------- */

  if (!kategorijaId) {
    return (
      <>
        <Zaglavlje
          nadnaslov="Magacin"
          naslov="Inventar opreme"
          akcije={
            smem('inventar.upis') && (
              <>
                <button className="btn-secondary" onClick={() => setFormaKat({ podaci: praznaKategorija() })}>
                  <Plus size={15} /> Nova kategorija
                </button>
                <button
                  className="btn-accent"
                  onClick={() => setFormaOpreme({ podaci: praznaOprema(baza.kategorije[0]?.id ?? '') })}
                >
                  <Plus size={15} /> Dodaj opremu
                </button>
              </>
            )
          }
          meta={
            <>
              <Metrika label="Kategorija" vrednost={baza.kategorije.length} />
              <Metrika label="Komada ukupno" vrednost={baza.oprema.length} />
              <Metrika label="Slobodno" vrednost={baza.oprema.filter((o) => o.stanje === 'slobodno').length} />
              <Metrika label="Zaduženo" vrednost={baza.oprema.filter((o) => o.stanje === 'zaduzeno').length} />
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {baza.kategorije.map((k) => {
            const s = statistika(k.id);
            const I = IKONE[k.ikona] ?? Package;
            return (
              <article key={k.id} className="panel group flex flex-col">
                <button
                  onClick={() => otvoriKategoriju(k.id)}
                  className="flex flex-1 items-start gap-3 p-4 text-left transition-colors hover:bg-surface"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-card border border-line bg-surface text-ink-muted">
                    <I size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block">{k.sifra}</span>
                    <span className="block truncate text-sm font-semibold">{k.naziv}</span>
                    <span className="mt-0.5 block truncate text-micro text-ink-muted">{k.opis || TIPOVI[k.tip]}</span>
                  </span>
                  <ChevronRight size={15} className="mt-1 shrink-0 text-ink-faint" />
                </button>

                <div className="px-4">
                  <div className="flex h-1 overflow-hidden rounded-full bg-surface-deep">
                    {s.ukupno > 0 && (
                      <>
                        <i className="block bg-signal-ok" style={{ width: `${(s.slobodno / s.ukupno) * 100}%` }} />
                        <i className="block bg-signal-info" style={{ width: `${(s.zaduzeno / s.ukupno) * 100}%` }} />
                        <i className="block bg-signal-warn" style={{ width: `${(s.ostalo / s.ukupno) * 100}%` }} />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2.5">
                  <Brojka label="slobodno" vrednost={s.slobodno} boja="text-signal-ok" />
                  <Brojka label="zaduženo" vrednost={s.zaduzeno} boja="text-signal-info" />
                  <Brojka label="ukupno" vrednost={s.ukupno} />
                  <span className="ml-auto flex items-center gap-1.5">
                    {s.nisko > 0 && <Oznaka ton="warn">{s.nisko} niske</Oznaka>}
                    <Oznaka ton="neutral">{k.rokDana > 0 ? danaRec(k.rokDana) : 'trajno'}</Oznaka>
                  </span>
                </div>

                {smem('inventar.upis') && (
                  <div className="flex justify-end gap-0.5 border-t border-line px-2 py-1.5 opacity-60 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      className="btn-ghost px-1.5 py-1 text-micro"
                      onClick={() => {
                        const { id: _x, ...ostatak } = k;
                        setFormaKat({ podaci: ostatak, id: k.id });
                      }}
                    >
                      <Pencil size={12} /> Izmeni
                    </button>
                    <button
                      className="btn-ghost px-1.5 py-1 text-micro text-signal-danger disabled:opacity-40"
                      disabled={uUpotrebi(k.id)}
                      title={uUpotrebi(k.id) ? 'Kategorija nije prazna — prvo premestite opremu.' : 'Obriši kategoriju'}
                      onClick={() => setBrisanjeKat(k)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          <button
            onClick={() => otvoriKategoriju('sve')}
            className="panel-quiet flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-paper"
          >
            <span>
              <span className="eyebrow block">Bez filtera</span>
              <span className="block text-sm font-semibold">Sva oprema</span>
              <span className="block text-micro text-ink-muted">Jedna lista kroz sve kategorije</span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-ink-faint" />
          </button>
        </div>

        <FormaKategorije stanje={formaKat} onClose={() => setFormaKat(null)} />
        <FormaOpreme stanje={formaOpreme} onClose={() => setFormaOpreme(null)} />
        <Potvrda
          open={Boolean(brisanjeKat)}
          naslov={`Brisanje kategorije — ${brisanjeKat?.naziv ?? ''}`}
          tekst="Kategorija se uklanja iz šifarnika. Oprema koja je bila u njoj mora prethodno biti premeštena."
          potvrdiTekst="Obriši"
          opasno
          onClose={() => setBrisanjeKat(null)}
          onPotvrdi={() => {
            akcije.obrisiKategoriju(brisanjeKat!.id);
            javi('Kategorija je obrisana.', 'info');
          }}
        />
      </>
    );
  }

  /* -------------------------- Lista opreme -------------------------- */

  return (
    <>
      <Zaglavlje
        nadnaslov={kategorija ? `Magacin · ${kategorija.sifra}` : 'Magacin'}
        naslov={kategorija ? kategorija.naziv : 'Sva oprema'}
        opis={kategorija?.opis || undefined}
        akcije={
          <>
            <button className="btn-secondary" onClick={() => otvoriKategoriju(null)}>
              <ArrowLeft size={15} /> Kategorije
            </button>
            {smem('inventar.upis') && (
              <button
                className="btn-accent"
                onClick={() =>
                  setFormaOpreme({
                    podaci: praznaOprema(kategorija?.id ?? baza.kategorije[0]?.id ?? ''),
                  })
                }
              >
                <Plus size={15} /> Dodaj opremu
              </button>
            )}
          </>
        }
        meta={
          kategorija && (
            <>
              <span className="eyebrow">Rok zaduženja</span>
              <span className="font-mono text-sm font-semibold tnum">
                {kategorija.rokDana > 0 ? danaRec(kategorija.rokDana) : 'trajno'}
              </span>
              <span className="eyebrow">Vrsta</span>
              <span className="text-micro">{TIPOVI[kategorija.tip]}</span>
              {kategorija.zahtevaOdobrenje && <Oznaka ton="info">traži odobrenje</Oznaka>}
            </>
          )
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga value={pretraga} onChange={setPretraga} placeholder="Naziv, inv. broj, serijski…" />
        <Filteri vrednost={filter} onChange={(v) => postavi('filter', v === 'sve' ? null : v)} stavke={FILTERI} />
        {smem('inventar.upis') && izabrane.size > 0 && (
          <button className="btn-primary px-2 py-1 text-micro" onClick={() => setPremestaj(true)}>
            <FolderInput size={13} /> Premesti ({izabrane.size})
          </button>
        )}
        <span className="ml-auto">
          <Brojac prikazano={prikazana.length} ukupno={baza.oprema.length} jedinica="stavki" />
        </span>
      </div>

      <div className="panel overflow-hidden">
        {prikazana.length === 0 ? (
          <Prazno naslov="Nema opreme po ovom filteru" hint="Promenite filter ili pojam pretrage." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px]">
              <thead className="bg-surface">
                <tr>
                  {smem('inventar.upis') && <th className="th w-8" />}
                  <th className="th w-32">Inv. broj</th>
                  <th className="th">Naziv</th>
                  {!kategorija && <th className="th w-40">Kategorija</th>}
                  <th className="th w-24">Veličina</th>
                  <th className="th w-24 text-right">Stanje</th>
                  <th className="th w-20">Rok</th>
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
                      {smem('inventar.upis') && (
                        <td className="td" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-[#D2650B]"
                            checked={izabrane.has(o.id)}
                            onChange={() => prebaci(o.id)}
                            aria-label={`Izaberi ${o.naziv}`}
                          />
                        </td>
                      )}
                      <td className="td font-mono text-micro tnum">{o.inv}</td>
                      <td className="td">
                        <div className="font-medium">{o.naziv}</div>
                        <div className="text-micro text-ink-faint">{o.proizvodjac} {o.model}</div>
                      </td>
                      {!kategorija && <td className="td text-micro">{kat?.naziv}</td>}
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
                  const { id: _x, ...ostatak } = detalj;
                  setFormaOpreme({ podaci: ostatak, id: detalj.id });
                  setDetalj(null);
                }}
              >
                <Pencil size={13} /> Izmeni
              </button>
              <button
                className="btn-secondary px-2 py-1 text-micro"
                onClick={() => {
                  setIzabrane(new Set([detalj.id]));
                  setPremestaj(true);
                }}
              >
                <FolderInput size={13} /> Premesti
              </button>
              {smem('inventar.brisanje') && (
                <button className="btn-danger px-2 py-1 text-micro" onClick={() => setBrisanjeOpreme(detalj)}>
                  <Trash2 size={13} /> Otpiši
                </button>
              )}
            </>
          ) : null
        }
      >
        {detalj && <DetaljOpreme oprema={detalj} />}
      </Fioka>

      <FormaOpreme stanje={formaOpreme} onClose={() => setFormaOpreme(null)} />

      <Potvrda
        open={Boolean(brisanjeOpreme)}
        naslov={`Otpis — ${brisanjeOpreme?.naziv ?? ''}`}
        tekst="Stavka se uklanja iz inventara. Postojeća zaduženja ostaju u evidenciji i kartonima."
        potvrdiTekst="Otpiši"
        opasno
        onClose={() => setBrisanjeOpreme(null)}
        onPotvrdi={() => {
          akcije.obrisiOpremu(brisanjeOpreme!.id);
          javi('Oprema je otpisana.', 'info');
          setDetalj(null);
        }}
      />

      <PremestiDijalog
        open={premestaj}
        broj={izabrane.size}
        trenutna={kategorija?.id}
        onClose={() => setPremestaj(false)}
        onPremesti={(katId) => {
          akcije.premestiOpremu([...izabrane], katId);
          javi(`Premešteno ${izabrane.size} stavki.`);
          setIzabrane(new Set());
          setPremestaj(false);
          setDetalj(null);
        }}
      />
    </>
  );
}

function Metrika({ label, vrednost }: { label: string; vrednost: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-lg font-semibold tnum">{vrednost}</span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function Brojka({ label, vrednost, boja }: { label: string; vrednost: number; boja?: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={`font-mono text-sm font-semibold tnum ${vrednost > 0 ? boja ?? '' : 'text-ink-faint'}`}>
        {vrednost}
      </span>
      <span className="eyebrow">{label}</span>
    </span>
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

function PremestiDijalog({
  open, broj, trenutna, onClose, onPremesti,
}: {
  open: boolean;
  broj: number;
  trenutna?: string;
  onClose: () => void;
  onPremesti: (kategorijaId: string) => void;
}) {
  const { baza } = useStore();
  const [izbor, setIzbor] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov={`Premeštanje ${broj} stavki`}
      opis="Stavke prelaze u izabranu kategoriju i dalje nasleđuju njen rok zaduženja."
      sirina="max-w-md"
      podnozje={
        <>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button className="btn-primary" disabled={!izbor} onClick={() => onPremesti(izbor)}>
            Premesti
          </button>
        </>
      }
    >
      <ul className="divide-y divide-line border-y border-line">
        {baza.kategorije.filter((k) => k.id !== trenutna).map((k) => (
          <li key={k.id}>
            <button
              onClick={() => setIzbor(k.id)}
              className={`flex w-full items-center gap-3 px-1 py-2 text-left ${izbor === k.id ? 'bg-surface' : 'hover:bg-surface'}`}
            >
              <span
                className={`h-3 w-3 shrink-0 rounded-full border ${
                  izbor === k.id ? 'border-safety-500 bg-safety-500' : 'border-line-strong'
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{k.naziv}</span>
                <span className="block truncate font-mono text-eyebrow text-ink-faint">
                  {k.sifra} · rok {k.rokDana > 0 ? danaRec(k.rokDana) : 'trajno'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function FormaKategorije({
  stanje, onClose,
}: {
  stanje: { podaci: Omit<Kategorija, 'id'>; id?: string } | null;
  onClose: () => void;
}) {
  const { akcije } = useStore();
  const javi = useToast();
  const [izmene, setIzmene] = useState<Partial<Kategorija>>({});

  if (!stanje) return null;
  const v = { ...stanje.podaci, ...izmene };
  const postavi = (p: Partial<Kategorija>) => setIzmene({ ...izmene, ...p });
  const zatvori = () => {
    setIzmene({});
    onClose();
  };

  return (
    <Modal
      open
      onClose={zatvori}
      naslov={stanje.id ? `Izmena kategorije — ${stanje.podaci.naziv}` : 'Nova kategorija'}
      opis="Naziv, šifra i rok zaduženja koji nasleđuje sva oprema iz kategorije."
      sirina="max-w-xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={zatvori}>Odustani</button>
          <button
            className="btn-primary"
            disabled={!v.naziv.trim() || !v.sifra.trim()}
            onClick={() => {
              if (stanje.id) {
                akcije.izmeniKategoriju(stanje.id, izmene);
                javi('Kategorija je izmenjena.');
              } else {
                akcije.dodajKategoriju(v);
                javi('Kategorija je dodata.');
              }
              zatvori();
            }}
          >
            Snimi
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Polje label="Naziv">
          <input className="input" value={v.naziv} onChange={(e) => postavi({ naziv: e.target.value })} autoFocus />
        </Polje>
        <Polje label="Šifra" hint="Ulazi u inventarski broj opreme.">
          <input
            className="input font-mono"
            value={v.sifra}
            onChange={(e) => postavi({ sifra: e.target.value.toUpperCase() })}
          />
        </Polje>
        <Polje label="Vrsta">
          <select className="input" value={v.tip} onChange={(e) => postavi({ tip: e.target.value as TipKategorije })}>
            {(Object.keys(TIPOVI) as TipKategorije[]).map((t) => (
              <option key={t} value={t}>{TIPOVI[t]}</option>
            ))}
          </select>
        </Polje>
        <Polje label="Rok zaduženja (dana)" hint="0 = trajno zaduženje.">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={v.rokDana}
            onChange={(e) => postavi({ rokDana: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <div className="sm:col-span-2">
          <Polje label="Opis">
            <input className="input" value={v.opis} onChange={(e) => postavi({ opis: e.target.value })} />
          </Polje>
        </div>
        <div className="sm:col-span-2">
          <span className="label">Ikona</span>
          <div className="flex flex-wrap gap-1">
            {IMENA_IKONA.map((ime) => {
              const I = IKONE[ime];
              return (
                <button
                  key={ime}
                  type="button"
                  onClick={() => postavi({ ikona: ime })}
                  aria-label={ime}
                  className={`flex h-8 w-8 items-center justify-center rounded-card border transition-colors ${
                    v.ikona === ime ? 'border-safety-500 bg-safety-50 text-safety-600' : 'border-line hover:bg-surface'
                  }`}
                >
                  <I size={15} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[#D2650B]"
              checked={v.zahtevaOdobrenje}
              onChange={(e) => postavi({ zahtevaOdobrenje: e.target.checked })}
            />
            Izdavanje iz ove kategorije traži odobrenje
          </label>
        </div>
      </div>
    </Modal>
  );
}

function FormaOpreme({
  stanje, onClose,
}: {
  stanje: { podaci: Omit<Oprema, 'id'>; id?: string } | null;
  onClose: () => void;
}) {
  const { baza, akcije } = useStore();
  const javi = useToast();
  const [izmene, setIzmene] = useState<Partial<Oprema>>({});

  if (!stanje) return null;
  const v = { ...stanje.podaci, ...izmene };
  const postavi = (p: Partial<Oprema>) => setIzmene({ ...izmene, ...p });
  const kat = baza.kategorije.find((k) => k.id === v.kategorijaId);
  const zatvori = () => {
    setIzmene({});
    onClose();
  };

  return (
    <Modal
      open
      onClose={zatvori}
      naslov={stanje.id ? `Izmena — ${stanje.podaci.naziv}` : 'Nova oprema'}
      opis="Rok zaduženja se nasleđuje iz kategorije, osim ako se ovde ne upiše drugačije."
      sirina="max-w-2xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={zatvori}>Odustani</button>
          <button
            className="btn-primary"
            disabled={!v.naziv.trim() || !v.inv.trim()}
            onClick={() => {
              if (stanje.id) {
                akcije.izmeniOpremu(stanje.id, izmene);
                javi('Oprema je izmenjena.');
              } else {
                akcije.dodajOpremu(v);
                javi('Oprema je upisana u inventar.');
              }
              zatvori();
            }}
          >
            Snimi
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Polje label="Inventarski broj">
          <input className="input font-mono" value={v.inv} onChange={(e) => postavi({ inv: e.target.value })} autoFocus />
        </Polje>
        <Polje label="Naziv">
          <input className="input" value={v.naziv} onChange={(e) => postavi({ naziv: e.target.value })} />
        </Polje>
        <Polje label="Kategorija" hint={kat ? `Rok kategorije: ${kat.rokDana > 0 ? danaRec(kat.rokDana) : 'trajno'}` : undefined}>
          <select className="input" value={v.kategorijaId} onChange={(e) => postavi({ kategorijaId: e.target.value })}>
            {baza.kategorije.map((k) => (
              <option key={k.id} value={k.id}>{k.naziv}</option>
            ))}
          </select>
        </Polje>
        <Polje label="Stanje">
          <select className="input" value={v.stanje} onChange={(e) => postavi({ stanje: e.target.value as StanjeOpreme })}>
            {(Object.keys(OZNAKA_STANJA) as StanjeOpreme[]).map((s) => (
              <option key={s} value={s}>{OZNAKA_STANJA[s]}</option>
            ))}
          </select>
        </Polje>
        <Polje label="Proizvođač">
          <input className="input" value={v.proizvodjac} onChange={(e) => postavi({ proizvodjac: e.target.value })} />
        </Polje>
        <Polje label="Model">
          <input className="input" value={v.model} onChange={(e) => postavi({ model: e.target.value })} />
        </Polje>
        <Polje label="Serijski broj">
          <input className="input font-mono" value={v.serijski} onChange={(e) => postavi({ serijski: e.target.value })} />
        </Polje>
        <Polje label="Veličina">
          <input className="input" value={v.velicina} onChange={(e) => postavi({ velicina: e.target.value })} />
        </Polje>
        <Polje label="Lokacija">
          <input className="input" value={v.lokacija} onChange={(e) => postavi({ lokacija: e.target.value })} />
        </Polje>
        <Polje label="Rok zaduženja (dana)" hint="Prazno = nasleđuje kategoriju. 0 = trajno.">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={v.rokDana ?? ''}
            placeholder={String(kat?.rokDana ?? 0)}
            onChange={(e) => postavi({ rokDana: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Količina">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={v.kolicina}
            onChange={(e) => postavi({ kolicina: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Minimalna zaliha" hint="0 za komadnu opremu koja se prati pojedinačno.">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={v.minZaliha}
            onChange={(e) => postavi({ minZaliha: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Nabavna cena (RSD)">
          <input
            type="number"
            min={0}
            className="input font-mono tnum"
            value={v.cena}
            onChange={(e) => postavi({ cena: Math.max(0, Number(e.target.value)) })}
          />
        </Polje>
        <Polje label="Atest važi do">
          <input
            type="date"
            className="input font-mono"
            value={v.atestVazi ? v.atestVazi.slice(0, 10) : ''}
            onChange={(e) => postavi({ atestVazi: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </Polje>
        <div className="sm:col-span-2">
          <Polje label="Napomena">
            <textarea className="input min-h-[64px]" value={v.napomena} onChange={(e) => postavi({ napomena: e.target.value })} />
          </Polje>
        </div>
      </div>
    </Modal>
  );
}
