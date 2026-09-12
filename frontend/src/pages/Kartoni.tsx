import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Pencil, Printer } from 'lucide-react';
import { useStore } from '../lib/store';
import { nadjiNalog, nadjiOpremu, punoIme, rokZaduzenja } from '../lib/izbor';
import { danaDo, datum, datumVreme, sadrzi, useSada } from '../lib/format';
import type { Zaposleni } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import { Modal, Oznaka, Polje, Prazno, Pretraga, useToast } from '../components/ui';
import { RokOznaka } from '../components/Rok';
import { PrikazPotpisa } from '../components/Potpis';

/**
 * Lični karton zaduženja LZO — na ekranu dosije, na štampi obrazac.
 * Leva kolona je gusta lista zaposlenih, desno je sam karton.
 */
export function Kartoni() {
  const { baza, akcije, smem } = useStore();
  const javi = useToast();
  const sada = useSada(1000);
  const [params, setParams] = useSearchParams();
  const [pretraga, setPretraga] = useState('');
  const [izmena, setIzmena] = useState<Zaposleni | null>(null);

  const lista = useMemo(
    () =>
      baza.zaposleni.filter(
        (z) => !pretraga || sadrzi(punoIme(z), pretraga) || sadrzi(z.radnoMesto, pretraga) || sadrzi(z.organizacionaJedinica, pretraga),
      ),
    [baza.zaposleni, pretraga],
  );

  const izabranId = params.get('z') ?? lista[0]?.id ?? '';
  const zaposleni = baza.zaposleni.find((z) => z.id === izabranId);

  const zaduzenja = baza.zaduzenja
    .filter((z) => z.zaposleniId === izabranId && z.status !== 'odbijeno')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const aktivna = zaduzenja.filter((z) => z.status === 'aktivno');

  return (
    <>
      <Zaglavlje
        nadnaslov="Evidencija"
        naslov="Lični kartoni"
        opis="Obrazac 6 — evidencija o zaduženoj ličnoj zaštitnoj opremi, sa potpisima."
        akcije={
          zaposleni && (
            <>
              {smem('mail.posalji') && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    akcije.posaljiMail({
                      za: zaposleni.email,
                      zaIme: punoIme(zaposleni),
                      tema: `Lični karton LZO — ${punoIme(zaposleni)}`,
                      telo: `U prilogu je vaš lični karton sa ${aktivna.length} aktivnih zaduženja.`,
                      sablonId: null,
                      vezano: null,
                    });
                    javi(`Karton je poslat na ${zaposleni.email}.`);
                  }}
                >
                  <Mail size={15} /> Pošalji karton
                </button>
              )}
              {smem('kartoni.upis') && (
                <button className="btn-secondary" onClick={() => setIzmena(zaposleni)}>
                  <Pencil size={15} /> Popuni karton
                </button>
              )}
              <button className="btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Štampaj
              </button>
            </>
          )
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="no-print panel overflow-hidden lg:sticky lg:top-4">
          <div className="border-b border-line p-2">
            <Pretraga value={pretraga} onChange={setPretraga} placeholder="Zaposleni…" sirina="w-full" />
          </div>
          <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
            {lista.map((z) => {
              const broj = baza.zaduzenja.filter((x) => x.zaposleniId === z.id && x.status === 'aktivno').length;
              return (
                <li key={z.id}>
                  <button
                    onClick={() => setParams({ z: z.id }, { replace: true })}
                    className={`flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left transition-colors ${
                      z.id === izabranId ? 'border-safety-500 bg-surface' : 'border-transparent hover:bg-surface'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{punoIme(z)}</span>
                      <span className="block truncate text-micro text-ink-faint">{z.organizacionaJedinica}</span>
                    </span>
                    <span className="font-mono text-micro text-ink-faint tnum">{broj}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {!zaposleni ? (
          <div className="panel">
            <Prazno naslov="Izaberite zaposlenog" hint="Karton se prikazuje za izabranog zaposlenog." />
          </div>
        ) : (
          <article className="panel px-5 py-5 lg:px-7 lg:py-7">
            {/* Zaglavlje obrasca */}
            <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-3">
              <div>
                <div className="eyebrow">{baza.podesavanja.firma.naziv}</div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Lični karton o zaduženju sredstvima i opremom za ličnu zaštitu na radu
                </h2>
                <p className="mt-0.5 text-micro text-ink-muted">
                  Obrazac 6 · {baza.podesavanja.firma.adresa} · PIB {baza.podesavanja.firma.pib}
                </p>
              </div>
              <div className="text-right">
                <div className="eyebrow">Karton broj</div>
                <div className="font-mono text-sm font-semibold tnum">
                  KRT-{zaposleni.id.toUpperCase().slice(-4)}
                </div>
              </div>
            </header>

            <dl className="grid gap-x-6 gap-y-3 border-b border-line py-4 sm:grid-cols-3">
              <Stavka label="Ime i prezime" vrednost={punoIme(zaposleni)} />
              <Stavka label="Radno mesto" vrednost={zaposleni.radnoMesto} />
              <Stavka label="Organizaciona jedinica" vrednost={zaposleni.organizacionaJedinica} />
              <Stavka label="Lokacija rada" vrednost={zaposleni.lokacija} />
              <Stavka label="U radnom odnosu od" vrednost={datum(zaposleni.datumZaposlenja)} mono />
              <Stavka label="Broj obuće / konfekcija" vrednost={`${zaposleni.brojCipela} / ${zaposleni.konfekcija}`} mono />
              <Rok label="Lekarski pregled važi do" iso={zaposleni.lekarskiVazi} />
              <Rok label="Obuka BZR važi do" iso={zaposleni.obukaBzrVazi} />
              <Stavka label="Lice za BZR" vrednost={baza.podesavanja.firma.liceZaBzr} />
            </dl>

            <div className="py-4">
              <div className="eyebrow mb-2">Zadužena oprema</div>
              {zaduzenja.length === 0 ? (
                <Prazno naslov="Zaposleni nema evidentiranih zaduženja" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-y border-line">
                    <thead>
                      <tr className="bg-surface">
                        <th className="th w-10">R.b.</th>
                        <th className="th">Oprema</th>
                        <th className="th w-24">Izdato</th>
                        <th className="th w-24">Rok do</th>
                        <th className="th w-36">Stanje roka</th>
                        <th className="th w-28">Izdao</th>
                        <th className="th w-20">Potpis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zaduzenja.map((z, i) => {
                        const rok = rokZaduzenja(baza, z, sada);
                        return (
                          <tr key={z.id} className="row align-top">
                            <td className="td font-mono text-micro tnum">{i + 1}.</td>
                            <td className="td">
                              <ul className="space-y-0.5">
                                {z.stavke.map((s) => {
                                  const o = nadjiOpremu(baza, s.opremaId);
                                  return (
                                    <li key={s.opremaId} className="text-sm">
                                      {o?.naziv}
                                      {s.kolicina > 1 && ` ×${s.kolicina}`}
                                      <span className="ml-1.5 whitespace-nowrap font-mono text-eyebrow text-ink-faint">{o?.inv}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="font-mono text-eyebrow text-ink-faint tnum">{z.broj}</div>
                            </td>
                            <td className="td font-mono text-micro tnum">{datum(z.signedAt)}</td>
                            <td className="td font-mono text-micro tnum">{datum(z.dueAt)}</td>
                            <td className="td">
                              {z.status === 'aktivno' ? (
                                <RokOznaka rok={rok} sitno />
                              ) : (
                                <Oznaka ton="neutral">
                                  {z.status === 'razduzeno' ? 'razduženo' : z.status.replace('_', ' ')}
                                </Oznaka>
                              )}
                            </td>
                            <td className="td text-micro">{nadjiNalog(baza, z.izdaoId)?.fullName ?? '—'}</td>
                            <td className="td">
                              {z.potpisPrimaoca ? (
                                <img src={z.potpisPrimaoca} alt="Potpis" className="h-8 object-contain object-left" />
                              ) : (
                                <span className="text-micro text-ink-faint">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className="grid gap-6 border-t border-line pt-5 sm:grid-cols-3">
              <PrikazPotpisa
                potpis={zaduzenja.find((z) => z.potpisPrimaoca)?.potpisPrimaoca ?? null}
                ime={punoIme(zaposleni)}
                uloga="Zaposleni"
              />
              <PrikazPotpisa
                potpis={nadjiNalog(baza, zaduzenja[0]?.izdaoId ?? null)?.potpis ?? null}
                ime={nadjiNalog(baza, zaduzenja[0]?.izdaoId ?? null)?.fullName ?? '—'}
                uloga="Uslužilac"
              />
              <PrikazPotpisa
                potpis={baza.nalozi.find((n) => n.fullName === baza.podesavanja.firma.liceZaBzr)?.potpis ?? null}
                ime={baza.podesavanja.firma.liceZaBzr}
                uloga="Lice za BZR"
              />
            </footer>

            <p className="mt-4 font-mono text-eyebrow uppercase text-ink-faint">
              Karton odštampan {datumVreme(new Date().toISOString())} · demo podaci
            </p>
          </article>
        )}
      </div>

      <IzmenaKartona zaposleni={izmena} onClose={() => setIzmena(null)} />
    </>
  );
}

function Stavka({ label, vrednost, mono }: { label: string; vrednost: string; mono?: boolean }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className={`text-sm ${mono ? 'font-mono tnum' : ''}`}>{vrednost}</dd>
    </div>
  );
}

function Rok({ label, iso }: { label: string; iso: string | null }) {
  const d = danaDo(iso);
  const istekao = d !== null && d < 0;
  const blizu = d !== null && d >= 0 && d <= 30;
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className={`font-mono text-sm tnum ${istekao ? 'text-signal-danger' : blizu ? 'text-signal-warn' : ''}`}>
        {datum(iso)}
        {istekao && ' — isteklo'}
        {blizu && ` — još ${d} d`}
      </dd>
    </div>
  );
}

function IzmenaKartona({ zaposleni, onClose }: { zaposleni: Zaposleni | null; onClose: () => void }) {
  const { akcije } = useStore();
  const javi = useToast();
  const [podaci, setPodaci] = useState<Partial<Zaposleni>>({});

  if (!zaposleni) return null;
  const v = { ...zaposleni, ...podaci };

  return (
    <Modal
      open
      onClose={() => {
        setPodaci({});
        onClose();
      }}
      naslov={`Popunjavanje kartona — ${punoIme(zaposleni)}`}
      opis="Podaci koji se upisuju u zaglavlje obrasca."
      sirina="max-w-2xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={() => { setPodaci({}); onClose(); }}>Odustani</button>
          <button
            className="btn-primary"
            onClick={() => {
              akcije.izmeniZaposlenog(zaposleni.id, podaci);
              javi('Karton je ažuriran.');
              setPodaci({});
              onClose();
            }}
          >
            Snimi karton
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Polje label="Radno mesto">
          <input className="input" value={v.radnoMesto} onChange={(e) => setPodaci({ ...podaci, radnoMesto: e.target.value })} />
        </Polje>
        <Polje label="Organizaciona jedinica">
          <input className="input" value={v.organizacionaJedinica} onChange={(e) => setPodaci({ ...podaci, organizacionaJedinica: e.target.value })} />
        </Polje>
        <Polje label="Lokacija rada">
          <input className="input" value={v.lokacija} onChange={(e) => setPodaci({ ...podaci, lokacija: e.target.value })} />
        </Polje>
        <Polje label="E-pošta">
          <input className="input font-mono" value={v.email} onChange={(e) => setPodaci({ ...podaci, email: e.target.value })} />
        </Polje>
        <Polje label="Broj obuće">
          <input className="input font-mono tnum" value={v.brojCipela} onChange={(e) => setPodaci({ ...podaci, brojCipela: e.target.value })} />
        </Polje>
        <Polje label="Veličina konfekcije">
          <input className="input font-mono" value={v.konfekcija} onChange={(e) => setPodaci({ ...podaci, konfekcija: e.target.value })} />
        </Polje>
        <Polje label="Lekarski pregled važi do">
          <input
            type="date"
            className="input font-mono"
            value={v.lekarskiVazi ? v.lekarskiVazi.slice(0, 10) : ''}
            onChange={(e) => setPodaci({ ...podaci, lekarskiVazi: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </Polje>
        <Polje label="Obuka BZR važi do">
          <input
            type="date"
            className="input font-mono"
            value={v.obukaBzrVazi ? v.obukaBzrVazi.slice(0, 10) : ''}
            onChange={(e) => setPodaci({ ...podaci, obukaBzrVazi: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </Polje>
      </div>
    </Modal>
  );
}
