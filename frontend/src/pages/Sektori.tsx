import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  brojAktivnihZaduzenja, nadleznost, odobriociSektora, poPrezimenu, punoIme, traziZaposlenog,
  uNadleznosti, usluziociSektora,
} from '../lib/izbor';
import { ULOGE, imaPravo } from '../lib/permissions';
import { inicijali, sadrzi } from '../lib/format';
import type { Nalog, Sektor } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import {
  Brojac, Filteri, Fioka, Modal, Odeljak, Oznaka, Polje, Potvrda, Prazno, Prekidac, Pretraga,
  useToast, useVise, Vise,
} from '../components/ui';

const prazan = (): Omit<Sektor, 'id'> => ({ naziv: '', sifra: '', opis: '', aktivan: true });

/**
 * Sektori nose podelu nadležnosti: ko čije zahteve odobrava i čija zaduženja
 * uopšte vidi. Nadležnost se čuva na nalogu (`nalog.sektori`), a ovde se ista
 * veza uređuje sa druge strane — po sektoru.
 */
export function Sektori() {
  const { baza, akcije } = useStore();
  const javi = useToast();
  const [forma, setForma] = useState<{ podaci: Omit<Sektor, 'id'>; id?: string } | null>(null);
  const [brisanje, setBrisanje] = useState<Sektor | null>(null);
  const [otvoren, setOtvoren] = useState<Sektor | null>(null);
  const [pretraga, setPretraga] = useState('');

  /** Broj zaposlenih po sektoru u jednom prolazu — spisak ide na stotine imena. */
  const brojPoSektoru = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const z of baza.zaposleni) mapa.set(z.sektorId, (mapa.get(z.sektorId) ?? 0) + 1);
    return mapa;
  }, [baza.zaposleni]);
  const brojZaposlenih = (id: string) => brojPoSektoru.get(id) ?? 0;

  const lista = useMemo(
    () =>
      baza.sektori.filter(
        (s) =>
          !pretraga ||
          sadrzi(s.naziv, pretraga) ||
          sadrzi(s.sifra, pretraga) ||
          sadrzi(s.opis, pretraga) ||
          odobriociSektora(baza, s.id).some((n) => sadrzi(n.fullName, pretraga)) ||
          usluziociSektora(baza, s.id).some((n) => sadrzi(n.fullName, pretraga)),
      ),
    [baza, pretraga],
  );

  const sektor = otvoren ? baza.sektori.find((s) => s.id === otvoren.id) ?? null : null;

  return (
    <>
      <Zaglavlje
        nadnaslov="Administracija"
        naslov="Sektori i nadležnost"
        opis="Ko kome odobrava i čija zaduženja vidi — sve ide preko sektora zaposlenog."
        akcije={
          <button className="btn-accent" onClick={() => setForma({ podaci: prazan() })}>
            <Plus size={15} /> Novi sektor
          </button>
        }
        meta={
          <>
            <Metrika label="Sektora" vrednost={baza.sektori.length} />
            <Metrika label="Zaposlenih raspoređeno" vrednost={baza.zaposleni.filter((z) => z.sektorId).length} />
            <Metrika
              label="Sektora bez odobrioca"
              vrednost={baza.sektori.filter((s) => odobriociSektora(baza, s.id).length === 0).length}
            />
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga value={pretraga} onChange={setPretraga} placeholder="Sektor, šifra ili nadležni nalog…" />
        <span className="ml-auto">
          <Brojac prikazano={lista.length} ukupno={baza.sektori.length} jedinica="sektora" />
        </span>
      </div>

      <div className="panel overflow-hidden">
        {lista.length === 0 ? (
          <Prazno naslov="Nema sektora po ovom pojmu" />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px]">
            <thead className="bg-surface">
              <tr>
                <th className="th">Sektor</th>
                <th className="th w-20 text-right">Zaposlenih</th>
                <th className="th">Odobravaju</th>
                <th className="th">Uslužuju</th>
                <th className="th w-24">Status</th>
                <th className="th w-40" />
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => {
                const odobrioci = odobriociSektora(baza, s.id);
                const usluzioci = usluziociSektora(baza, s.id);
                const zaposlenih = brojZaposlenih(s.id);
                return (
                  <tr key={s.id} className="row cursor-pointer" onClick={() => setOtvoren(s)}>
                    <td className="td">
                      <div className="font-medium">{s.naziv}</div>
                      <div className="font-mono text-eyebrow text-ink-faint">
                        {s.sifra}
                        {s.opis && ` · ${s.opis}`}
                      </div>
                    </td>
                    <td className="td text-right font-mono text-sm tnum">{zaposlenih}</td>
                    <td className="td">
                      {odobrioci.length === 0 ? (
                        <Oznaka ton="danger">nema odobrioca</Oznaka>
                      ) : (
                        <Imena nalozi={odobrioci} />
                      )}
                    </td>
                    <td className="td">
                      {usluzioci.length === 0 ? (
                        <Oznaka ton="warn">nema uslužioca</Oznaka>
                      ) : (
                        <Imena nalozi={usluzioci} />
                      )}
                    </td>
                    <td className="td">
                      {s.aktivan ? <Oznaka ton="ok">Aktivan</Oznaka> : <Oznaka ton="neutral">Ugašen</Oznaka>}
                    </td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-nowrap justify-end gap-0.5">
                        <button className="btn-ghost px-1.5 py-1 text-micro" onClick={() => setOtvoren(s)}>
                          <Users size={12} /> Nadležnost
                        </button>
                        <button
                          className="btn-ghost px-1.5 py-1 text-micro"
                          onClick={() => {
                            const { id: _x, ...ostatak } = s;
                            setForma({ podaci: ostatak, id: s.id });
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-ghost px-1.5 py-1 text-micro text-signal-danger disabled:opacity-40"
                          disabled={zaposlenih > 0}
                          title={zaposlenih > 0 ? 'Sektor nije prazan — prvo premestite zaposlene.' : 'Obriši sektor'}
                          onClick={() => setBrisanje(s)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <NadleznostSektora sektor={sektor} onClose={() => setOtvoren(null)} />

      <FormaSektora
        stanje={forma}
        onClose={() => setForma(null)}
        onSnimi={(podaci, id) => {
          if (id) {
            akcije.izmeniSektor(id, podaci);
            javi('Sektor je izmenjen.');
          } else {
            akcije.dodajSektor(podaci);
            javi('Sektor je dodat.');
          }
          setForma(null);
        }}
      />

      <Potvrda
        open={Boolean(brisanje)}
        naslov={`Brisanje sektora — ${brisanje?.naziv ?? ''}`}
        tekst="Sektor se uklanja iz organizacione šeme i briše se iz nadležnosti svih naloga. Zaposleni moraju prethodno biti premešteni."
        potvrdiTekst="Obriši"
        opasno
        onClose={() => setBrisanje(null)}
        onPotvrdi={() => {
          akcije.obrisiSektor(brisanje!.id);
          javi('Sektor je obrisan.', 'info');
        }}
      />
    </>
  );
}

function Metrika({ label, vrednost }: { label: string; vrednost: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-lg font-semibold tnum ${vrednost > 0 ? '' : 'text-ink-faint'}`}>{vrednost}</span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function Imena({ nalozi }: { nalozi: Nalog[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {nalozi.map((n) => (
        <span key={n.id} className="chip bg-surface-deep text-ink-muted" title={n.fullName}>
          {n.fullName}
          {n.sviSektori && <span className="text-safety-600">·svi</span>}
        </span>
      ))}
    </div>
  );
}

/** Uređivanje nadležnosti sa strane sektora — piše u `nalog.sektori`. */
function NadleznostSektora({ sektor, onClose }: { sektor: Sektor | null; onClose: () => void }) {
  const { baza, akcije } = useStore();
  const javi = useToast();
  const [pretragaNaloga, setPretragaNaloga] = useState('');
  const [filterNaloga, setFilterNaloga] = useState<'svi' | 'nadlezni' | 'ostali'>('svi');
  const [pretragaZaposlenih, setPretragaZaposlenih] = useState('');

  const sektorId = sektor?.id ?? '';

  /* Kandidat je svaki nalog koji uopšte ima posla sa zaduženjima — njemu
     dodela sektora nešto znači. Spisak se pretražuje po imenu, korisničkom
     imenu i ulozi, jer nalogâ vremenom bude i preko stotinu. */
  const kandidati = useMemo(
    () =>
      baza.nalozi.filter(
        (n) =>
          imaPravo(n, 'odobrenja.odlucuj', baza.pravaUloga) ||
          imaPravo(n, 'zaduzenja.izdaj', baza.pravaUloga) ||
          imaPravo(n, 'zaduzenja.vidi', baza.pravaUloga),
      ),
    [baza.nalozi, baza.pravaUloga],
  );

  const nalozi = useMemo(
    () =>
      kandidati
        .filter((n) => {
          const pokriva = uNadleznosti(nadleznost(n), sektorId);
          if (filterNaloga === 'nadlezni') return pokriva;
          if (filterNaloga === 'ostali') return !pokriva;
          return true;
        })
        .filter(
          (n) =>
            !pretragaNaloga ||
            sadrzi(n.fullName, pretragaNaloga) ||
            sadrzi(n.username, pretragaNaloga) ||
            sadrzi(n.email, pretragaNaloga) ||
            sadrzi(ULOGE[n.role].naziv, pretragaNaloga),
        ),
    [kandidati, sektorId, filterNaloga, pretragaNaloga],
  );

  const zaposleni = useMemo(
    () =>
      baza.zaposleni
        .filter((z) => z.sektorId === sektorId)
        .filter((z) => traziZaposlenog(baza, z, pretragaZaposlenih))
        .sort(poPrezimenu),
    [baza, sektorId, pretragaZaposlenih],
  );
  const svihUSektoru = useMemo(
    () => baza.zaposleni.filter((z) => z.sektorId === sektorId).length,
    [baza.zaposleni, sektorId],
  );
  const aktivnaZaduzenja = useMemo(() => brojAktivnihZaduzenja(baza), [baza]);
  const { deo, ostalo, jos, korak } = useVise(zaposleni, 25);

  if (!sektor) return null;

  function prebaci(n: Nalog, ukljuci: boolean) {
    const sledeci = ukljuci
      ? Array.from(new Set([...(n.sektori ?? []), sektorId]))
      : (n.sektori ?? []).filter((x) => x !== sektorId);
    akcije.postaviNadleznost(n.id, sledeci, n.sviSektori);
    javi(ukljuci ? `${n.fullName} je nadležan za ${sektor!.naziv}.` : `${n.fullName} više nije nadležan za ${sektor!.naziv}.`);
  }

  const nadleznih = kandidati.filter((n) => uNadleznosti(nadleznost(n), sektorId)).length;

  return (
    <Fioka open onClose={onClose} nadnaslov={`Sektor ${sektor.sifra}`} naslov={sektor.naziv}>
      <div className="space-y-5">
        <p className="panel-quiet px-3 py-2.5 text-micro text-ink-muted">
          Nalog koji je nadležan za ovaj sektor vidi zaduženja, razduženja i kartone njegovih
          zaposlenih. Ako uz to ima pravo odobravanja, njemu stižu i zahtevi za odobrenje.
        </p>

        <Odeljak
          naslov="Nadležni nalozi"
          nadnaslov={`${nadleznih} od ${kandidati.length} naloga`}
          ravno
          akcije={
            <Filteri
              vrednost={filterNaloga}
              onChange={setFilterNaloga}
              stavke={[['svi', 'Svi'], ['nadlezni', 'Nadležni'], ['ostali', 'Ostali']] as const}
            />
          }
        >
          <div className="border-b border-line p-2">
            <Pretraga
              value={pretragaNaloga}
              onChange={setPretragaNaloga}
              placeholder="Ime, korisničko ime ili uloga…"
              sirina="w-full"
            />
          </div>
          {nalozi.length === 0 ? (
            <Prazno naslov="Nema naloga po ovim uslovima" />
          ) : (
            <ul className="divide-y divide-line">
              {nalozi.map((n) => {
                const pokriva = uNadleznosti(nadleznost(n), sektor.id);
                const odobrava = imaPravo(n, 'odobrenja.odlucuj', baza.pravaUloga);
                const izdaje = imaPravo(n, 'zaduzenja.izdaj', baza.pravaUloga);
                return (
                  <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card border border-line bg-surface font-mono text-micro font-semibold">
                      {inicijali(n.fullName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{n.fullName}</span>
                      <span className="block truncate text-micro text-ink-muted">
                        {ULOGE[n.role].naziv}
                        {odobrava && ' · odobrava'}
                        {izdaje && ' · izdaje'}
                        {!n.aktivan && ' · isključen'}
                      </span>
                    </span>
                    {n.sviSektori ? (
                      <Oznaka ton="accent">svi sektori</Oznaka>
                    ) : (
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#D2650B]"
                        checked={pokriva}
                        onChange={(e) => prebaci(n, e.target.checked)}
                        aria-label={`${n.fullName} nadležan za ${sektor.naziv}`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Odeljak>

        <Odeljak
          naslov="Zaposleni u sektoru"
          nadnaslov={
            zaposleni.length === svihUSektoru
              ? `${svihUSektoru} zaposlenih`
              : `${zaposleni.length} od ${svihUSektoru} zaposlenih`
          }
          ravno
        >
          {svihUSektoru === 0 ? (
            <Prazno naslov="Sektor je prazan" hint={'Zaposleni se raspoređuju na strani „Zaposleni”.'} />
          ) : (
            <>
              <div className="border-b border-line p-2">
                <Pretraga
                  value={pretragaZaposlenih}
                  onChange={setPretragaZaposlenih}
                  placeholder="Proveri da li je zaposleni u ovom sektoru…"
                  sirina="w-full"
                />
              </div>
              {zaposleni.length === 0 ? (
                <Prazno
                  naslov="Nije u ovom sektoru"
                  hint="Po ovom pojmu nema nikoga u sektoru — potražite ga na strani „Zaposleni”."
                />
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {deo.map((z) => (
                      <li key={z.id} className="flex items-center gap-3 px-4 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {punoIme(z)}
                            {!z.aktivan && <span className="ml-1.5 text-micro text-ink-faint">· neaktivan</span>}
                          </span>
                          <span className="block truncate text-micro text-ink-muted">{z.radnoMesto}</span>
                        </span>
                        <span className="shrink-0 font-mono text-micro text-ink-faint tnum">
                          {aktivnaZaduzenja.get(z.id) ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Vise ostalo={ostalo} korak={korak} onVise={jos} />
                </>
              )}
            </>
          )}
        </Odeljak>
      </div>
    </Fioka>
  );
}

function FormaSektora({
  stanje, onClose, onSnimi,
}: {
  stanje: { podaci: Omit<Sektor, 'id'>; id?: string } | null;
  onClose: () => void;
  onSnimi: (podaci: Omit<Sektor, 'id'>, id?: string) => void;
}) {
  const [izmene, setIzmene] = useState<Partial<Sektor>>({});

  if (!stanje) return null;
  const v = { ...stanje.podaci, ...izmene };
  const postavi = (p: Partial<Sektor>) => setIzmene({ ...izmene, ...p });
  const zatvori = () => {
    setIzmene({});
    onClose();
  };

  return (
    <Modal
      open
      onClose={zatvori}
      naslov={stanje.id ? `Izmena sektora — ${stanje.podaci.naziv}` : 'Novi sektor'}
      sirina="max-w-lg"
      podnozje={
        <>
          <button className="btn-secondary" onClick={zatvori}>Odustani</button>
          <button
            className="btn-primary"
            disabled={!v.naziv.trim() || !v.sifra.trim()}
            onClick={() => {
              onSnimi(v, stanje.id);
              setIzmene({});
            }}
          >
            Snimi
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <Polje label="Naziv">
            <input className="input" value={v.naziv} onChange={(e) => postavi({ naziv: e.target.value })} autoFocus />
          </Polje>
          <Polje label="Šifra">
            <input
              className="input font-mono"
              value={v.sifra}
              onChange={(e) => postavi({ sifra: e.target.value.toUpperCase() })}
            />
          </Polje>
        </div>
        <Polje label="Opis">
          <input className="input" value={v.opis} onChange={(e) => postavi({ opis: e.target.value })} />
        </Polje>
        <div className="divide-y divide-line border-y border-line">
          <Prekidac
            ukljucen={v.aktivan}
            onChange={(t) => postavi({ aktivan: t })}
            label="Sektor je aktivan"
            opis="Ugašen sektor ostaje u evidenciji, ali se ne nudi pri rasporedu zaposlenih."
          />
        </div>
      </div>
    </Modal>
  );
}
