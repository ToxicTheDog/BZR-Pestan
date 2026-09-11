import { useState } from 'react';
import { useStore } from '../lib/store';
import { PRAVA, ULOGE, imaPravo } from '../lib/permissions';
import { datumVreme, otisak } from '../lib/format';
import { Zaglavlje, SaDosijeom } from '../components/Shell';
import { Odeljak, Oznaka, Podatak, Polje, useToast } from '../components/ui';
import { PotpisPad } from '../components/Potpis';

export function MojNalog() {
  const { baza, akcije, ja } = useStore();
  const javi = useToast();
  const [noviPotpis, setNoviPotpis] = useState<string | null>(null);
  const [menjaPotpis, setMenjaPotpis] = useState(false);
  const [stara, setStara] = useState('');
  const [nova, setNova] = useState('');
  const [ponovo, setPonovo] = useState('');

  if (!ja) return null;

  return (
    <>
      <Zaglavlje
        nadnaslov={ULOGE[ja.role].naziv}
        naslov={ja.fullName}
        opis="Vaš potpis, sertifikat i prava koja imate na portalu."
        meta={
          <>
            <span className="font-mono text-micro">{ja.username}</span>
            <span className="font-mono text-micro text-ink-muted">{ja.email}</span>
            <Oznaka ton={ja.aktivan ? 'ok' : 'neutral'}>{ja.aktivan ? 'aktivan' : 'isključen'}</Oznaka>
          </>
        }
      />

      <SaDosijeom
        dosije={
          <>
            <Odeljak naslov="Nalog" nadnaslov="Podaci" ravno>
              <div className="space-y-3 px-4 py-3">
                <Podatak label="Uloga">{ULOGE[ja.role].naziv}</Podatak>
                <Podatak label="Telefon" mono>{ja.telefon || '—'}</Podatak>
                <Podatak label="Nalog kreiran" mono>{datumVreme(ja.createdAt)}</Podatak>
                <Podatak label="Poslednja prijava" mono>{datumVreme(ja.lastLoginAt)}</Podatak>
                <Podatak label="Sertifikat" mono>{ja.sertifikat ?? 'nije izdat'}</Podatak>
                {ja.sertifikat && (
                  <Podatak label="Otisak sertifikata" mono>{otisak(ja.sertifikat)}</Podatak>
                )}
              </div>
            </Odeljak>

            <Odeljak naslov="Promena lozinke" nadnaslov="Bezbednost">
              <div className="space-y-3">
                <Polje label="Trenutna lozinka">
                  <input type="password" className="input" value={stara} onChange={(e) => setStara(e.target.value)} />
                </Polje>
                <Polje label="Nova lozinka" hint="Najmanje 8 znakova.">
                  <input type="password" className="input" value={nova} onChange={(e) => setNova(e.target.value)} />
                </Polje>
                <Polje label="Ponovite novu lozinku" greska={ponovo && nova !== ponovo ? 'Lozinke se ne poklapaju.' : null}>
                  <input type="password" className="input" value={ponovo} onChange={(e) => setPonovo(e.target.value)} />
                </Polje>
                <button
                  className="btn-primary w-full"
                  disabled={!stara || nova.length < 8 || nova !== ponovo}
                  onClick={() => {
                    akcije.izmeniNalog(ja.id, { mustChangePassword: false });
                    akcije.upisiLog('Promena lozinke', `Nalog ${ja.username}`, 'Korisnik je promenio svoju lozinku.');
                    javi('Lozinka je promenjena.');
                    setStara('');
                    setNova('');
                    setPonovo('');
                  }}
                >
                  Promeni lozinku
                </button>
              </div>
            </Odeljak>
          </>
        }
      >
        <Odeljak
          naslov="Moj potpis"
          nadnaslov="Koristi se pri overi zaduženja, razduženja i kontrola"
          akcije={
            ja.potpis && !menjaPotpis ? (
              <button className="btn-secondary px-2 py-1 text-micro" onClick={() => setMenjaPotpis(true)}>
                Promeni potpis
              </button>
            ) : null
          }
        >
          {ja.potpis && !menjaPotpis ? (
            <div className="flex items-end gap-6">
              <div className="flex h-24 flex-1 items-end border-b border-ink/70 px-2">
                <img src={ja.potpis} alt="Moj potpis" className="max-h-full object-contain object-left-bottom" />
              </div>
              <p className="max-w-xs text-micro text-ink-muted">
                Ovaj potpis se automatski nudi kad potpisujete zaduženje ili zaključujete kontrolu.
                Uvek možete da se potpišete ručno umesto njega.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <PotpisPad label="Nacrtajte svoj potpis" visina={170} onChange={setNoviPotpis} />
              <div className="flex justify-end gap-2">
                {ja.potpis && (
                  <button className="btn-secondary" onClick={() => { setMenjaPotpis(false); setNoviPotpis(null); }}>
                    Odustani
                  </button>
                )}
                <button
                  className="btn-primary"
                  disabled={!noviPotpis}
                  onClick={() => {
                    akcije.izmeniNalog(ja.id, {
                      potpis: noviPotpis,
                      sertifikat: ja.sertifikat ?? `PEST-CA-${ja.id.slice(-4).toUpperCase()}`,
                    });
                    javi('Potpis je sačuvan.');
                    setMenjaPotpis(false);
                    setNoviPotpis(null);
                  }}
                >
                  Sačuvaj potpis
                </button>
              </div>
            </div>
          )}
        </Odeljak>

        <Odeljak naslov="Moja prava" nadnaslov="Iz uloge i pojedinačnih izuzetaka" ravno>
          <div className="divide-y divide-line">
            {PRAVA.map((g) => (
              <div key={g.grupa} className="px-4 py-3">
                <div className="eyebrow mb-1.5">{g.grupa}</div>
                <ul className="flex flex-wrap gap-1.5">
                  {g.stavke.map((s) => {
                    const sme = imaPravo(ja, s.id, baza.pravaUloga);
                    const izuzetak = ja.izuzeci[s.id] !== undefined;
                    return (
                      <li key={s.id}>
                        <span
                          className={`chip ${
                            sme ? 'bg-signal-okBg text-signal-ok' : 'bg-surface-deep text-ink-faint line-through'
                          }`}
                        >
                          {s.naziv}
                          {izuzetak && <span className="ml-1 text-safety-600">•</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <p className="border-t border-line px-4 py-2 text-micro text-ink-faint">
            <span className="text-safety-600">•</span> označava pravo koje vam je administrator posebno dao ili oduzeo.
          </p>
        </Odeljak>
      </SaDosijeom>
    </>
  );
}
