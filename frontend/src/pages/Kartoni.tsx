import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilePlus2, Mail, Pencil, Printer } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  brojAktivnihZaduzenja, nadjiNalog, nadjiOpremu, nazivSektora, poPrezimenu, punoIme,
  rokZaduzenja, traziZaposlenog, vidljiviZaposleni,
} from '../lib/izbor';
import { danaDo, datum, datumVreme, useSada } from '../lib/format';
import type { Karton, Zaposleni } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import { Filteri, Modal, Oznaka, Polje, Prazno, Pretraga, useToast, useVise, Vise } from '../components/ui';
import { NAZIV_ROKA, TON_ROKA } from '../components/Rok';
import { PotpisPad } from '../components/Potpis';

/**
 * Lični karton zaduženja LZO (Obrazac 6).
 *
 * Karton se jednom otvara — tada ga potpisuju sve tri strane (zaposleni,
 * uslužilac i lice za BZR) i podaci iz obrasca se upisuju na zaposlenog.
 * Svako kasnije zaduženje u kartonu nosi samo potpis uslužioca koji izdaje.
 *
 * Ceo dokument je jedna tabela: zaglavlje sa podacima stoji u `<thead>`, pa ga
 * pregledač pri štampi ponavlja na svakoj novoj strani.
 */
