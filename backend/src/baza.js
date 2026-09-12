/**
 * Skladište podataka.
 *
 * Namerno je JSON fajl, bez native zavisnosti: backend se pokreće `npm start`
 * na bilo kojoj mašini sa Node-om. Kad projekat preraste ovo, menja se samo
 * ovaj modul — rute rade preko `baza.<kolekcija>` i `sacuvaj()`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { konfig } from './konfig.js';
import { pocetnaBaza } from './seed.js';

let podaci = null;
let zakazano = null;

export function ucitaj() {
  if (podaci) return podaci;
  if (existsSync(konfig.bazaPutanja)) {
    podaci = JSON.parse(readFileSync(konfig.bazaPutanja, 'utf8'));
  } else {
    podaci = pocetnaBaza();
    sacuvajOdmah();
  }
  return podaci;
}

export function baza() {
  return ucitaj();
}

/** Upis je atomičan (privremeni fajl pa rename) da pad servera ne pokvari bazu. */
export function sacuvajOdmah() {
  mkdirSync(dirname(konfig.bazaPutanja), { recursive: true });
  const privremeni = `${konfig.bazaPutanja}.tmp`;
  writeFileSync(privremeni, JSON.stringify(podaci, null, 2), 'utf8');
  renameSync(privremeni, konfig.bazaPutanja);
}

/** Više izmena u istom zahtevu se sliju u jedan upis na disk. */
export function sacuvaj() {
  if (zakazano) return;
  zakazano = setTimeout(() => {
    zakazano = null;
    sacuvajOdmah();
  }, 50);
}

export function id(prefiks) {
  return `${prefiks}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

/** Sledeći broj dokumenta u formatu PREFIKS-GODINA-0001. */
export function sledeciBroj(prefiks, postojeci) {
  const godina = new Date().getFullYear();
  const brojevi = postojeci
    .map((b) => Number(String(b).split('-').pop()))
    .filter((n) => Number.isFinite(n));
  const sledeci = (brojevi.length ? Math.max(...brojevi) : 0) + 1;
  return `${prefiks}-${godina}-${String(sledeci).padStart(4, '0')}`;
}
