import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  brojKomada, kategorijaOpreme, nadjiNalog, nadjiOpremu, nadjiZaposlenog, nazivSektora, punoIme,
  vidljivaZaduzenja,
} from '../lib/izbor';
import { danaRec, datumVreme, relativno } from '../lib/format';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import { Modal, Odeljak, Oznaka, Polje, Prazno, useToast } from '../components/ui';
import { StatusOznaka } from './Zaduzenja';

export function Odobrenja() {
  const { baza, akcije, ja, smem } = useStore();
  const javi = useToast();
  const [odbijanje, setOdbijanje] = useState<string | null>(null);
  const [razlog, setRazlog] = useState('');

  // Odobrilac rešava samo zahteve iz sektora za koje je nadležan.
  const mojaZaduzenja = vidljivaZaduzenja(baza, ja);
  const naCekanju = mojaZaduzenja.filter((z) => z.status === 'ceka_odobrenje');
  const odluceno = mojaZaduzenja
    .filter((z) => z.odobrenoAt && z.status !== 'ceka_odobrenje')
    .sort((a, b) => new Date(b.odobrenoAt!).getTime() - new Date(a.odobrenoAt!).getTime());

  return (
    <>
      <Zaglavlje
        nadnaslov="Odobrilac"
        naslov="Odobravanje izdavanja"
        opis="Zahtevi koje je podneo uslužilac; posle odobrenja zaposleni potpisuje prijem."
        meta={
          <>
            <span className="eyebrow">Na čekanju</span>
            <span className="font-mono text-lg font-semibold tnum">{naCekanju.length}</span>
            <span className="eyebrow">Odlučeno ukupno</span>
            <span className="font-mono text-lg font-semibold tnum text-ink-faint">{odluceno.length}</span>
          </>
        }
      />

      <SaDosijeom
        dosije={
          <Odeljak naslov="Istorija odluka" nadnaslov="Ko je šta odobrio" ravno>
            {odluceno.length === 0 ? (
              <Prazno naslov="Još nema odluka" />
            ) : (
              <ul className="divide-y divide-line">
                {odluceno.slice(0, 8).map((z) => (
                  <li key={z.id} className="px-4 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-micro tnum">{z.broj}</span>
                      <StatusOznaka z={z} />
                    </div>
                    <div className="truncate text-micro text-ink-muted">
                      {punoIme(nadjiZaposlenog(baza, z.zaposleniId))} · {nadjiNalog(baza, z.odobrioId)?.fullName ?? '—'}
                    </div>
                    <div className="font-mono text-eyebrow text-ink-faint">{relativno(z.odobrenoAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Odeljak>
        }
      >
        {naCekanju.length === 0 ? (
          <div className="panel">
            <Prazno naslov="Nema zahteva na čekanju" hint="Svi zahtevi su rešeni." />
          </div>
        ) : (
          <div className="space-y-4">
            {naCekanju.map((z) => {
              const zap = nadjiZaposlenog(baza, z.zaposleniId);
              return (
                <Odeljak
                  key={z.id}
                  nadnaslov={`${z.broj} · podneo ${nadjiNalog(baza, z.izdaoId)?.fullName ?? '—'} · ${relativno(z.createdAt)}`}
                  naslov={punoIme(zap)}
                  akcije={
                    smem('odobrenja.odlucuj') && (
                      <>
                        <button
                          className="btn-danger px-2 py-1 text-micro"
                          onClick={() => {
                            setOdbijanje(z.id);
                            setRazlog('');
                          }}
                        >
                          <X size={13} /> Odbij
                        </button>
                        <button
                          className="btn-primary px-2 py-1 text-micro"
                          onClick={() => {
                            akcije.odobriZaduzenje(z.id);
                            javi(`Zahtev ${z.broj} je odobren — čeka potpis primaoca.`);
                          }}
                        >
                          <Check size={13} /> Odobri
                        </button>
                      </>
                    )
                  }
                >
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="eyebrow mb-1">Tražena oprema</div>
                      <ul className="divide-y divide-line border-y border-line">
                        {z.stavke.map((s) => {
                          const o = nadjiOpremu(baza, s.opremaId);
                          const kat = kategorijaOpreme(baza, o);
                          return (
                            <li key={s.opremaId} className="flex items-center justify-between gap-2 py-2">
                              <span className="min-w-0">
                                <span className="block truncate text-sm">{o?.naziv}</span>
                                <span className="font-mono text-eyebrow text-ink-faint">
                                  {o?.inv} · {kat?.naziv}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {kat?.zahtevaOdobrenje && <Oznaka ton="info">traži odobrenje</Oznaka>}
                                <span className="font-mono text-sm tnum">×{s.kolicina}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {z.napomena && <p className="mt-2 text-micro text-ink-muted">{z.napomena}</p>}
                    </div>

                    <dl className="divide-y divide-line border-y border-line">
                      <Red label="Radno mesto" vrednost={zap?.radnoMesto ?? '—'} />
                      <Red label="Sektor" vrednost={nazivSektora(baza, zap?.sektorId)} />
                      <Red label="Lokacija" vrednost={zap?.lokacija ?? '—'} />
                      <Red label="Traženi rok" vrednost={z.rokDana > 0 ? danaRec(z.rokDana) : 'trajno'} />
                      <Red label="Ukupno komada" vrednost={String(brojKomada(z))} />
                      <Red label="Obuka BZR važi do" vrednost={datumVreme(zap?.obukaBzrVazi ?? null)} />
                    </dl>
                  </div>
                </Odeljak>
              );
            })}
          </div>
        )}
      </SaDosijeom>

      <Modal
        open={Boolean(odbijanje)}
        onClose={() => setOdbijanje(null)}
        naslov="Odbijanje zahteva"
        opis="Razlog se upisuje u log i vidljiv je podnosiocu."
        sirina="max-w-md"
        podnozje={
          <>
            <button className="btn-secondary" onClick={() => setOdbijanje(null)}>Odustani</button>
            <button
              className="btn-danger"
              disabled={!razlog.trim()}
              onClick={() => {
                const z = baza.zaduzenja.find((x) => x.id === odbijanje);
                akcije.odbijZaduzenje(odbijanje!, razlog);
                javi(`Zahtev ${z?.broj ?? ''} je odbijen.`, 'info');
                setOdbijanje(null);
              }}
            >
              Odbij zahtev
            </button>
          </>
        }
      >
        <Polje label="Razlog odbijanja">
          <textarea className="input min-h-[90px]" value={razlog} onChange={(e) => setRazlog(e.target.value)} autoFocus />
        </Polje>
      </Modal>
    </>
  );
}

function Red({ label, vrednost }: { label: string; vrednost: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="truncate text-micro font-medium">{vrednost}</dd>
    </div>
  );
}