export function Kartoni() {
  const { baza, akcije, ja, smem } = useStore();
  const javi = useToast();
  const sada = useSada(1000);
  const [params, setParams] = useSearchParams();
  const [pretraga, setPretraga] = useState('');
  const [filter, setFilter] = useState<'svi' | 'sa' | 'bez'>('svi');
  const [izmena, setIzmena] = useState<Zaposleni | null>(null);
  const [otvaranje, setOtvaranje] = useState<Zaposleni | null>(null);

  /** Ko već ima karton — jednim prolazom, jer spisak ide na stotine imena. */
  const saKartonom = useMemo(() => new Set(baza.kartoni.map((k) => k.zaposleniId)), [baza.kartoni]);
  const brojAktivnih = useMemo(() => brojAktivnihZaduzenja(baza), [baza]);

  // Kartoni se vide samo za zaposlene iz sektora u nadležnosti naloga.
  const lista = useMemo(
    () =>
      vidljiviZaposleni(baza, ja)
        .filter((z) => (filter === 'sa' ? saKartonom.has(z.id) : filter === 'bez' ? !saKartonom.has(z.id) : true))
        .filter((z) => traziZaposlenog(baza, z, pretraga))
        .sort(poPrezimenu),
    [baza, ja, pretraga, filter, saKartonom],
  );
  const { deo, ostalo, jos, korak } = useVise(lista, 40);

  const izabranId = params.get('z') ?? lista[0]?.id ?? '';
  const zaposleni = baza.zaposleni.find((z) => z.id === izabranId);
  const karton = baza.kartoni.find((k) => k.zaposleniId === izabranId) ?? null;

  const zaduzenja = baza.zaduzenja
    .filter((z) => z.zaposleniId === izabranId && z.status !== 'odbijeno')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const aktivna = zaduzenja.filter((z) => z.status === 'aktivno');
  const razduzenjeZa = (zaduzenjeId: string) =>
    baza.razduzenja.find((r) => r.zaduzenjeId === zaduzenjeId);

  return (
    <>
      <Zaglavlje
        nadnaslov="Evidencija"
        naslov="Lični kartoni"
        opis="Obrazac 6 — evidencija o zaduženoj ličnoj zaštitnoj opremi, sa potpisima."
        akcije={
          zaposleni && (
            <>
              {!karton && smem('kartoni.upis') && (
                <button className="btn-accent" onClick={() => setOtvaranje(zaposleni)}>
                  <FilePlus2 size={15} /> Otvori karton
                </button>
              )}
              {karton && smem('mail.posalji') && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    akcije.posaljiMail({
                      za: zaposleni.email,
                      zaIme: punoIme(zaposleni),
                      tema: `Lični karton LZO — ${punoIme(zaposleni)}`,
                      telo: `U prilogu je vaš lični karton ${karton.broj} sa ${aktivna.length} aktivnih zaduženja.`,
                      sablonId: null,
                      vezano: null,
                    });
                    javi(`Karton je poslat na ${zaposleni.email}.`);
                  }}
                >
                  <Mail size={15} /> Pošalji
                </button>
              )}
              {karton && smem('kartoni.upis') && (
                <button className="btn-secondary" onClick={() => setIzmena(zaposleni)}>
                  <Pencil size={15} /> Dopuni
                </button>
              )}
              {karton && (
                <button className="btn-primary" onClick={() => window.print()}>
                  <Printer size={15} /> Štampaj
                </button>
              )}
            </>
          )
        }
      />

      <div className="grid items-start gap-5 2xl:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="no-print panel overflow-hidden">
          <div className="space-y-2 border-b border-line p-2">
            <Pretraga value={pretraga} onChange={setPretraga} placeholder="Ime, sektor, radno mesto…" sirina="w-full" />
            <Filteri
              vrednost={filter}
              onChange={setFilter}
              stavke={[['svi', 'Svi'], ['sa', 'Sa kartonom'], ['bez', 'Bez kartona']] as const}
            />
            <div className="px-0.5 font-mono text-eyebrow text-ink-faint tnum">
              {lista.length} zaposlenih
            </div>
          </div>
          <ul className="max-h-56 divide-y divide-line overflow-y-auto 2xl:max-h-[70vh]">
            {deo.map((z) => {
              const imaKarton = saKartonom.has(z.id);
              const broj = brojAktivnih.get(z.id) ?? 0;
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
                      <span className="block truncate text-micro text-ink-faint">{nazivSektora(baza, z.sektorId)}</span>
                    </span>
                    {imaKarton ? (
                      <span className="font-mono text-micro text-ink-faint tnum">{broj}</span>
                    ) : (
                      <span className="chip bg-surface-deep text-ink-faint">nema</span>
                    )}
                  </button>
                </li>
              );
            })}
            {lista.length === 0 && (
              <li className="px-3 py-4 text-micro text-ink-muted">Nema zaposlenog po ovim uslovima.</li>
            )}
          </ul>
          <Vise ostalo={ostalo} korak={korak} onVise={jos} />
        </aside>

        {!zaposleni ? (
          <div className="panel">
            <Prazno naslov="Izaberite zaposlenog" hint="Karton se prikazuje za izabranog zaposlenog." />
          </div>
        ) : !karton ? (
          <div className="panel">
            <Prazno
              naslov={`${punoIme(zaposleni)} još nema otvoren karton`}
              hint="Karton se otvara jednom: unesu se podaci zaposlenog i potpisuju ga sve tri strane. Posle toga svako zaduženje nosi samo potpis uslužioca."
              akcija={
                smem('kartoni.upis') && (
                  <button className="btn-accent" onClick={() => setOtvaranje(zaposleni)}>
                    <FilePlus2 size={15} /> Otvori karton
                  </button>
                )
              }
            />
          </div>
        ) : (
          <article className="karton panel px-5 py-5 lg:px-7 lg:py-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                {/* Zaglavlje je u thead — pri štampi se ponavlja na svakoj strani. */}
                <thead>
                  <tr>
                    <th colSpan={7} className="p-0 text-left font-normal">
                      <ZaglavljeKartona karton={karton} zaposleni={zaposleni} />
                    </th>
                  </tr>
                  <tr className="bg-surface">
                    <th className="th w-9">R.b.</th>
                    <th className="th">Oprema</th>
                    <th className="th w-20">Izdato</th>
                    <th className="th w-20">Rok do</th>
                    <th className="th w-20">Razduženo</th>
                    <th className="th w-24">Stanje roka</th>
                    <th className="th w-32">Izdao i potpis</th>
                  </tr>
                </thead>
                <tbody>
                  {zaduzenja.length === 0 && (
                    <tr>
                      <td className="td text-ink-muted" colSpan={7}>
                        Karton je otvoren, ali još nema evidentiranih zaduženja.
                      </td>
                    </tr>
                  )}
                  {zaduzenja.map((z, i) => {
                    const rok = rokZaduzenja(baza, z, sada);
                    const raz = razduzenjeZa(z.id);
                    const izdao = nadjiNalog(baza, z.izdaoId);
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
                                  <span className="ml-1.5 whitespace-nowrap font-mono text-eyebrow text-ink-faint">
                                    {o?.inv}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="font-mono text-eyebrow text-ink-faint tnum">{z.broj}</div>
                        </td>
                        <td className="td font-mono text-micro tnum">{datum(z.signedAt)}</td>
                        <td className="td font-mono text-micro tnum">{datum(z.dueAt)}</td>
                        <td className="td font-mono text-micro tnum">
                          {raz ? (
                            datum(raz.vracenoAt)
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="td">
                          {z.status === 'aktivno' ? (
                            <Oznaka ton={TON_ROKA[rok.status]}>{NAZIV_ROKA[rok.status]}</Oznaka>
                          ) : (
                            <Oznaka ton="neutral">
                              {z.status === 'razduzeno' ? 'razduženo' : z.status.replace('_', ' ')}
                            </Oznaka>
                          )}
                        </td>
                        {/* Posle otvaranja kartona potpisuje samo onaj ko izdaje opremu. */}
                        <td className="td">
                          <div className="text-micro">{izdao?.fullName ?? '—'}</div>
                          {z.potpisIzdavaoca ? (
                            <img
                              src={z.potpisIzdavaoca}
                              alt={`Potpis — ${izdao?.fullName ?? ''}`}
                              className="mt-0.5 h-6 object-contain object-left"
                            />
                          ) : (
                            <div className="text-micro text-ink-faint">nije potpisano</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="mt-5 grid gap-6 border-t border-line pt-4 sm:grid-cols-3">
              <PotpisKartona potpis={karton.potpisZaposlenog} ime={punoIme(zaposleni)} uloga="Zaposleni" />
              <PotpisKartona
                potpis={karton.potpisUsluzioca}
                ime={nadjiNalog(baza, karton.kreiraoId)?.fullName ?? '—'}
                uloga="Uslužilac"
              />
              <PotpisKartona potpis={karton.potpisLicaBzr} ime={karton.liceZaBzr} uloga="Lice za BZR" />
            </footer>

            <p className="mt-3 font-mono text-eyebrow uppercase text-ink-faint">
              Karton otvoren {datumVreme(karton.kreiranAt)} · odštampano {datumVreme(new Date().toISOString())}
            </p>
          </article>
        )}
      </div>

      <DopunaKartona zaposleni={izmena} onClose={() => setIzmena(null)} />
      <OtvaranjeKartona zaposleni={otvaranje} onClose={() => setOtvaranje(null)} />
    </>
  );
}

function ZaglavljeKartona({ karton, zaposleni }: { karton: Karton; zaposleni: Zaposleni }) {
  const { baza } = useStore();
  const f = baza.podesavanja.firma;
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink pb-2">
        <div>
          <div className="eyebrow">{f.naziv}</div>
          <h2 className="naslov text-base">
            Lični karton o zaduženju sredstvima i opremom za ličnu zaštitu na radu
          </h2>
          <p className="text-micro text-ink-muted">
            Obrazac 6 · {f.adresa} · PIB {f.pib}
          </p>
        </div>
        <div className="text-right">
          <div className="eyebrow">Karton broj</div>
          <div className="font-mono text-sm font-semibold tnum">{karton.broj}</div>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1.5 border-b border-line py-2.5 sm:grid-cols-3">
        <Stavka label="Ime i prezime" vrednost={punoIme(zaposleni)} />
        <Stavka label="Radno mesto" vrednost={zaposleni.radnoMesto} />
        <Stavka label="Sektor" vrednost={nazivSektora(baza, zaposleni.sektorId)} />
        <Stavka label="Lokacija rada" vrednost={zaposleni.lokacija} />
        <Stavka label="U radnom odnosu od" vrednost={datum(zaposleni.datumZaposlenja)} mono />
        <Stavka label="Broj obuće / konfekcija" vrednost={`${zaposleni.brojCipela} / ${zaposleni.konfekcija}`} mono />
        <RokPolje label="Lekarski pregled važi do" iso={zaposleni.lekarskiVazi} />
        <RokPolje label="Obuka BZR važi do" iso={zaposleni.obukaBzrVazi} />
        <Stavka label="Lice za BZR" vrednost={karton.liceZaBzr} />
      </dl>
    </div>
  );
}

function PotpisKartona({ potpis, ime, uloga }: { potpis: string | null; ime: string; uloga: string }) {
  return (
    <div className="min-w-0">
      <div className="flex h-12 items-end border-b border-ink/70 px-1">
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
    </div>
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

function RokPolje({ label, iso }: { label: string; iso: string | null }) {
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

/* ----------------------- Otvaranje novog kartona ----------------------- */

function OtvaranjeKartona({ zaposleni, onClose }: { zaposleni: Zaposleni | null; onClose: () => void }) {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [podaci, setPodaci] = useState<Partial<Zaposleni>>({});
  const [napomena, setNapomena] = useState('');
  const [potpisZaposlenog, setPotpisZaposlenog] = useState<string | null>(null);
  const [potpisLicaBzr, setPotpisLicaBzr] = useState<string | null>(null);

  if (!zaposleni) return null;
  const v = { ...zaposleni, ...podaci };
  const liceBzr = baza.podesavanja.firma.liceZaBzr;
  const potpisBzrNaloga = baza.nalozi.find((n) => n.fullName === liceBzr)?.potpis ?? null;
  const konacniBzr = potpisLicaBzr ?? (ja?.fullName === liceBzr ? ja.potpis : potpisBzrNaloga);
  const moze = Boolean(potpisZaposlenog) && Boolean(ja?.potpis) && Boolean(konacniBzr);

  const zatvori = () => {
    setPodaci({});
    setNapomena('');
    setPotpisZaposlenog(null);
    setPotpisLicaBzr(null);
    onClose();
  };

  return (
    <Modal
      open
      onClose={zatvori}
      naslov={`Otvaranje kartona — ${punoIme(zaposleni)}`}
      opis="Podaci uneti ovde upisuju se i na zaposlenog. Karton pri otvaranju potpisuju sve tri strane."
      sirina="max-w-3xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={zatvori}>Odustani</button>
          <button
            className="btn-accent"
            disabled={!moze}
            onClick={() => {
              const k = akcije.napraviKarton({
                zaposleniId: zaposleni.id,
                podaciZaposlenog: podaci,
                potpisZaposlenog,
                potpisUsluzioca: ja?.potpis ?? null,
                potpisLicaBzr: konacniBzr,
                napomena,
              });
              javi(`Karton ${k.broj} je otvoren i potpisan.`);
              zatvori();
            }}
          >
            Otvori i potpiši karton
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 panel-quiet px-3 py-2">
            <div className="eyebrow">Zaposleni iz evidencije</div>
            <div className="text-sm font-medium">{punoIme(zaposleni)}</div>
            <div className="text-micro text-ink-muted">{zaposleni.email}</div>
          </div>
          <Polje label="Radno mesto">
            <input className="input" value={v.radnoMesto} onChange={(e) => setPodaci({ ...podaci, radnoMesto: e.target.value })} />
          </Polje>
          <Polje label="Sektor" hint="Određuje ko vidi i ko odobrava zaduženja ovog zaposlenog.">
            <select className="input" value={v.sektorId} onChange={(e) => setPodaci({ ...podaci, sektorId: e.target.value })}>
              {baza.sektori.map((s) => (
                <option key={s.id} value={s.id}>{s.naziv}</option>
              ))}
            </select>
          </Polje>
          <Polje label="Lokacija rada">
            <input className="input" value={v.lokacija} onChange={(e) => setPodaci({ ...podaci, lokacija: e.target.value })} />
          </Polje>
          <Polje label="Broj obuće">
            <input className="input font-mono tnum" value={v.brojCipela} onChange={(e) => setPodaci({ ...podaci, brojCipela: e.target.value })} />
          </Polje>
          <Polje label="Veličina konfekcije">
            <input className="input font-mono" value={v.konfekcija} onChange={(e) => setPodaci({ ...podaci, konfekcija: e.target.value })} />
          </Polje>
          <Polje label="Lekarski važi do">
            <input
              type="date"
              className="input font-mono"
              value={v.lekarskiVazi ? v.lekarskiVazi.slice(0, 10) : ''}
              onChange={(e) => setPodaci({ ...podaci, lekarskiVazi: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </Polje>
          <div className="sm:col-span-2">
            <Polje label="Napomena uz karton">
              <input className="input" value={napomena} onChange={(e) => setNapomena(e.target.value)} />
            </Polje>
          </div>
        </div>

        <div className="space-y-3">
          <PotpisPad label={`Potpis zaposlenog — ${punoIme(zaposleni)}`} visina={96} onChange={setPotpisZaposlenog} />

          <div>
            <span className="label">Potpis uslužioca — {ja?.fullName}</span>
            <div className="flex h-[74px] items-end rounded-card border border-line-strong bg-surface px-3 pb-2">
              {ja?.potpis ? (
                <img src={ja.potpis} alt="Potpis uslužioca" className="max-h-full object-contain object-left-bottom" />
              ) : (
                <span className="pb-1 text-micro text-signal-warn">
                  Nemate sačuvan potpis — postavite ga u „Moj nalog".
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="label">Potpis lica za BZR — {liceBzr}</span>
            {konacniBzr && !potpisLicaBzr ? (
              <div className="flex h-[74px] items-end rounded-card border border-line-strong bg-surface px-3 pb-2">
                <img src={konacniBzr} alt="Potpis lica za BZR" className="max-h-full object-contain object-left-bottom" />
              </div>
            ) : (
              <PotpisPad label=" " visina={74} onChange={setPotpisLicaBzr} />
            )}
          </div>

          {!moze && (
            <p className="text-micro text-signal-warn">
              Za otvaranje kartona potrebna su sva tri potpisa.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------- Dopuna podataka na već otvorenom ------------------- */

function DopunaKartona({ zaposleni, onClose }: { zaposleni: Zaposleni | null; onClose: () => void }) {
  const { baza, akcije } = useStore();
  const javi = useToast();
  const [podaci, setPodaci] = useState<Partial<Zaposleni>>({});

  if (!zaposleni) return null;
  const v = { ...zaposleni, ...podaci };
  const zatvori = () => {
    setPodaci({});
    onClose();
  };

  return (
    <Modal
      open
      onClose={zatvori}
      naslov={`Dopuna kartona — ${punoIme(zaposleni)}`}
      opis="Izmene se upisuju na zaposlenog i odmah se vide u zaglavlju kartona."
      sirina="max-w-2xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={zatvori}>Odustani</button>
          <button
            className="btn-primary"
            onClick={() => {
              akcije.izmeniZaposlenog(zaposleni.id, podaci);
              javi('Karton je ažuriran.');
              zatvori();
            }}
          >
            Snimi
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Polje label="Radno mesto">
          <input className="input" value={v.radnoMesto} onChange={(e) => setPodaci({ ...podaci, radnoMesto: e.target.value })} />
        </Polje>
        <Polje label="Sektor" hint="Određuje ko vidi i ko odobrava zaduženja ovog zaposlenog.">
          <select className="input" value={v.sektorId} onChange={(e) => setPodaci({ ...podaci, sektorId: e.target.value })}>
            {baza.sektori.map((s) => (
              <option key={s.id} value={s.id}>{s.naziv}</option>
            ))}
          </select>
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
