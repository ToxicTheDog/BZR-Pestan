/** Sitne provere ulaza — dovoljne za ovaj obim, bez dodatne zavisnosti. */
import { losZahtev } from './greske.js';

export function tekst(telo, polje, { obavezno = false, min = 0, max = 300 } = {}) {
  const v = telo?.[polje];
  if (v === undefined || v === null || v === '') {
    if (obavezno) throw losZahtev(`Polje „${polje}" je obavezno.`);
    return undefined;
  }
  if (typeof v !== 'string') throw losZahtev(`Polje „${polje}" mora biti tekst.`);
  const s = v.trim();
  if (s.length < min) throw losZahtev(`Polje „${polje}" ima najmanje ${min} znakova.`);
  if (s.length > max) throw losZahtev(`Polje „${polje}" ima najviše ${max} znakova.`);
  return s;
}

export function broj(telo, polje, { obavezno = false, min = -Infinity, max = Infinity } = {}) {
  const v = telo?.[polje];
  if (v === undefined || v === null || v === '') {
    if (obavezno) throw losZahtev(`Polje „${polje}" je obavezno.`);
    return undefined;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) throw losZahtev(`Polje „${polje}" mora biti broj.`);
  if (n < min || n > max) throw losZahtev(`Polje „${polje}" mora biti između ${min} i ${max}.`);
  return n;
}

export function logicki(telo, polje) {
  const v = telo?.[polje];
  if (v === undefined) return undefined;
  if (typeof v !== 'boolean') throw losZahtev(`Polje „${polje}" mora biti tačno ili netačno.`);
  return v;
}

export function izbor(telo, polje, dozvoljene, { obavezno = false } = {}) {
  const v = tekst(telo, polje, { obavezno });
  if (v === undefined) return undefined;
  if (!dozvoljene.includes(v)) {
    throw losZahtev(`Polje „${polje}" mora biti jedno od: ${dozvoljene.join(', ')}.`);
  }
  return v;
}

/** Sklapa objekat samo od polja koja su zaista poslata. */
export function spoji(izmene) {
  return Object.fromEntries(Object.entries(izmene).filter(([, v]) => v !== undefined));
}
