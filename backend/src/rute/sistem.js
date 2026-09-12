/** Podešavanja portala, prava uloga i dnevnik rada. */
import { Router } from 'express';
import { baza, sacuvaj } from '../baza.js';
import { trazenaPrijava, trazenoPravo } from '../auth.js';
import { SVA_PRAVA, ULOGE } from '../prava.js';
import { async_, losZahtev } from '../greske.js';
import { izbor } from '../provera.js';
import { upisiLog } from '../dnevnik.js';

export const podesavanja = Router();
podesavanja.use(trazenaPrijava);

podesavanja.get('/', async_((_req, res) => {
  const b = baza();
  res.json({ podesavanja: b.podesavanja, pravaUloga: b.pravaUloga });
}));

/** Spaja samo poznate odeljke, da telo zahteva ne može da ubaci strana polja. */
podesavanja.patch('/', trazenoPravo('podesavanja.upravljaj'), async_((req, res) => {
  const b = baza();
  const odeljci = ['firma', 'rokovi', 'potpisi', 'mail'];
  const promenjeni = [];

  for (const odeljak of odeljci) {
    const ulaz = req.body?.[odeljak];
    if (!ulaz || typeof ulaz !== 'object') continue;
    for (const [kljuc, vrednost] of Object.entries(ulaz)) {
      if (!(kljuc in b.podesavanja[odeljak])) continue;
      b.podesavanja[odeljak][kljuc] = vrednost;
    }
    promenjeni.push(odeljak);
  }
  if (promenjeni.length === 0) throw losZahtev('Nije poslato nijedno poznato podešavanje.');

  sacuvaj();
  upisiLog(req.nalog, 'Promenjena podešavanja', promenjeni.join(', '), 'Konfiguracija portala je izmenjena.');
  res.json({ podesavanja: b.podesavanja });
}));

/** Fabrička prava uloge; pojedinačni izuzeci po nalogu su jači od ovoga. */
podesavanja.put('/prava-uloge', trazenoPravo('podesavanja.upravljaj'), async_((req, res) => {
  const b = baza();
  const uloga = izbor(req.body, 'uloga', ULOGE, { obavezno: true });
  const pravo = izbor(req.body, 'pravo', SVA_PRAVA, { obavezno: true });
  const ukljuceno = req.body?.ukljuceno;
  if (typeof ukljuceno !== 'boolean') throw losZahtev('Polje „ukljuceno" mora biti true ili false.');
  if (uloga === 'admin') throw losZahtev('Administratoru se prava ne oduzimaju.');

  const trenutna = b.pravaUloga[uloga] ?? [];
  b.pravaUloga[uloga] = ukljuceno
    ? Array.from(new Set([...trenutna, pravo]))
    : trenutna.filter((p) => p !== pravo);

  sacuvaj();
  upisiLog(req.nalog, 'Izmenjena prava uloge', uloga, `${ukljuceno ? 'Dato' : 'Oduzeto'} pravo: ${pravo}`);
  res.json({ pravaUloga: b.pravaUloga });
}));

export const logovi = Router();
logovi.use(trazenaPrijava, trazenoPravo('logovi.vidi'));

logovi.get('/', async_((req, res) => {
  const granica = Math.min(Number(req.query.granica ?? 200) || 200, 1000);
  res.json({ stavke: baza().logovi.slice(0, granica) });
}));
