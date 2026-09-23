import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '../lib/store';
import { punoIme, vidljivaPosta, vidljiviZaposleni } from '../lib/izbor';
import { datumVreme, relativno, sadrzi } from '../lib/format';
import type { Mail, StatusMaila } from '../lib/types';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import {
  Modal, Odeljak, Oznaka, Polje, Prazno, Pretraga, Prekidac, Tabovi, type TonOznake, useToast,
} from '../components/ui';

const TON_STATUSA: Record<StatusMaila, TonOznake> = {
  poslato: 'ok',
  u_redu: 'info',
  greska: 'danger',
};

const NAZIV_STATUSA: Record<StatusMaila, string> = {
  poslato: 'Poslato',
  u_redu: 'U redu za slanje',
  greska: 'Greška pri slanju',
};

export function Posta() {
  const { baza, akcije, ja, smem } = useStore();
  const javi = useToast();
  const [tab, setTab] = useState<'poslato' | 'sabloni'>('poslato');
  const [pretraga, setPretraga] = useState('');
  const [otvoren, setOtvoren] = useState<Mail | null>(null);
  const [novaPoruka, setNovaPoruka] = useState(false);

  // Pošta se vidi samo za zaposlene iz sektora u nadležnosti naloga.
  const lista = useMemo(
    () =>
      vidljivaPosta(baza, ja).filter(
        (m) => !pretraga || sadrzi(m.tema, pretraga) || sadrzi(m.zaIme, pretraga) || sadrzi(m.za, pretraga),
      ),
    [baza, ja, pretraga],
  );

  return (
    <>
      <Zaglavlje
        nadnaslov="Obaveštenja"
        naslov="Pošta i podsetnici"
        opis="Potvrde o zaduženju, podsetnici pred istek roka i obaveštenja o probijenim rokovima."
        akcije={
          smem('mail.posalji') && (
            <button className="btn-accent" onClick={() => setNovaPoruka(true)}>
              <Send size={15} /> Nova poruka
            </button>
          )
        }
        meta={
          <>
            <span className="eyebrow">Pošiljalac</span>
            <span className="font-mono text-micro">{baza.podesavanja.mail.posiljalac}</span>
            <span className="eyebrow">SMTP</span>
            <span className="font-mono text-micro">
              {baza.podesavanja.mail.smtp}:{baza.podesavanja.mail.port}
            </span>
            <Oznaka ton={baza.podesavanja.mail.automatskaObavestenja ? 'ok' : 'neutral'}>
              {baza.podesavanja.mail.automatskaObavestenja ? 'automatska obaveštenja uključena' : 'automatika isključena'}
            </Oznaka>
          </>
        }
      />

      <SaDosijeom
        dosije={
          <>
            <Odeljak naslov="Status slanja" nadnaslov="Presek" ravno>
              <dl className="divide-y divide-line">
                {(Object.keys(NAZIV_STATUSA) as StatusMaila[]).map((s) => (
                  <div key={s} className="flex items-center justify-between gap-3 px-4 py-2">
                    <dt className="text-micro text-ink-muted">{NAZIV_STATUSA[s]}</dt>
                    <dd className="font-mono text-sm font-semibold tnum">
                      {vidljivaPosta(baza, ja).filter((m) => m.status === s).length}
                    </dd>
                  </div>
                ))}
              </dl>
            </Odeljak>

            <Odeljak naslov="Okidači" nadnaslov="Kada se šalje" ravno>
              <ul className="divide-y divide-line">
                {baza.sabloni.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-micro font-medium">{s.naziv}</span>
                      <span className="block truncate text-eyebrow uppercase text-ink-faint">{s.okidac}</span>
                    </span>
                    <Oznaka ton={s.aktivan ? 'ok' : 'neutral'}>{s.aktivan ? 'uklj.' : 'isklj.'}</Oznaka>
                  </li>
                ))}
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
              { id: 'poslato' as const, label: 'Poslato', broj: baza.mailovi.length },
              { id: 'sabloni' as const, label: 'Šabloni', broj: baza.sabloni.length },
            ]}
          />
          {tab === 'poslato' && (
            <div className="ml-auto">
              <Pretraga value={pretraga} onChange={setPretraga} placeholder="Tema ili primalac…" sirina="w-56" />
            </div>
          )}
        </div>

        {tab === 'poslato' ? (
          <div className="panel overflow-hidden">
            {lista.length === 0 ? (
              <Prazno naslov="Nema poruka" />
            ) : (
              <ul className="divide-y divide-line">
                {lista.map((m) => (
                  <li key={m.id}>
                    <button onClick={() => setOtvoren(m)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface">
                      <span className="w-40 shrink-0">
                        <span className="block truncate text-sm font-medium">{m.zaIme}</span>
                        <span className="block truncate font-mono text-eyebrow text-ink-faint">{m.za}</span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{m.tema}</span>
                      <span className="shrink-0 font-mono text-eyebrow text-ink-faint">{relativno(m.createdAt)}</span>
                      <Oznaka ton={TON_STATUSA[m.status]}>{NAZIV_STATUSA[m.status]}</Oznaka>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {baza.sabloni.map((s) => (
              <Odeljak
                key={s.id}
                nadnaslov={`Okidač: ${s.okidac}`}
                naslov={s.naziv}
                akcije={
                  <Prekidac
                    ukljucen={s.aktivan}
                    onChange={(v) => {
                      akcije.izmeniSablon(s.id, { aktivan: v });
                      javi(v ? 'Šablon je uključen.' : 'Šablon je isključen.');
                    }}
                    label="Aktivan"
                    disabled={!smem('podesavanja.upravljaj')}
                  />
                }
              >
                <div className="space-y-2">
                  <Polje label="Tema">
                    <input
                      className="input font-mono text-micro"
                      value={s.tema}
                      readOnly={!smem('podesavanja.upravljaj')}
                      onChange={(e) => akcije.izmeniSablon(s.id, { tema: e.target.value })}
                    />
                  </Polje>
                  <Polje label="Telo poruke" hint="Polja u {{ }} popunjava sistem pri slanju.">
                    <textarea
                      className="input min-h-[120px] font-mono text-micro"
                      value={s.telo}
                      readOnly={!smem('podesavanja.upravljaj')}
                      onChange={(e) => akcije.izmeniSablon(s.id, { telo: e.target.value })}
                    />
                  </Polje>
                </div>
              </Odeljak>
            ))}
          </div>
        )}
      </SaDosijeom>

      <Modal
        open={Boolean(otvoren)}
        onClose={() => setOtvoren(null)}
        naslov={otvoren?.tema ?? ''}
        opis={otvoren ? `${otvoren.zaIme} <${otvoren.za}> · ${datumVreme(otvoren.createdAt)}` : undefined}
        sirina="max-w-2xl"
        podnozje={<button className="btn-secondary" onClick={() => setOtvoren(null)}>Zatvori</button>}
      >
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{otvoren?.telo}</pre>
      </Modal>

      <NovaPoruka open={novaPoruka} onClose={() => setNovaPoruka(false)} />
    </>
  );
}

function NovaPoruka({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [primalac, setPrimalac] = useState('');
  const [sablonId, setSablonId] = useState('');
  const [tema, setTema] = useState('');
  const [telo, setTelo] = useState('');

  const zaposleni = baza.zaposleni.find((z) => z.id === primalac);

  function primeniSablon(id: string) {
    setSablonId(id);
    const s = baza.sabloni.find((x) => x.id === id);
    if (!s) return;
    setTema(s.tema.replace('{{broj}}', 'ZAD-2026-XXXX'));
    setTelo(
      s.telo
        .replace('{{zaposleni}}', zaposleni ? punoIme(zaposleni) : '{{zaposleni}}')
        .replace('{{firma}}', baza.podesavanja.firma.naziv),
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      naslov="Nova poruka"
      opis="Demo slanje — poruka se upisuje u evidenciju pošte."
      sirina="max-w-2xl"
      podnozje={
        <>
          <button className="btn-secondary" onClick={onClose}>Odustani</button>
          <button
            className="btn-accent"
            disabled={!zaposleni || !tema.trim()}
            onClick={() => {
              akcije.posaljiMail({
                za: zaposleni!.email,
                zaIme: punoIme(zaposleni),
                tema,
                telo,
                sablonId: sablonId || null,
                vezano: null,
              });
              javi(`Poruka je poslata na ${zaposleni!.email}.`);
              setTema('');
              setTelo('');
              setPrimalac('');
              onClose();
            }}
          >
            <Send size={15} /> Pošalji
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Polje label="Primalac">
            <select className="input" value={primalac} onChange={(e) => setPrimalac(e.target.value)}>
              <option value="">— izaberite zaposlenog —</option>
              {vidljiviZaposleni(baza, ja).map((z) => (
                <option key={z.id} value={z.id}>{punoIme(z)}</option>
              ))}
            </select>
          </Polje>
          <Polje label="Šablon">
            <select className="input" value={sablonId} onChange={(e) => primeniSablon(e.target.value)}>
              <option value="">— bez šablona —</option>
              {baza.sabloni.map((s) => (
                <option key={s.id} value={s.id}>{s.naziv}</option>
              ))}
            </select>
          </Polje>
        </div>
        <Polje label="Tema">
          <input className="input" value={tema} onChange={(e) => setTema(e.target.value)} />
        </Polje>
        <Polje label="Poruka">
          <textarea className="input min-h-[150px]" value={telo} onChange={(e) => setTelo(e.target.value)} />
        </Polje>
      </div>
    </Modal>
  );
}
