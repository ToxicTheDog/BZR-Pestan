import { Link } from 'react-router-dom';
import { ArrowUpRight, PenLine, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import { napraviPresek, nadjiNalog, nadjiZaposlenog, opisStavki, punoIme, rokZaduzenja } from '../lib/izbor';
import { danaDo, datum, relativno, useSada } from '../lib/format';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import { Odeljak, Oznaka, Prazno } from '../components/ui';
import { RokOznaka } from '../components/Rok';
import type { Zaduzenje } from '../lib/types';

export function Pregled() {
  const { baza, ja, smem } = useStore();
  const sada = useSada(1000);
  const presek = napraviPresek(baza, sada);

  const paznja: Zaduzenje[] = [...presek.isteklo, ...presek.kriticno, ...presek.uskoro];
  const sat = new Date().getHours();
  const pozdrav = sat < 11 ? 'Dobro jutro' : sat < 18 ? 'Dobar dan' : 'Dobro veče';

  return (
    <>
      <Zaglavlje
        nadnaslov={`${pozdrav}, ${ja?.fullName.split(' ')[0] ?? ''}`}
        naslov="Pregled stanja"
        akcije={
          smem('zaduzenja.izdaj') && (
            <Link to="/zaduzenja/novo" className="btn-accent">
              <Plus size={15} /> Novo zaduženje
            </Link>
          )
        }
        meta={
          <>
            <Metrika label="Aktivnih zaduženja" vrednost={presek.aktivna.length} />
            <Metrika label="Isteklo" vrednost={presek.isteklo.length} ton="danger" />
            <Metrika label="Ističe ove nedelje" vrednost={presek.uskoro.length + presek.kriticno.length} ton="warn" />
            <Metrika label="Čeka odobrenje" vrednost={presek.cekaOdobrenje.length} ton="info" />
          </>
        }
      />

      <SaDosijeom
        dosije={
          <>
            <Odeljak
              naslov="Niske zalihe"
              nadnaslov="Nabavka"
              ravno
              akcije={
                <Link to="/inventar" className="btn-ghost px-1.5 py-1 text-micro">
                  Inventar <ArrowUpRight size={12} />
                </Link>
              }
            >
              {presek.niskeZalihe.length === 0 ? (
                <Prazno naslov="Sve iznad minimuma" hint="Nijedan artikal nije pao ispod zadate zalihe." />
              ) : (
                <ul className="divide-y divide-line">
                  {presek.niskeZalihe.slice(0, 6).map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{o.naziv}</span>
                        <span className="font-mono text-eyebrow text-ink-faint">{o.inv}</span>
                      </span>
                      <span className="shrink-0 font-mono text-sm font-semibold tnum text-signal-warn">
                        {o.kolicina}/{o.minZaliha}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Odeljak>

            <Odeljak naslov="Poslednja aktivnost" nadnaslov="Dnevnik" ravno>
              <ul className="divide-y divide-line">
                {baza.logovi.slice(0, 7).map((l) => (
                  <li key={l.id} className="px-4 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-micro font-medium">{l.akcija}</span>
                      <span className="shrink-0 font-mono text-eyebrow text-ink-faint">{relativno(l.at)}</span>
                    </div>
                    <div className="truncate text-micro text-ink-muted">
                      {l.entitet} — {l.ko}
                    </div>
                  </li>
                ))}
              </ul>
            </Odeljak>
          </>
        }
      >
        <Odeljak
          naslov="Rokovi koji gore"
          nadnaslov="Zaduženja"
          ravno
          akcije={
            <Link to="/zaduzenja" className="btn-ghost px-1.5 py-1 text-micro">
              Sva zaduženja <ArrowUpRight size={12} />
            </Link>
          }
        >
          {paznja.length === 0 ? (
            <Prazno naslov="Nijedan rok nije u zoni upozorenja" hint="Svi rokovi su dalje od praga koji je postavio administrator." />
          ) : (
            <ul className="divide-y divide-line">
              {paznja.slice(0, 8).map((z) => {
                const rok = rokZaduzenja(baza, z, sada);
                const zap = nadjiZaposlenog(baza, z.zaposleniId);
                return (
                  <li key={z.id}>
                    <Link to={`/zaduzenja?otvori=${z.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                      <span className="w-24 shrink-0 font-mono text-micro text-ink-faint tnum">{z.broj}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{punoIme(zap)}</span>
                        <span className="block truncate text-micro text-ink-muted">{opisStavki(baza, z)}</span>
                      </span>
                      <span className="hidden shrink-0 text-micro text-ink-faint sm:block">{datum(z.dueAt)}</span>
                      <RokOznaka rok={rok} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Odeljak>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Odeljak naslov="Čeka potpis" nadnaslov="Spremno u magacinu" ravno>
            {presek.cekaPotpis.length === 0 ? (
              <Prazno naslov="Nema pripremljenih zaduženja" />
            ) : (
              <ul className="divide-y divide-line">
                {presek.cekaPotpis.map((z) => (
                  <li key={z.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {punoIme(nadjiZaposlenog(baza, z.zaposleniId))}
                      </span>
                      <span className="block truncate text-micro text-ink-muted">{opisStavki(baza, z)}</span>
                    </span>
                    {smem('zaduzenja.izdaj') && (
                      <Link to={`/zaduzenja?potpis=${z.id}`} className="btn-secondary shrink-0 px-2 py-1 text-micro">
                        <PenLine size={12} /> Potpiši
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Odeljak>

          <Odeljak naslov="Kontrole na redu" nadnaslov="Plan" ravno>
            {presek.kontroleKasne.length === 0 && presek.kontroleNaRedu.length === 0 ? (
              <Prazno naslov="Nema zakazanih kontrola" />
            ) : (
              <ul className="divide-y divide-line">
                {[...presek.kontroleKasne, ...presek.kontroleNaRedu].slice(0, 5).map((k) => {
                  const d = danaDo(k.planiranoZa);
                  const kasni = d !== null && d < 0;
                  return (
                    <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{k.naziv}</span>
                        <span className="block truncate text-micro text-ink-muted">{k.lokacija}</span>
                      </span>
                      <Oznaka ton={kasni ? 'danger' : 'neutral'}>
                        {kasni ? `kasni ${Math.abs(d!)} d` : datum(k.planiranoZa)}
                      </Oznaka>
                    </li>
                  );
                })}
              </ul>
            )}
          </Odeljak>
        </div>

        <Odeljak naslov="Zahtevi za odobrenje" nadnaslov="Odobrilac" ravno>
          {presek.cekaOdobrenje.length === 0 ? (
            <Prazno naslov="Nema zahteva na čekanju" />
          ) : (
            <ul className="divide-y divide-line">
              {presek.cekaOdobrenje.map((z) => (
                <li key={z.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-micro text-ink-faint tnum">{z.broj}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {punoIme(nadjiZaposlenog(baza, z.zaposleniId))}
                    </span>
                    <span className="block truncate text-micro text-ink-muted">{opisStavki(baza, z)}</span>
                  </span>
                  <span className="shrink-0 text-micro text-ink-faint">
                    podneo {nadjiNalog(baza, z.izdaoId)?.fullName ?? '—'} · {relativno(z.createdAt)}
                  </span>
                  <Link to="/odobrenja" className="btn-secondary shrink-0 px-2 py-1 text-micro">
                    Otvori
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Odeljak>
      </SaDosijeom>
    </>
  );
}

function Metrika({ label, vrednost, ton }: { label: string; vrednost: number; ton?: 'danger' | 'warn' | 'info' }) {
  const boja =
    ton === 'danger' ? 'text-signal-danger' : ton === 'warn' ? 'text-signal-warn' : ton === 'info' ? 'text-signal-info' : 'text-ink';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-lg font-semibold tnum ${vrednost > 0 ? boja : 'text-ink-faint'}`}>
        {String(vrednost).padStart(2, '0')}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}
