import { useMemo, useState } from 'react';
import { KeyRound, Plus, ShieldHalf, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { PRAVA, ULOGE, brojIzuzetaka, imaPravo } from '../lib/permissions';
import { bezNadleznosti, nazivSektora } from '../lib/izbor';
import { datumVreme, inicijali, relativno, sadrzi } from '../lib/format';
import type { Nalog, Permission, Role } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import {
  Fioka, Modal, Odeljak, Oznaka, Podatak, Polje, Potvrda, Prekidac, Pretraga, useToast,
} from '../components/ui';

/** „1 izuzetak", „2 izuzetka", „5 izuzetaka" — broj mora da se slaže sa rečju. */
function izuzetakRec(n: number): string {
  const poslednja = n % 10;
  const dve = n % 100;
  if (poslednja === 1 && dve !== 11) return `${n} izuzetak`;
  if (poslednja >= 2 && poslednja <= 4 && (dve < 12 || dve > 14)) return `${n} izuzetka`;
  return `${n} izuzetaka`;
}

const prazan = {
  username: '', fullName: '', email: '', telefon: '',
  role: 'usluzilac' as Role, aktivan: true, mustChangePassword: true,
};

export function Nalozi() {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [novi, setNovi] = useState<typeof prazan | null>(null);
  const [lozinka, setLozinka] = useState('');
  const [prava, setPrava] = useState<Nalog | null>(null);
  const [brisanje, setBrisanje] = useState<Nalog | null>(null);
  const [reset, setReset] = useState<Nalog | null>(null);
  const [pretragaSektora, setPretragaSektora] = useState('');

  const nalog = prava ? baza.nalozi.find((n) => n.id === prava.id) ?? null : null;

  /** Broj zaposlenih po sektoru u jednom prolazu — evidencija ide na stotine imena. */
  const brojPoSektoru = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const z of baza.zaposleni) mapa.set(z.sektorId, (mapa.get(z.sektorId) ?? 0) + 1);
    return mapa;
  }, [baza.zaposleni]);

  const sektoriZaDodelu = useMemo(
    () =>
      baza.sektori.filter(
        (s) => !pretragaSektora || sadrzi(s.naziv, pretragaSektora) || sadrzi(s.sifra, pretragaSektora) || sadrzi(s.opis, pretragaSektora),
      ),
    [baza.sektori, pretragaSektora],
  );

  return (
    <>
      <Zaglavlje
        nadnaslov="Administracija"
        naslov="Nalozi i prava"
        opis="Tri uloge sa fabričkim pravima; svakom nalogu se pravo može dati ili oduzeti pojedinačno."
        akcije={
          <button className="btn-accent" onClick={() => { setNovi(prazan); setLozinka(''); }}>
            <Plus size={15} /> Novi nalog
          </button>
        }
        meta={
          <>
            {(Object.keys(ULOGE) as Role[]).map((u) => (
              <span key={u} className="flex items-baseline gap-1.5">
                <span className="font-mono text-lg font-semibold tnum">
                  {baza.nalozi.filter((n) => n.role === u).length}
                </span>
                <span className="eyebrow">{ULOGE[u].naziv}</span>
              </span>
            ))}
          </>
        }
      />

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-surface">
              <tr>
                <th className="th">Korisnik</th>
                <th className="th w-44">Uloga</th>
                <th className="th w-44">Nadležnost</th>
                <th className="th w-28">Izuzeci</th>
                <th className="th w-36">Poslednja prijava</th>
                <th className="th w-32">Potpis</th>
                <th className="th w-28">Status</th>
                <th className="th w-56" />
              </tr>
            </thead>
            <tbody>
              {baza.nalozi.map((n) => (
                <tr key={n.id} className="row">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card border border-line bg-surface font-mono text-micro font-semibold">
                        {inicijali(n.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {n.fullName}
                          {n.id === ja?.id && <span className="ml-1.5 text-micro text-ink-faint">(vi)</span>}
                        </span>
                        <span className="block truncate font-mono text-micro text-ink-faint">{n.username}</span>
                      </span>
                    </div>
                  </td>
                  <td className="td">
                    <select
                      className="input py-1 text-micro"
                      value={n.role}
                      disabled={n.id === ja?.id}
                      onChange={(e) => {
                        akcije.izmeniNalog(n.id, { role: e.target.value as Role });
                        javi(`Uloga naloga ${n.username} je promenjena.`);
                      }}
                    >
                      {(Object.keys(ULOGE) as Role[]).map((u) => (
                        <option key={u} value={u}>{ULOGE[u].naziv}</option>
                      ))}
                    </select>
                  </td>
                  <td className="td">
                    {n.sviSektori ? (
                      <Oznaka ton="accent">svi sektori</Oznaka>
                    ) : bezNadleznosti(n) ? (
                      <Oznaka ton="danger">bez nadležnosti</Oznaka>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {n.sektori.map((sid) => (
                          <span key={sid} className="chip bg-surface-deep text-ink-muted">
                            {nazivSektora(baza, sid)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="td">
                    {brojIzuzetaka(n) === 0 ? (
                      <span className="text-micro text-ink-faint">prava uloge</span>
                    ) : (
                      <Oznaka ton="accent">{izuzetakRec(brojIzuzetaka(n))}</Oznaka>
                    )}
                  </td>
                  <td className="td text-micro text-ink-muted">{relativno(n.lastLoginAt)}</td>
                  <td className="td">
                    {n.potpis ? (
                      <img src={n.potpis} alt="Potpis" className="h-7 object-contain object-left" />
                    ) : (
                      <span className="text-micro text-ink-faint">nema potpisa</span>
                    )}
                  </td>
                  <td className="td">
                    {n.aktivan ? <Oznaka ton="ok">Aktivan</Oznaka> : <Oznaka ton="neutral">Isključen</Oznaka>}
                    {n.mustChangePassword && (
                      <div className="mt-1 whitespace-nowrap text-eyebrow uppercase text-signal-warn">mora lozinku</div>
                    )}
                  </td>
                  <td className="td">
                    <div className="flex flex-nowrap justify-end gap-0.5">
                      <button className="btn-ghost px-1.5 py-1 text-micro" onClick={() => setPrava(n)}>
                        <ShieldHalf size={12} /> Prava
                      </button>
                      <button className="btn-ghost px-1.5 py-1 text-micro" onClick={() => { setReset(n); setLozinka(''); }}>
                        <KeyRound size={12} /> Lozinka
                      </button>
                      <button
                        className="btn-ghost px-1.5 py-1 text-micro"
                        disabled={n.id === ja?.id}
                        onClick={() => {
                          akcije.izmeniNalog(n.id, { aktivan: !n.aktivan });
                          javi(n.aktivan ? 'Nalog je isključen.' : 'Nalog je uključen.');
                        }}
                      >
                        {n.aktivan ? 'Isključi' : 'Uključi'}
                      </button>
                      <button
                        className="btn-ghost px-1.5 py-1 text-micro text-signal-danger"
                        disabled={n.id === ja?.id}
                        onClick={() => setBrisanje(n)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prava pojedinačnog naloga */}
      <Fioka
        open={Boolean(nalog)}
        onClose={() => setPrava(null)}
        nadnaslov={nalog ? ULOGE[nalog.role].naziv : ''}
        naslov={nalog?.fullName ?? ''}
      >
        {nalog && (
          <div className="space-y-5">
            <div className="panel-quiet px-3 py-2.5 text-micro text-ink-muted">
              Prava se nasleđuju iz uloge. Izuzetak važi samo za ovaj nalog i nadjačava ulogu —
              u oba smera, i kad daje i kad oduzima.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Podatak label="Korisničko ime" mono>{nalog.username}</Podatak>
              <Podatak label="E-pošta" mono>{nalog.email}</Podatak>
              <Podatak label="Nalog kreiran" mono>{datumVreme(nalog.createdAt)}</Podatak>
              <Podatak label="Sertifikat" mono>{nalog.sertifikat ?? 'nije izdat'}</Podatak>
            </div>

            <Odeljak
              naslov="Nadležnost po sektorima"
              nadnaslov={
                nalog.sviSektori
                  ? 'Cela firma'
                  : `${(nalog.sektori ?? []).length} od ${baza.sektori.length} sektora`
              }
              ravno
            >
              <div className="border-b border-line px-4">
                <Prekidac
                  ukljucen={nalog.sviSektori}
                  onChange={(t) => akcije.postaviNadleznost(nalog.id, nalog.sektori ?? [], t)}
                  label="Svi sektori"
                  opis="Nalog vidi celu firmu, bez sektorske podele."
                />
              </div>
              {!nalog.sviSektori && (
                <>
                  {baza.sektori.length > 6 && (
                    <div className="border-b border-line p-2">
                      <Pretraga
                        value={pretragaSektora}
                        onChange={setPretragaSektora}
                        placeholder="Pronađi sektor…"
                        sirina="w-full"
                      />
                    </div>
                  )}
                  <ul className="divide-y divide-line">
                  {sektoriZaDodelu.map((s) => {
                    const pokriva = (nalog.sektori ?? []).includes(s.id);
                    return (
                      <li key={s.id} className="flex items-center gap-3 px-4 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{s.naziv}</span>
                          <span className="block truncate font-mono text-eyebrow text-ink-faint">
                            {s.sifra} · {brojPoSektoru.get(s.id) ?? 0} zaposlenih
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#D2650B]"
                          checked={pokriva}
                          onChange={(e) =>
                            akcije.postaviNadleznost(
                              nalog.id,
                              e.target.checked
                                ? Array.from(new Set([...(nalog.sektori ?? []), s.id]))
                                : (nalog.sektori ?? []).filter((x) => x !== s.id),
                              nalog.sviSektori,
                            )
                          }
                          aria-label={`Nadležnost za ${s.naziv}`}
                        />
                      </li>
                    );
                  })}
                  </ul>
                  {sektoriZaDodelu.length === 0 && (
                    <p className="px-4 py-3 text-micro text-ink-muted">Nema sektora po ovom pojmu.</p>
                  )}
                </>
              )}
              {bezNadleznosti(nalog) && (
                <p className="border-t border-line px-4 py-2.5 text-micro text-signal-danger">
                  Nalog nema nijedan sektor — ne vidi nijednog zaposlenog ni zaduženje.
                </p>
              )}
            </Odeljak>

            {PRAVA.map((g) => (
              <Odeljak key={g.grupa} naslov={g.grupa} nadnaslov="Grupa prava" ravno>
                <ul className="divide-y divide-line">
                  {g.stavke.map((s) => {
                    const izuzetak = nalog.izuzeci[s.id];
                    const izUloge = (baza.pravaUloga[nalog.role] ?? []).includes(s.id);
                    const konacno = imaPravo(nalog, s.id, baza.pravaUloga);
                    return (
                      <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{s.naziv}</span>
                          <span className="block text-eyebrow uppercase text-ink-faint">
                            uloga: {izUloge ? 'dozvoljeno' : 'zabranjeno'} · konačno: {konacno ? 'dozvoljeno' : 'zabranjeno'}
                          </span>
                        </span>
                        <span className="flex shrink-0 gap-0.5 rounded-card border border-line bg-surface p-0.5">
                          {([
                            [undefined, 'Nasleđeno'],
                            [true, 'Dato'],
                            [false, 'Oduzeto'],
                          ] as const).map(([v, l]) => (
                            <button
                              key={String(v)}
                              onClick={() => akcije.postaviIzuzetak(nalog.id, s.id as Permission, v)}
                              className={`rounded-card px-2 py-0.5 text-eyebrow font-medium uppercase transition-colors ${
                                izuzetak === v
                                  ? v === true
                                    ? 'bg-signal-ok text-paper'
                                    : v === false
                                      ? 'bg-signal-danger text-paper'
                                      : 'bg-ink text-paper'
                                  : 'text-ink-muted hover:bg-paper'
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Odeljak>
            ))}
          </div>
        )}
      </Fioka>

      {/* Novi nalog */}
      <Modal
        open={Boolean(novi)}
        onClose={() => setNovi(null)}
        naslov="Novi nalog"
        opis="Nalog dobija fabrička prava svoje uloge; izuzeci se podešavaju posle."
        sirina="max-w-xl"
        podnozje={
          <>
            <button className="btn-secondary" onClick={() => setNovi(null)}>Odustani</button>
            <button
              className="btn-primary"
              disabled={!novi?.username.trim() || !novi?.fullName.trim() || lozinka.trim().length < 8}
              onClick={() => {
                akcije.dodajNalog(novi!);
                javi(`Nalog ${novi!.username} je napravljen.`);
                setNovi(null);
              }}
            >
              Napravi nalog
            </button>
          </>
        }
      >
        {novi && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Polje label="Korisničko ime" hint="Slova, cifre, tačka i crta.">
                <input
                  className="input font-mono"
                  value={novi.username}
                  onChange={(e) => setNovi({ ...novi, username: e.target.value.toLowerCase() })}
                  autoFocus
                />
              </Polje>
              <Polje label="Ime i prezime">
                <input className="input" value={novi.fullName} onChange={(e) => setNovi({ ...novi, fullName: e.target.value })} />
              </Polje>
              <Polje label="E-pošta">
                <input className="input font-mono" value={novi.email} onChange={(e) => setNovi({ ...novi, email: e.target.value })} />
              </Polje>
              <Polje label="Telefon">
                <input className="input font-mono" value={novi.telefon} onChange={(e) => setNovi({ ...novi, telefon: e.target.value })} />
              </Polje>
            </div>

            <Polje label="Uloga" hint={ULOGE[novi.role].opis}>
              <select className="input" value={novi.role} onChange={(e) => setNovi({ ...novi, role: e.target.value as Role })}>
                {(Object.keys(ULOGE) as Role[]).map((u) => (
                  <option key={u} value={u}>{ULOGE[u].naziv}</option>
                ))}
              </select>
            </Polje>

            <Polje label="Početna lozinka" hint="Najmanje 8 znakova. Korisnik je menja pri prvoj prijavi.">
              <input className="input font-mono" value={lozinka} onChange={(e) => setLozinka(e.target.value)} />
            </Polje>

            <div className="divide-y divide-line border-y border-line">
              <Prekidac
                ukljucen={novi.mustChangePassword}
                onChange={(v) => setNovi({ ...novi, mustChangePassword: v })}
                label="Obavezna promena lozinke"
                opis="Pri prvoj prijavi korisnik mora da postavi svoju lozinku."
              />
              <Prekidac
                ukljucen={novi.aktivan}
                onChange={(v) => setNovi({ ...novi, aktivan: v })}
                label="Nalog je aktivan"
                opis="Isključen nalog ne može da se prijavi."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Reset lozinke */}
      <Modal
        open={Boolean(reset)}
        onClose={() => setReset(null)}
        naslov={`Nova lozinka — ${reset?.username ?? ''}`}
        sirina="max-w-md"
        podnozje={
          <>
            <button className="btn-secondary" onClick={() => setReset(null)}>Odustani</button>
            <button
              className="btn-primary"
              disabled={lozinka.trim().length < 8}
              onClick={() => {
                akcije.izmeniNalog(reset!.id, { mustChangePassword: true });
                javi(`Lozinka za ${reset!.username} je resetovana.`);
                setReset(null);
              }}
            >
              Resetuj
            </button>
          </>
        }
      >
        <Polje label="Privremena lozinka" hint="Najmanje 8 znakova; korisnik je menja pri prijavi.">
          <input className="input font-mono" value={lozinka} onChange={(e) => setLozinka(e.target.value)} autoFocus />
        </Polje>
      </Modal>

      <Potvrda
        open={Boolean(brisanje)}
        naslov={`Brisanje naloga — ${brisanje?.username ?? ''}`}
        tekst="Nalog se uklanja iz sistema. Zaduženja i potpisi koje je napravio ostaju u evidenciji."
        potvrdiTekst="Obriši nalog"
        opasno
        onClose={() => setBrisanje(null)}
        onPotvrdi={() => {
          akcije.obrisiNalog(brisanje!.id);
          javi('Nalog je obrisan.', 'info');
        }}
      />
    </>
  );
}
