import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Stamp } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  nadjiNalog, nadjiZaposlenog, opisStavki, punoIme, rokZaduzenja, vidljivaRazduzenja, vidljivaZaduzenja,
} from '../lib/izbor';
import { datum, datumVreme, sadrzi, useSada } from '../lib/format';
import type { StanjeVracene } from '../lib/types';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import { Brojac, Odeljak, Oznaka, Prazno, Pretraga, Tabovi } from '../components/ui';
import { RokOznaka } from '../components/Rok';
import { PrikazPotpisa } from '../components/Potpis';
import { DijalogRazduzenja } from '../components/Dijalozi';

const TON_STANJA: Record<StanjeVracene, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  ispravno: 'ok',
  habanje: 'neutral',
  osteceno: 'warn',
  nestalo: 'danger',
};

const NAZIV_STANJA: Record<StanjeVracene, string> = {
  ispravno: 'Ispravno',
  habanje: 'Habanje',
  osteceno: 'Oštećeno',
  nestalo: 'Nestalo',
};

export function Razduzenja() {
  const { baza, ja, smem } = useStore();
  const sada = useSada(1000);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<'zaduzeno' | 'vraceno'>('zaduzeno');
  const [pretraga, setPretraga] = useState('');

  const zaRazduzenje = vidljivaZaduzenja(baza, ja).find((z) => z.id === params.get('razduzi')) ?? null;
  const postavi = (v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set('razduzi', v);
    else next.delete('razduzi');
    setParams(next, { replace: true });
  };

  const aktivna = useMemo(
    () =>
      vidljivaZaduzenja(baza, ja)
        .filter((z) => z.status === 'aktivno')
        .filter((z) => !pretraga || sadrzi(punoIme(nadjiZaposlenog(baza, z.zaposleniId)), pretraga) || sadrzi(z.broj, pretraga))
        .sort((a, b) => new Date(a.dueAt ?? 0).getTime() - new Date(b.dueAt ?? 0).getTime()),
    [baza, ja, pretraga],
  );

  const vracena = useMemo(
    () =>
      vidljivaRazduzenja(baza, ja).filter((r) => {
        if (!pretraga) return true;
        const z = baza.zaduzenja.find((x) => x.id === r.zaduzenjeId);
        return sadrzi(r.broj, pretraga) || sadrzi(punoIme(nadjiZaposlenog(baza, z?.zaposleniId ?? '')), pretraga);
      }),
    [baza, ja, pretraga],
  );

  const poStanju = (s: StanjeVracene) => vidljivaRazduzenja(baza, ja).filter((r) => r.stanje === s).length;

  return (
    <>
      <Zaglavlje
        nadnaslov="Evidencija"
        naslov="Razduženja opreme"
        opis="Povrat opreme u magacin, stanje pri povratu i potpisi obe strane."
      />

      <SaDosijeom
        dosije={
          <>
            <Odeljak naslov="Stanje vraćene opreme" nadnaslov="Presek" ravno>
              <dl className="divide-y divide-line">
                {(Object.keys(NAZIV_STANJA) as StanjeVracene[]).map((s) => (
                  <div key={s} className="flex items-center justify-between gap-3 px-4 py-2">
                    <dt className="text-micro text-ink-muted">{NAZIV_STANJA[s]}</dt>
                    <dd className="font-mono text-sm font-semibold tnum">{poStanju(s)}</dd>
                  </div>
                ))}
              </dl>
            </Odeljak>

            <Odeljak naslov="Poslednji povrati" nadnaslov="Hronologija" ravno>
              <ul className="divide-y divide-line">
                {vidljivaRazduzenja(baza, ja).slice(0, 5).map((r) => {
                  const z = baza.zaduzenja.find((x) => x.id === r.zaduzenjeId);
                  return (
                    <li key={r.id} className="px-4 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-micro tnum">{r.broj}</span>
                        <Oznaka ton={TON_STANJA[r.stanje]}>{NAZIV_STANJA[r.stanje]}</Oznaka>
                      </div>
                      <div className="truncate text-micro text-ink-muted">
                        {punoIme(nadjiZaposlenog(baza, z?.zaposleniId ?? ''))} · {datum(r.vracenoAt)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Odeljak>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Tabovi
            vrednost={tab}
            onChange={setTab}
            stavke={[
              { id: 'zaduzeno' as const, label: 'Za razduženje', broj: aktivna.length },
              { id: 'vraceno' as const, label: 'Vraćeno', broj: baza.razduzenja.length },
            ]}
          />
          <div className="ml-auto flex items-center gap-2">
            <Pretraga value={pretraga} onChange={setPretraga} placeholder="Broj ili zaposleni…" sirina="w-56" />
            <Brojac
              prikazano={tab === 'zaduzeno' ? aktivna.length : vracena.length}
              ukupno={tab === 'zaduzeno' ? baza.zaduzenja.filter((z) => z.status === 'aktivno').length : baza.razduzenja.length}
              jedinica="stavki"
            />
          </div>
        </div>

        {tab === 'zaduzeno' ? (
          <div className="panel overflow-hidden">
            {aktivna.length === 0 ? (
              <Prazno naslov="Nema aktivnih zaduženja" />
            ) : (
              <ul className="divide-y divide-line">
                {aktivna.map((z) => {
                  const rok = rokZaduzenja(baza, z, sada);
                  return (
                    <li key={z.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <span className="w-24 shrink-0 font-mono text-micro text-ink-faint tnum">{z.broj}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {punoIme(nadjiZaposlenog(baza, z.zaposleniId))}
                        </span>
                        <span className="block truncate text-micro text-ink-muted">{opisStavki(baza, z)}</span>
                      </span>
                      <RokOznaka rok={rok} sitno />
                      {smem('zaduzenja.razduzi') && (
                        <button className="btn-secondary shrink-0 px-2 py-1 text-micro" onClick={() => postavi(z.id)}>
                          <Stamp size={12} /> Razduži
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {vracena.length === 0 ? (
              <div className="panel">
                <Prazno naslov="Nema evidentiranih razduženja" />
              </div>
            ) : (
              vracena.map((r) => {
                const z = baza.zaduzenja.find((x) => x.id === r.zaduzenjeId);
                const zap = nadjiZaposlenog(baza, z?.zaposleniId ?? '');
                return (
                  <Odeljak
                    key={r.id}
                    naslov={punoIme(zap)}
                    nadnaslov={`${r.broj} · po zaduženju ${z?.broj ?? '—'}`}
                    akcije={<Oznaka ton={TON_STANJA[r.stanje]}>{NAZIV_STANJA[r.stanje]}</Oznaka>}
                  >
                    <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                      <div className="space-y-1.5">
                        <div className="text-sm">{z ? opisStavki(baza, z) : '—'}</div>
                        <div className="font-mono text-micro text-ink-faint tnum">
                          Vraćeno {datumVreme(r.vracenoAt)} · primio {nadjiNalog(baza, r.primioId)?.fullName}
                        </div>
                        {r.napomena && <p className="text-micro text-ink-muted">{r.napomena}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <PrikazPotpisa potpis={r.potpisVratioca} ime={punoIme(zap)} uloga="Vratio" visina="h-12" />
                        <PrikazPotpisa
                          potpis={r.potpisPrimaoca}
                          ime={nadjiNalog(baza, r.primioId)?.fullName ?? '—'}
                          uloga="Primio"
                          visina="h-12"
                        />
                      </div>
                    </div>
                  </Odeljak>
                );
              })
            )}
          </div>
        )}
      </SaDosijeom>

      <DijalogRazduzenja zaduzenje={zaRazduzenje} open={Boolean(zaRazduzenje)} onClose={() => postavi(null)} />
    </>
  );
}
