import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { datumVreme, relativno, sadrzi } from '../lib/format';
import { Zaglavlje } from '../components/Shell';
import { Brojac, Prazno, Pretraga } from '../components/ui';

export function Logovi() {
  const { baza } = useStore();
  const [pretraga, setPretraga] = useState('');

  const lista = useMemo(
    () =>
      baza.logovi.filter(
        (l) => !pretraga || sadrzi(l.akcija, pretraga) || sadrzi(l.ko, pretraga) || sadrzi(l.entitet, pretraga) || sadrzi(l.detalj, pretraga),
      ),
    [baza.logovi, pretraga],
  );

  return (
    <>
      <Zaglavlje
        nadnaslov="Administracija"
        naslov="Dnevnik rada"
        opis="Ko je šta uradio i kada — potpisi, odobrenja, izmene prava i konfiguracije."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pretraga value={pretraga} onChange={setPretraga} placeholder="Akcija, korisnik, dokument…" />
        <span className="ml-auto">
          <Brojac prikazano={lista.length} ukupno={baza.logovi.length} jedinica="zapisa" />
        </span>
      </div>

      <div className="panel overflow-hidden">
        {lista.length === 0 ? (
          <Prazno naslov="Nema zapisa po ovom pojmu" />
        ) : (
          <ul className="divide-y divide-line">
            {lista.map((l) => (
              <li key={l.id} className="flex flex-wrap items-start gap-3 px-4 py-2.5">
                <span className="w-36 shrink-0 font-mono text-micro text-ink-faint tnum">{datumVreme(l.at)}</span>
                <span className="w-40 shrink-0 truncate text-sm font-medium">{l.akcija}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{l.entitet}</span>
                  <span className="block truncate text-micro text-ink-muted">{l.detalj}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-micro">{l.ko}</span>
                  <span className="block font-mono text-eyebrow text-ink-faint">{relativno(l.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
