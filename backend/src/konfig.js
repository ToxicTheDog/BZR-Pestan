/** Konfiguracija se čita iz okruženja; podrazumevane vrednosti su za razvoj. */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const koren = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Mali .env čitač — bez dodatne zavisnosti.
const envPutanja = resolve(koren, '.env');
if (existsSync(envPutanja)) {
  for (const red of readFileSync(envPutanja, 'utf8').split('\n')) {
    const linija = red.trim();
    if (!linija || linija.startsWith('#')) continue;
    const i = linija.indexOf('=');
    if (i === -1) continue;
    const kljuc = linija.slice(0, i).trim();
    if (process.env[kljuc] === undefined) process.env[kljuc] = linija.slice(i + 1).trim();
  }
}

export const konfig = {
  koren,
  port: Number(process.env.PORT ?? 4000),
  jwtTajna: process.env.JWT_TAJNA ?? 'razvojna-tajna-ne-koristiti-u-produkciji',
  jwtSati: Number(process.env.JWT_SATI ?? 12),
  corsIzvori: (process.env.CORS_IZVOR ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  bazaPutanja: resolve(koren, process.env.BAZA_PUTANJA ?? './podaci/baza.json'),
};
