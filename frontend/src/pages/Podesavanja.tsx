import { Fragment, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useStore } from '../lib/store';
import { PRAVA, ULOGE } from '../lib/permissions';
import type { Permission, Role } from '../lib/types';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import { Odeljak, Polje, Potvrda, Prekidac, Tabovi, useToast } from '../components/ui';

export function Podesavanja() {
  const { baza, akcije } = useStore();
  const javi = useToast();
  const p = baza.podesavanja;
  const [tab, setTab] = useState<'rokovi' | 'potpisi' | 'posta' | 'firma' | 'uloge'>('rokovi');
  const [reset, setReset] = useState(false);

  return (
    <>
      <Zaglavlje
        nadnaslov="Administracija"
        naslov="Podešavanja portala"
        opis="Pragovi upozorenja, obaveznost potpisa, e-pošta, podaci firme i prava po ulogama."
        akcije={
          <button className="btn-secondary" onClick={() => setReset(true)}>
            <RotateCcw size={15} /> Vrati demo podatke
          </button>
        }
      />

      <SaDosijeom
        dosije={
          <Odeljak naslov="Kako rok radi" nadnaslov="Objašnjenje">
            <ol className="space-y-2 text-micro text-ink-muted">
              <li>
                <span className="font-medium text-ink">1.</span> Uslužilac napravi zaduženje i izabere rok
                (predlog stiže iz kategorije opreme).
              </li>
              <li>
                <span className="font-medium text-ink">2.</span> Iskoči pop-up za potpis; zaposleni se potpisuje,
                uslužilac overava.
              </li>
              <li>
                <span className="font-medium text-ink">3.</span> Od tog trenutka teče odbrojavanje —
                ne od datuma kreiranja.
              </li>
              <li>
                <span className="font-medium text-ink">4.</span> Na <span className="font-mono">{p.rokovi.upozorenjeDana} dana</span>{' '}
                pre isteka pali se upozorenje, na <span className="font-mono">{p.rokovi.kriticnoDana}</span> kritično stanje.
              </li>
              <li>
                <span className="font-medium text-ink">5.</span> Posle isteka zaduženje stoji označeno kao probijeno
                sve dok se ne razduži ili produži.
              </li>
            </ol>
          </Odeljak>
        }
      >
        <Tabovi
          vrednost={tab}
          onChange={setTab}
          stavke={[
            { id: 'rokovi' as const, label: 'Rokovi' },
            { id: 'potpisi' as const, label: 'Potpisi' },
            { id: 'posta' as const, label: 'E-pošta' },
            { id: 'firma' as const, label: 'Firma' },
            { id: 'uloge' as const, label: 'Prava uloga' },
          ]}
        />

        {tab === 'rokovi' && (
          <Odeljak naslov="Pragovi upozorenja" nadnaslov="Rokovi zaduženja">
            <div className="grid gap-4 sm:grid-cols-2">
              <Polje label="Upozorenje (dana pre isteka)" hint="Zaduženje dobija žutu oznaku i ulazi u traku stanja.">
                <input
                  type="number"
                  min={1}
                  className="input font-mono tnum"
                  value={p.rokovi.upozorenjeDana}
                  onChange={(e) =>
                    akcije.izmeniPodesavanja({ rokovi: { ...p.rokovi, upozorenjeDana: Math.max(1, Number(e.target.value)) } })
                  }
                />
              </Polje>
              <Polje label="Kritično (dana pre isteka)" hint="Crvena oznaka i prioritet u pregledu.">
                <input
                  type="number"
                  min={0}
                  className="input font-mono tnum"
                  value={p.rokovi.kriticnoDana}
                  onChange={(e) =>
                    akcije.izmeniPodesavanja({ rokovi: { ...p.rokovi, kriticnoDana: Math.max(0, Number(e.target.value)) } })
                  }
                />
              </Polje>
            </div>
            <div className="mt-2 divide-y divide-line border-t border-line">
              <Prekidac
                ukljucen={p.rokovi.podsetnikMailom}
                onChange={(v) => akcije.izmeniPodesavanja({ rokovi: { ...p.rokovi, podsetnikMailom: v } })}
                label="Podsetnik e-poštom pred istek"
                opis="Šalje se zaposlenom i uslužiocu na dan kada rok uđe u zonu upozorenja."
              />
            </div>
          </Odeljak>
        )}

        {tab === 'potpisi' && (
          <Odeljak naslov="Potpisi i overa" nadnaslov="Dokumenti">
            <div className="divide-y divide-line">
              <Prekidac
                ukljucen={p.potpisi.obavezanPriZaduzenju}
                onChange={(v) => akcije.izmeniPodesavanja({ potpisi: { ...p.potpisi, obavezanPriZaduzenju: v } })}
                label="Potpis je obavezan pri zaduženju"
                opis="Bez oba potpisa zaduženje ne može da se aktivira i rok ne kreće."
              />
              <Prekidac
                ukljucen={p.potpisi.obavezanPriRazduzenju}
                onChange={(v) => akcije.izmeniPodesavanja({ potpisi: { ...p.potpisi, obavezanPriRazduzenju: v } })}
                label="Potpis je obavezan pri razduženju"
                opis="Zaposleni potpisuje povrat, uslužilac overava prijem."
              />
              <Prekidac
                ukljucen={p.potpisi.digitalniPotpisAktivan}
                onChange={(v) => akcije.izmeniPodesavanja({ potpisi: { ...p.potpisi, digitalniPotpisAktivan: v } })}
                label="Digitalni potpis dokumenta"
                opis="Uz rukopisni potpis dokument dobija sertifikat, otisak i vreme overe."
              />
              <Prekidac
                ukljucen={p.potpisi.cuvajOtisak}
                onChange={(v) => akcije.izmeniPodesavanja({ potpisi: { ...p.potpisi, cuvajOtisak: v } })}
                label="Čuvaj otisak u evidenciji"
                opis="Otisak ostaje uz dokument radi kasnije provere izmena."
              />
            </div>
          </Odeljak>
        )}

        {tab === 'posta' && (
          <Odeljak naslov="Slanje e-pošte" nadnaslov="Server">
            <div className="grid gap-4 sm:grid-cols-2">
              <Polje label="Adresa pošiljaoca">
                <input
                  className="input font-mono"
                  value={p.mail.posiljalac}
                  onChange={(e) => akcije.izmeniPodesavanja({ mail: { ...p.mail, posiljalac: e.target.value } })}
                />
              </Polje>
              <Polje label="SMTP server">
                <input
                  className="input font-mono"
                  value={p.mail.smtp}
                  onChange={(e) => akcije.izmeniPodesavanja({ mail: { ...p.mail, smtp: e.target.value } })}
                />
              </Polje>
              <Polje label="Port">
                <input
                  type="number"
                  className="input font-mono tnum"
                  value={p.mail.port}
                  onChange={(e) => akcije.izmeniPodesavanja({ mail: { ...p.mail, port: Number(e.target.value) } })}
                />
              </Polje>
            </div>
            <div className="mt-2 divide-y divide-line border-t border-line">
              <Prekidac
                ukljucen={p.mail.automatskaObavestenja}
                onChange={(v) => akcije.izmeniPodesavanja({ mail: { ...p.mail, automatskaObavestenja: v } })}
                label="Automatska obaveštenja"
                opis="Potvrde o zaduženju, podsetnici i obaveštenja o isteklim rokovima."
              />
              <Prekidac
                ukljucen={p.mail.kopijaBzrLicu}
                onChange={(v) => akcije.izmeniPodesavanja({ mail: { ...p.mail, kopijaBzrLicu: v } })}
                label="Kopija licu za bezbednost i zdravlje na radu"
                opis={`Sve poruke idu i na adresu lica: ${p.firma.liceZaBzr}.`}
              />
            </div>
          </Odeljak>
        )}

        {tab === 'firma' && (
          <Odeljak naslov="Podaci poslodavca" nadnaslov="Zaglavlje obrazaca">
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ['naziv', 'Naziv firme'],
                ['pib', 'PIB'],
                ['maticni', 'Matični broj'],
                ['adresa', 'Adresa'],
                ['liceZaBzr', 'Lice za bezbednost i zdravlje na radu'],
                ['licenca', 'Broj licence'],
              ] as const).map(([kljuc, label]) => (
                <Polje key={kljuc} label={label}>
                  <input
                    className={`input ${['pib', 'maticni', 'licenca'].includes(kljuc) ? 'font-mono tnum' : ''}`}
                    value={p.firma[kljuc]}
                    onChange={(e) => akcije.izmeniPodesavanja({ firma: { ...p.firma, [kljuc]: e.target.value } })}
                  />
                </Polje>
              ))}
            </div>
          </Odeljak>
        )}

        {tab === 'uloge' && (
          <Odeljak
            naslov="Matrica prava po ulogama"
            nadnaslov="Fabrička prava"
            ravno
          >
            <p className="border-b border-line px-4 py-2.5 text-micro text-ink-muted">
              Ovde se menja šta uloga podrazumevano sme. Pojedinačni izuzeci po nalogu podešavaju se u
              odeljku „Nalozi i prava" i jači su od ove matrice.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-surface">
                  <tr>
                    <th className="th">Pravo</th>
                    {(Object.keys(ULOGE) as Role[]).map((u) => (
                      <th key={u} className="th w-32 text-center">{ULOGE[u].kratko}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRAVA.map((g) => (
                    <Fragment key={g.grupa}>
                      <tr className="border-t border-line bg-surface">
                        <td className="px-3 py-1.5 eyebrow" colSpan={4}>{g.grupa}</td>
                      </tr>
                      {g.stavke.map((s) => (
                        <tr key={s.id} className="row">
                          <td className="td">{s.naziv}</td>
                          {(Object.keys(ULOGE) as Role[]).map((u) => {
                            const ukljuceno = (baza.pravaUloga[u] ?? []).includes(s.id as Permission);
                            return (
                              <td key={u} className="td text-center">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 accent-[#D2650B]"
                                  checked={ukljuceno}
                                  disabled={u === 'admin'}
                                  onChange={(e) => akcije.postaviPravoUloge(u, s.id as Permission, e.target.checked)}
                                  aria-label={`${s.naziv} — ${ULOGE[u].naziv}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Odeljak>
        )}
      </SaDosijeom>

      <Potvrda
        open={reset}
        naslov="Vraćanje demo podataka"
        tekst="Sve izmene napravljene u pregledaču se brišu i vraća se početni demo skup podataka."
        potvrdiTekst="Vrati demo"
        opasno
        onClose={() => setReset(false)}
        onPotvrdi={() => {
          akcije.resetDemo();
          javi('Demo podaci su vraćeni na početno stanje.', 'info');
        }}
      />
    </>
  );
}
