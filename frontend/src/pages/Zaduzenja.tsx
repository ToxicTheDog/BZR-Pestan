import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarPlus, PenLine, Plus, Printer, Stamp } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  OZNAKA_STATUSA, brojKomada, nadjiNalog, nadjiOpremu, nadjiZaposlenog, nazivSektora, opisStavki,
  punoIme, rokZaduzenja, vidljivaZaduzenja,
} from '../lib/izbor';
import { datum, datumVreme, sadrzi, useSada } from '../lib/format';
import type { Zaduzenje } from '../lib/types';
import { Zaglavlje } from '../components/Shell';
import {
  Brojac, Filteri, Fioka, Modal, Odeljak, Oznaka, Polje, Podatak, Prazno, Pretraga, useToast,
} from '../components/ui';
import { RokOznaka, RokTraka } from '../components/Rok';
import { DigitalniBlok, PrikazPotpisa } from '../components/Potpis';
import { DijalogPotpisa, DijalogRazduzenja } from '../components/Dijalozi';

const FILTERI = [
  ['sva', 'Sva'],
  ['aktivno', 'Aktivna'],
  ['isteklo', 'Istekla'],
  ['kriticno', 'Ističe danas-sutra'],
  ['uskoro', 'Ističe ove nedelje'],
  ['ceka_potpis', 'Čeka potpis'],
  ['ceka_odobrenje', 'Čeka odobrenje'],
  ['razduzeno', 'Razdužena'],
] as const;

type Filter = (typeof FILTERI)[number][0];

