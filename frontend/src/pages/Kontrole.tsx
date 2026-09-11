import { useMemo, useState } from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import { OZNAKA_KONTROLE, nadjiNalog } from '../lib/izbor';
import { danaDo, datum, datumVreme, sadrzi } from '../lib/format';
import type { Kontrola, NalazKontrole, TipKontrole } from '../lib/types';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import {
  Modal, Odeljak, Oznaka, Polje, Prazno, Pretraga, Tabovi, type TonOznake, useToast,
} from '../components/ui';
import { PotpisPad, PrikazPotpisa } from '../components/Potpis';

const TON_NALAZA: Record<NalazKontrole, TonOznake> = {
  uredno: 'ok',
  primedbe: 'warn',
  neispravno: 'danger',
};

const NAZIV_NALAZA: Record<NalazKontrole, string> = {
  uredno: 'Uredno',
  primedbe: 'Sa primedbama',
  neispravno: 'Neispravno',
};

const PITANJA: Record<TipKontrole, string[]> = {
  periodicni: [
    'Oprema je kompletna i u ispravnom stanju',
    'Oznake i atest su čitljivi',
    'Rok upotrebe nije istekao',
    'Evidencija pregleda je vođena uredno',
  ],
  lzo: [
    'Zaposleni nose zaduženu opremu',
    'Oprema odgovara proceni rizika radnog mesta',
    'Oprema je ispravna i čista',
    'Zaposleni su obučeni za korišćenje',
  ],
  radno_mesto: [
    'Zaštitne naprave su na mestu i ispravne',
    'Prolazi i izlazi su prohodni',
    'Osvetljenje i ventilacija su zadovoljavajući',
    'Uputstva za bezbedan rad su istaknuta',
  ],
  obuka: [
    'Zaposleni je prošao teorijski deo obuke',
    'Zaposleni je prošao praktičnu proveru',
    'Evidencija o obuci je potpisana',
    'Zakazana je naredna periodična provera',
  ],
};

