import { baza, sacuvaj, id } from './baza.js';

/** Svaka izmena ostavlja trag — isto kao u demo skladištu na frontendu. */
export function upisiLog(nalog, akcija, entitet, detalj) {
  const b = baza();
  b.logovi.unshift({
    id: id('l'),
    at: new Date().toISOString(),
    ko: nalog?.fullName ?? 'sistem',
    akcija,
    entitet,
    detalj,
  });
  b.logovi = b.logovi.slice(0, 1000);
  sacuvaj();
}