export function Zaduzenja() {
  const { baza, ja, smem } = useStore();
  const sada = useSada(1000);
  const [params, setParams] = useSearchParams();
  const [pretraga, setPretraga] = useState('');

  const filter = (params.get('filter') as Filter) || 'sva';
  // I direktan link na dokument poštuje nadležnost.
  const dozvoljena = vidljivaZaduzenja(baza, ja);
  const otvoreno = dozvoljena.find((z) => z.id === params.get('otvori')) ?? null;
  const zaPotpis = dozvoljena.find((z) => z.id === params.get('potpis')) ?? null;
  const zaRazduzenje = dozvoljena.find((z) => z.id === params.get('razduzi')) ?? null;

  const postavi = (kljuc: string, vrednost: string | null) => {
    const next = new URLSearchParams(params);
    if (vrednost) next.set(kljuc, vrednost);
    else next.delete(kljuc);
    setParams(next, { replace: true });
  };

  // Osnovni skup su zaduženja iz sektora u nadležnosti naloga.
  const prikazana = useMemo(() => {
    return vidljivaZaduzenja(baza, ja).filter((z) => {
      const rok = rokZaduzenja(baza, z, sada);
      if (filter === 'aktivno' && z.status !== 'aktivno') return false;
      if (filter === 'ceka_potpis' && z.status !== 'ceka_potpis') return false;
      if (filter === 'ceka_odobrenje' && z.status !== 'ceka_odobrenje') return false;
      if (filter === 'razduzeno' && z.status !== 'razduzeno') return false;
      if (['isteklo', 'uskoro', 'kriticno'].includes(filter)) {
        if (z.status !== 'aktivno' || rok.status !== filter) return false;
      }
      if (!pretraga) return true;
      const zap = nadjiZaposlenog(baza, z.zaposleniId);
      return (
        sadrzi(z.broj, pretraga) ||
        sadrzi(punoIme(zap), pretraga) ||
        sadrzi(opisStavki(baza, z), pretraga) ||
        sadrzi(nazivSektora(baza, zap?.sektorId), pretraga)
      );
    });
  }, [baza, ja, filter, pretraga, sada]);

  return (
    <>
      <Zaglavlje
        nadnaslov="Evidencija"
        naslov="Zaduženja opreme"
        opis="Ko je šta preuzeo, ko je izdao, kada je potpisano i koliko je roka ostalo."
        akcije={
          smem('zaduzenja.izdaj') && (
            <Link to="/zaduzenja/novo" className="btn-accent">
              <Plus size={15} /> Novo zaduženje
            </Link>
          )
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga value={pretraga} onChange={setPretraga} placeholder="Broj, zaposleni, oprema, služba…" />
        <Filteri vrednost={filter} onChange={(v) => postavi('filter', v === 'sva' ? null : v)} stavke={FILTERI} />
        <span className="ml-auto">
          <Brojac prikazano={prikazana.length} ukupno={baza.zaduzenja.length} jedinica="zaduženja" />
        </span>
      </div>

      <div className="panel overflow-hidden">
        {prikazana.length === 0 ? (
          <Prazno naslov="Nema zaduženja po ovom filteru" hint="Promenite filter ili pojam pretrage." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-surface">
                <tr>
                  <th className="th w-28">Broj</th>
                  <th className="th">Zaposleni</th>
                  <th className="th">Oprema</th>
                  <th className="th w-32">Izdao</th>
                  <th className="th w-24">Potpisano</th>
                  <th className="th w-44">Rok</th>
                  <th className="th w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {prikazana.map((z) => {
                  const zap = nadjiZaposlenog(baza, z.zaposleniId);
                  const rok = rokZaduzenja(baza, z, sada);
                  return (
                    <tr
                      key={z.id}
                      className="row cursor-pointer"
                      onClick={() => postavi('otvori', z.id)}
                    >
                      <td className="td font-mono text-micro tnum">{z.broj}</td>
                      <td className="td">
                        <div className="font-medium">{punoIme(zap)}</div>
                        <div className="text-micro text-ink-faint">{nazivSektora(baza, zap?.sektorId)}</div>
                      </td>
                      <td className="td">
                        <div className="max-w-[22rem] truncate">{opisStavki(baza, z)}</div>
                        <div className="font-mono text-eyebrow text-ink-faint tnum">
                          {brojKomada(z)} kom.
                        </div>
                      </td>
                      <td className="td text-micro">{nadjiNalog(baza, z.izdaoId)?.fullName ?? '—'}</td>
                      <td className="td font-mono text-micro tnum">{datum(z.signedAt)}</td>
                      <td className="td">
                        {z.status === 'aktivno' ? (
                          <RokOznaka rok={rok} sitno />
                        ) : (
                          <span className="font-mono text-micro text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="td">
                        <StatusOznaka z={z} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Detalj
        zaduzenje={otvoreno}
        onClose={() => postavi('otvori', null)}
        naPotpis={(id) => {
          postavi('otvori', null);
          postavi('potpis', id);
        }}
        naRazduzenje={(id) => {
          postavi('otvori', null);
          postavi('razduzi', id);
        }}
      />

      <DijalogPotpisa zaduzenje={zaPotpis} open={Boolean(zaPotpis)} onClose={() => postavi('potpis', null)} />
      <DijalogRazduzenja zaduzenje={zaRazduzenje} open={Boolean(zaRazduzenje)} onClose={() => postavi('razduzi', null)} />
    </>
  );
}

export function StatusOznaka({ z }: { z: Zaduzenje }) {
  const ton =
    z.status === 'aktivno' ? 'ok'
      : z.status === 'razduzeno' ? 'neutral'
        : z.status === 'odbijeno' ? 'danger'
          : z.status === 'ceka_potpis' ? 'accent' : 'info';
  return <Oznaka ton={ton}>{OZNAKA_STATUSA[z.status]}</Oznaka>;
}

/* ---------------------------- Detalj u fioci ---------------------------- */

function Detalj({
  zaduzenje, onClose, naPotpis, naRazduzenje,
}: {
  zaduzenje: Zaduzenje | null;
  onClose: () => void;
  naPotpis: (id: string) => void;
  naRazduzenje: (id: string) => void;
}) {
  const { baza, akcije, smem } = useStore();
  const javi = useToast();
  const sada = useSada(1000);
  const [produzenje, setProduzenje] = useState(false);
  const [dana, setDana] = useState(30);
  const [razlog, setRazlog] = useState('');

  if (!zaduzenje) return null;

  const zap = nadjiZaposlenog(baza, zaduzenje.zaposleniId);
  const rok = rokZaduzenja(baza, zaduzenje, sada);
  const razduzenje = baza.razduzenja.find((r) => r.zaduzenjeId === zaduzenje.id);

  return (
    <Fioka
      open
      onClose={onClose}
      nadnaslov={`Zaduženje ${zaduzenje.broj}`}
      naslov={punoIme(zap)}
      akcije={
        <>
          <button className="btn-ghost px-1.5 py-1 text-micro" onClick={() => window.print()}>
            <Printer size={13} /> Štampa
          </button>
          {zaduzenje.status === 'ceka_potpis' && smem('zaduzenja.izdaj') && (
            <button className="btn-accent px-2 py-1 text-micro" onClick={() => naPotpis(zaduzenje.id)}>
              <PenLine size={13} /> Potpiši
            </button>
          )}
          {zaduzenje.status === 'aktivno' && smem('zaduzenja.razduzi') && (
            <button className="btn-primary px-2 py-1 text-micro" onClick={() => naRazduzenje(zaduzenje.id)}>
              <Stamp size={13} /> Razduži
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusOznaka z={zaduzenje} />
          {zaduzenje.status === 'aktivno' && <RokOznaka rok={rok} />}
          <span className="font-mono text-micro text-ink-faint tnum">{zaduzenje.broj}</span>
        </div>

        {zaduzenje.status === 'aktivno' && (
          <div className="panel-quiet px-4 py-3">
            <RokTraka rok={rok} />
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-micro text-ink-muted">
              <span>
                Potpisano {datumVreme(zaduzenje.signedAt)} · rok ističe {datumVreme(zaduzenje.dueAt)}
              </span>
              {smem('zaduzenja.produzi') && zaduzenje.dueAt && (
                <button className="btn-secondary px-2 py-1 text-micro" onClick={() => setProduzenje(true)}>
                  <CalendarPlus size={13} /> Produži rok
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Podatak label="Zaposleni">{punoIme(zap)}</Podatak>
          <Podatak label="Radno mesto">{zap?.radnoMesto}</Podatak>
          <Podatak label="Sektor">{nazivSektora(baza, zap?.sektorId)}</Podatak>
          <Podatak label="Izdao">{nadjiNalog(baza, zaduzenje.izdaoId)?.fullName ?? '—'}</Podatak>
          <Podatak label="Odobrio">{nadjiNalog(baza, zaduzenje.odobrioId)?.fullName ?? 'nije traženo'}</Podatak>
          <Podatak label="Kreirano" mono>{datumVreme(zaduzenje.createdAt)}</Podatak>
        </div>

        <Odeljak naslov="Stavke zaduženja" nadnaslov={`${brojKomada(zaduzenje)} komada`} ravno>
          <ul className="divide-y divide-line">
            {zaduzenje.stavke.map((s) => {
              const o = nadjiOpremu(baza, s.opremaId);
              const kat = baza.kategorije.find((k) => k.id === o?.kategorijaId);
              return (
                <li key={s.opremaId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{o?.naziv ?? 'Oprema'}</span>
                    <span className="block truncate font-mono text-eyebrow text-ink-faint">
                      {o?.inv} · {kat?.naziv} {s.velicina && `· vel. ${s.velicina}`}
                    </span>
                  </span>
                  <span className="font-mono text-sm tnum">×{s.kolicina}</span>
                </li>
              );
            })}
          </ul>
        </Odeljak>

        {zaduzenje.napomena && (
          <div className="panel-quiet px-3 py-2.5 text-sm text-ink-muted">{zaduzenje.napomena}</div>
        )}

        {zaduzenje.razlogOdbijanja && (
          <div className="rounded-card border border-signal-danger/25 bg-signal-dangerBg px-3 py-2.5 text-sm text-signal-danger">
            Odbijeno: {zaduzenje.razlogOdbijanja}
          </div>
        )}

        {zaduzenje.produzenja.length > 0 && (
          <Odeljak naslov="Produženja roka" nadnaslov="Istorija" ravno>
            <ul className="divide-y divide-line">
              {zaduzenje.produzenja.map((p, i) => (
                <li key={i} className="px-4 py-2 text-micro">
                  <span className="font-mono tnum">{datum(p.at)}</span> · +{p.dana} dana · {p.ko}
                  <div className="text-ink-muted">{p.razlog}</div>
                </li>
              ))}
            </ul>
          </Odeljak>
        )}

        <Odeljak naslov="Potpisi" nadnaslov="Overa dokumenta">
          <div className="grid gap-5 sm:grid-cols-2">
            <PrikazPotpisa
              potpis={zaduzenje.potpisPrimaoca}
              ime={punoIme(zap)}
              uloga="Primalac"
              vreme={zaduzenje.signedAt ? datumVreme(zaduzenje.signedAt) : undefined}
            />
            <PrikazPotpisa
              potpis={zaduzenje.potpisIzdavaoca}
              ime={nadjiNalog(baza, zaduzenje.izdaoId)?.fullName ?? '—'}
              uloga="Uslužilac"
              vreme={zaduzenje.signedAt ? datumVreme(zaduzenje.signedAt) : undefined}
            />
          </div>
          {zaduzenje.digitalni && (
            <div className="mt-4">
              <DigitalniBlok
                potpisnik={zaduzenje.digitalni.potpisnik}
                sertifikat={zaduzenje.digitalni.sertifikat}
                otisakVrednost={zaduzenje.digitalni.otisak}
                vreme={datumVreme(zaduzenje.digitalni.vreme)}
              />
            </div>
          )}
        </Odeljak>

        {razduzenje && (
          <Odeljak naslov={`Razduženje ${razduzenje.broj}`} nadnaslov="Povrat opreme">
            <div className="grid grid-cols-2 gap-3">
              <Podatak label="Vraćeno" mono>{datumVreme(razduzenje.vracenoAt)}</Podatak>
              <Podatak label="Primio">{nadjiNalog(baza, razduzenje.primioId)?.fullName ?? '—'}</Podatak>
              <Podatak label="Stanje">{razduzenje.stanje}</Podatak>
              <Podatak label="Napomena">{razduzenje.napomena || '—'}</Podatak>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <PrikazPotpisa potpis={razduzenje.potpisVratioca} ime={punoIme(zap)} uloga="Vratio" />
              <PrikazPotpisa
                potpis={razduzenje.potpisPrimaoca}
                ime={nadjiNalog(baza, razduzenje.primioId)?.fullName ?? '—'}
                uloga="Primio"
              />
            </div>
          </Odeljak>
        )}
      </div>

      <Modal
        open={produzenje}
        onClose={() => setProduzenje(false)}
        naslov={`Produženje roka — ${zaduzenje.broj}`}
        opis="Novi rok se računa od postojećeg datuma isteka."
        sirina="max-w-md"
        podnozje={
          <>
            <button className="btn-secondary" onClick={() => setProduzenje(false)}>Odustani</button>
            <button
              className="btn-primary"
              disabled={!razlog.trim()}
              onClick={() => {
                akcije.produziZaduzenje(zaduzenje.id, dana, razlog);
                javi(`Rok produžen za ${dana} dana.`);
                setProduzenje(false);
                setRazlog('');
              }}
            >
              Produži
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Polje label="Broj dana">
            <input
              type="number"
              min={1}
              className="input font-mono tnum"
              value={dana}
              onChange={(e) => setDana(Math.max(1, Number(e.target.value)))}
            />
          </Polje>
          <Polje label="Razlog" hint="Upisuje se u log i u karton zaposlenog.">
            <textarea className="input min-h-[72px]" value={razlog} onChange={(e) => setRazlog(e.target.value)} />
          </Polje>
        </div>
      </Modal>
    </Fioka>
  );
}