export function Kontrole() {
  const { baza, akcije, smem } = useStore();
  const javi = useToast();
  const [tab, setTab] = useState<'plan' | 'sprovedene'>('plan');
  const [pretraga, setPretraga] = useState('');
  const [sprovodjenje, setSprovodjenje] = useState<Kontrola | null>(null);
  const [nova, setNova] = useState(false);

  const filtrirane = useMemo(
    () =>
      baza.kontrole.filter(
        (k) => !pretraga || sadrzi(k.naziv, pretraga) || sadrzi(k.predmet, pretraga) || sadrzi(k.lokacija, pretraga),
      ),
    [baza.kontrole, pretraga],
  );

  const plan = filtrirane
    .filter((k) => !k.izvrsenoAt)
    .sort((a, b) => new Date(a.planiranoZa).getTime() - new Date(b.planiranoZa).getTime());
  const sprovedene = filtrirane
    .filter((k) => k.izvrsenoAt)
    .sort((a, b) => new Date(b.izvrsenoAt!).getTime() - new Date(a.izvrsenoAt!).getTime());

  return (
    <>
      <Zaglavlje
        nadnaslov="Nadzor"
        naslov="Kontrole i provere"
        opis="Periodični pregledi opreme, kontrola nošenja LZO, pregledi radnih mesta i provere obučenosti."
        akcije={
          smem('kontrole.sprovedi') && (
            <button className="btn-accent" onClick={() => setNova(true)}>
              <Plus size={15} /> Zakaži kontrolu
            </button>
          )
        }
        meta={
          <>
            <Metrika label="U planu" vrednost={baza.kontrole.filter((k) => !k.izvrsenoAt).length} />
            <Metrika
              label="Kasni"
              vrednost={baza.kontrole.filter((k) => !k.izvrsenoAt && new Date(k.planiranoZa).getTime() < Date.now()).length}
              ton="danger"
            />
            <Metrika label="Sa primedbama" vrednost={baza.kontrole.filter((k) => k.nalaz === 'primedbe').length} ton="warn" />
            <Metrika label="Neispravno" vrednost={baza.kontrole.filter((k) => k.nalaz === 'neispravno').length} ton="danger" />
          </>
        }
      />

      <SaDosijeom
        dosije={
          <>
            <Odeljak naslov="Otvorene primedbe" nadnaslov="Mere" ravno>
              {baza.kontrole.filter((k) => k.nalaz && k.nalaz !== 'uredno').length === 0 ? (
                <Prazno naslov="Nema otvorenih primedbi" />
              ) : (
                <ul className="divide-y divide-line">
                  {baza.kontrole
                    .filter((k) => k.nalaz && k.nalaz !== 'uredno')
                    .map((k) => (
                      <li key={k.id} className="px-4 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-micro font-medium">{k.naziv}</span>
                          <Oznaka ton={TON_NALAZA[k.nalaz!]}>{NAZIV_NALAZA[k.nalaz!]}</Oznaka>
                        </div>
                        <div className="text-micro text-ink-muted">
                          {k.stavke.filter((s) => s.ok === false).length} stavki sa primedbom
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Odeljak>

            <Odeljak naslov="Vrste kontrola" nadnaslov="Raspodela" ravno>
              <dl className="divide-y divide-line">
                {(Object.keys(OZNAKA_KONTROLE) as TipKontrole[]).map((t) => (
                  <div key={t} className="flex items-center justify-between gap-3 px-4 py-2">
                    <dt className="text-micro text-ink-muted">{OZNAKA_KONTROLE[t]}</dt>
                    <dd className="font-mono text-sm font-semibold tnum">
                      {baza.kontrole.filter((k) => k.tip === t).length}
                    </dd>
                  </div>
                ))}
              </dl>
            </Odeljak>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Tabovi
            vrednost={tab}
            onChange={setTab}
            stavke={[
              { id: 'plan' as const, label: 'Plan', broj: plan.length },
              { id: 'sprovedene' as const, label: 'Sprovedene', broj: sprovedene.length },
            ]}
          />
          <div className="ml-auto">
            <Pretraga value={pretraga} onChange={setPretraga} placeholder="Naziv, predmet, lokacija…" sirina="w-56" />
          </div>
        </div>

        {tab === 'plan' ? (
          <div className="panel overflow-hidden">
            {plan.length === 0 ? (
              <Prazno naslov="Nema zakazanih kontrola" />
            ) : (
              <ul className="divide-y divide-line">
                {plan.map((k) => {
                  const d = danaDo(k.planiranoZa);
                  const kasni = d !== null && d < 0;
                  return (
                    <li key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="w-24 shrink-0 font-mono text-micro text-ink-faint tnum">{k.broj}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{k.naziv}</span>
                        <span className="block truncate text-micro text-ink-muted">
                          {OZNAKA_KONTROLE[k.tip]} · {k.predmet} · {k.lokacija}
                        </span>
                      </span>
                      <span className="shrink-0 text-micro text-ink-muted">
                        {nadjiNalog(baza, k.zaduzenId)?.fullName ?? '—'}
                      </span>
                      <Oznaka ton={kasni ? 'danger' : 'neutral'}>
                        {kasni ? `kasni ${Math.abs(d!)} d` : datum(k.planiranoZa)}
                      </Oznaka>
                      {smem('kontrole.sprovedi') && (
                        <button className="btn-secondary shrink-0 px-2 py-1 text-micro" onClick={() => setSprovodjenje(k)}>
                          <ClipboardCheck size={12} /> Sprovedi
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
            {sprovedene.length === 0 ? (
              <div className="panel">
                <Prazno naslov="Nema sprovedenih kontrola" />
              </div>
            ) : (
              sprovedene.map((k) => (
                <Odeljak
                  key={k.id}
                  nadnaslov={`${k.broj} · ${OZNAKA_KONTROLE[k.tip]} · ${datumVreme(k.izvrsenoAt)}`}
                  naslov={k.naziv}
                  akcije={k.nalaz ? <Oznaka ton={TON_NALAZA[k.nalaz]}>{NAZIV_NALAZA[k.nalaz]}</Oznaka> : null}
                >
                  <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                    <ul className="divide-y divide-line border-y border-line">
                      {k.stavke.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 py-2">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-card text-eyebrow font-semibold ${
                              s.ok === true
                                ? 'bg-signal-okBg text-signal-ok'
                                : s.ok === false
                                  ? 'bg-signal-dangerBg text-signal-danger'
                                  : 'bg-surface-deep text-ink-faint'
                            }`}
                          >
                            {s.ok === true ? '✓' : s.ok === false ? '✕' : '–'}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm">{s.pitanje}</span>
                            {s.napomena && <span className="block text-micro text-signal-warn">{s.napomena}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-3">
                      <div className="text-micro text-ink-muted">
                        Predmet: <span className="text-ink">{k.predmet}</span>
                        <br />
                        Lokacija: <span className="text-ink">{k.lokacija}</span>
                      </div>
                      <PrikazPotpisa
                        potpis={k.potpis}
                        ime={nadjiNalog(baza, k.zaduzenId)?.fullName ?? '—'}
                        uloga="Kontrolor"
                        vreme={datumVreme(k.izvrsenoAt)}
                        visina="h-12"
                      />
                      {k.napomena && <p className="text-micro text-signal-warn">{k.napomena}</p>}
                    </div>
                  </div>
                </Odeljak>
              ))
            )}
          </div>
        )}
      </SaDosijeom>

      <DijalogSprovodjenja
        kontrola={sprovodjenje}
        onClose={() => setSprovodjenje(null)}
        onGotovo={(id, podaci) => {
          akcije.zakljuciKontrolu(id, podaci);
          javi('Kontrola je zaključena i upisana u evidenciju.');
          setSprovodjenje(null);
        }}
      />

      <NovaKontrola open={nova} onClose={() => setNova(false)} />
    </>
  );
}

function Metrika({ label, vrednost, ton }: { label: string; vrednost: number; ton?: 'danger' | 'warn' }) {
  const boja = ton === 'danger' ? 'text-signal-danger' : ton === 'warn' ? 'text-signal-warn' : 'text-ink';
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-mono text-lg font-semibold tnum ${vrednost > 0 ? boja : 'text-ink-faint'}`}>
        {String(vrednost).padStart(2, '0')}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function DijalogSprovodjenja({
  kontrola, onClose, onGotovo,
}: {
  kontrola: Kontrola | null;
  onClose: () => void;
  onGotovo: (id: string, podaci: { stavke: Kontrola['stavke']; nalaz: NalazKontrole; napomena: string; potpis: string | null }) => void;
}) {
  const { ja } = useStore();
  const [stavke, setStavke] = useState<Kontrola['stavke']>([]);
  const [napomena, setNapomena] = useState('');
  const [potpis, setPotpis] = useState<string | null>(null);
  const [kljuc, setKljuc] = useState('');

  if (!kontrola) return null;

  // Prvi otvor kontrole puni listu pitanja.
  if (kljuc !== kontrola.id) {
    setKljuc(kontrola.id);
    setStavke(kontrola.stavke.map((s) => ({ ...s, ok: null })));
    setNapomena('');
    setPotpis(null);
  }

  const nalaz: NalazKontrole = stavke.some((s) => s.ok === false && s.napomena.toLowerCase().includes('zaustav'))
    ? 'neispravno'
    : stavke.some((s) => s.ok === false)
      ? 'primedbe'
      : 'uredno';
  const sveOdgovoreno = stavke.every((s) => s.ok !== null);

  return (
    <Modal
      open
      onClose={onClose}
      naslov={`${kontrola.naziv}`}
      opis={`${OZNAKA_KONTROLE[kontrola.tip]} · ${kontrola.predmet} · ${kontrola.lokacija}`}
      sirina="max-w-3xl"
      podnozje={
        <>
          <span className="mr-auto flex items-center gap-2">
            <span className="eyebrow">Nalaz</span>
            <Oznaka ton={TON_NALAZA[nalaz]}>{NAZIV_NALAZA[nalaz]}</Oznaka>
          </span>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button
            className="btn-primary"
            disabled={!sveOdgovoreno || !(potpis ?? ja?.potpis)}
            onClick={() => onGotovo(kontrola.id, { stavke, nalaz, napomena, potpis: potpis ?? ja?.potpis ?? null })}
          >
            Zaključi kontrolu
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <ul className="divide-y divide-line border-y border-line">
          {stavke.map((s, i) => (
            <li key={i} className="py-2.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm">{s.pitanje}</span>
                <span className="flex shrink-0 gap-1">
                  {[
                    [true, 'DA'],
                    [false, 'NE'],
                  ].map(([v, l]) => (
                    <button
                      key={String(v)}
                      onClick={() => setStavke((p) => p.map((x, j) => (j === i ? { ...x, ok: v as boolean } : x)))}
                      className={`rounded-card px-2 py-0.5 font-mono text-eyebrow font-semibold transition-colors ${
                        s.ok === v
                          ? v
                            ? 'bg-signal-ok text-paper'
                            : 'bg-signal-danger text-paper'
                          : 'bg-surface-deep text-ink-muted hover:bg-line'
                      }`}
                    >
                      {l as string}
                    </button>
                  ))}
                </span>
              </div>
              {s.ok === false && (
                <input
                  className="input mt-1.5 py-1 text-micro"
                  placeholder="Primedba i mera…"
                  value={s.napomena}
                  onChange={(e) => setStavke((p) => p.map((x, j) => (j === i ? { ...x, napomena: e.target.value } : x)))}
                />
              )}
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          <Polje label="Napomena kontrolora">
            <textarea className="input min-h-[70px]" value={napomena} onChange={(e) => setNapomena(e.target.value)} />
          </Polje>
          {ja?.potpis && !potpis ? (
            <div>
              <span className="label">Potpis kontrolora</span>
              <div className="flex h-[92px] items-end rounded-card border border-line-strong bg-surface px-4 pb-2">
                <img src={ja.potpis} alt="Sačuvani potpis" className="max-h-full object-contain object-left-bottom" />
              </div>
              <button className="btn-ghost mt-1 px-1.5 py-1 text-micro" onClick={() => setPotpis('')}>
                Potpiši ručno
              </button>
            </div>
          ) : (
            <PotpisPad label={`Potpis — ${ja?.fullName ?? ''}`} visina={100} onChange={setPotpis} />
          )}
        </div>
      </div>
    </Modal>
  );
}

function NovaKontrola({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [naziv, setNaziv] = useState('');
  const [tip, setTip] = useState<TipKontrole>('periodicni');
  const [predmet, setPredmet] = useState('');
  const [lokacija, setLokacija] = useState('Hala 1');
  const [datumPlana, setDatumPlana] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [zaduzen, setZaduzen] = useState(ja?.id ?? '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov="Zakazivanje kontrole"
      opis="Lista provere se popunjava prema vrsti kontrole."
      sirina="max-w-xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button
            className="btn-primary"
            disabled={!naziv.trim() || !predmet.trim()}
            onClick={() => {
              akcije.dodajKontrolu({
                naziv,
                tip,
                predmet,
                lokacija,
                zaduzenId: zaduzen || ja?.id || '',
                planiranoZa: new Date(datumPlana).toISOString(),
                izvrsenoAt: null,
                nalaz: null,
                stavke: PITANJA[tip].map((p) => ({ pitanje: p, ok: null, napomena: '' })),
                potpis: null,
                napomena: '',
              });
              javi('Kontrola je zakazana.');
              setNaziv('');
              setPredmet('');
              onClose();
            }}
          >
            Zakaži
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Polje label="Naziv kontrole">
            <input className="input" value={naziv} onChange={(e) => setNaziv(e.target.value)} autoFocus />
          </Polje>
        </div>
        <Polje label="Vrsta" hint={`${PITANJA[tip].length} pitanja u listi provere`}>
          <select className="input" value={tip} onChange={(e) => setTip(e.target.value as TipKontrole)}>
            {(Object.keys(OZNAKA_KONTROLE) as TipKontrole[]).map((t) => (
              <option key={t} value={t}>{OZNAKA_KONTROLE[t]}</option>
            ))}
          </select>
        </Polje>
        <Polje label="Predmet kontrole">
          <input className="input" value={predmet} onChange={(e) => setPredmet(e.target.value)} placeholder="Oprema, mašina, grupa zaposlenih…" />
        </Polje>
        <Polje label="Lokacija">
          <input className="input" value={lokacija} onChange={(e) => setLokacija(e.target.value)} />
        </Polje>
        <Polje label="Planirano za">
          <input type="date" className="input font-mono" value={datumPlana} onChange={(e) => setDatumPlana(e.target.value)} />
        </Polje>
        <div className="sm:col-span-2">
          <Polje label="Zadužen">
            <select className="input" value={zaduzen} onChange={(e) => setZaduzen(e.target.value)}>
              {baza.nalozi.filter((n) => n.aktivan).map((n) => (
                <option key={n.id} value={n.id}>{n.fullName}</option>
              ))}
            </select>
          </Polje>
        </div>
      </div>
    </Modal>
  );
}
