import { Router } from 'express';
import { baza, sacuvaj } from '../baza.js';
import { javniNalog, napraviToken, proveriLozinku, trazenaPrijava, hesuj } from '../auth.js';
import { imaPravo, SVA_PRAVA } from '../prava.js';
import { async_, neovlascen, losZahtev } from '../greske.js';
import { tekst } from '../provera.js';
import { upisiLog } from '../dnevnik.js';

export const auth = Router();

auth.post('/prijava', async_((req, res) => {
  const username = tekst(req.body, 'username', { obavezno: true });
  const lozinka = tekst(req.body, 'lozinka', { obavezno: true, min: 1 });

  const nalog = baza().nalozi.find((n) => n.username.toLowerCase() === username.toLowerCase());
  // Ista poruka za nepostojeći nalog i pogrešnu lozinku — ne otkrivamo koja je.
  if (!nalog || !proveriLozinku(lozinka, nalog.lozinkaHes)) {
    throw neovlascen('Korisničko ime ili lozinka nisu ispravni.');
  }
  if (!nalog.aktivan) throw neovlascen('Nalog je isključen. Obratite se administratoru.');

  nalog.lastLoginAt = new Date().toISOString();
  sacuvaj();
  upisiLog(nalog, 'Prijava', 'Portal', 'Uspešna prijava na portal.');

  res.json({ token: napraviToken(nalog), nalog: javniNalog(nalog) });
}));

/** Ko sam ja + spisak prava koja stvarno imam (uloga + izuzeci). */
auth.get('/ja', trazenaPrijava, async_((req, res) => {
  const pravaUloga = baza().pravaUloga;
  res.json({
    nalog: javniNalog(req.nalog),
    prava: SVA_PRAVA.filter((p) => imaPravo(req.nalog, p, pravaUloga)),
  });
}));

auth.post('/lozinka', trazenaPrijava, async_((req, res) => {
  const stara = tekst(req.body, 'stara', { obavezno: true, min: 1 });
  const nova = tekst(req.body, 'nova', { obavezno: true, min: 8, max: 200 });
  if (!proveriLozinku(stara, req.nalog.lozinkaHes)) throw losZahtev('Trenutna lozinka nije ispravna.');

  req.nalog.lozinkaHes = hesuj(nova);
  req.nalog.mustChangePassword = false;
  sacuvaj();
  upisiLog(req.nalog, 'Promena lozinke', `Nalog ${req.nalog.username}`, 'Korisnik je promenio svoju lozinku.');
  res.json({ ok: true });
}));

/** Potpis naloga se čuva kao data URL i koristi pri overi dokumenata. */
auth.put('/potpis', trazenaPrijava, async_((req, res) => {
  const potpis = tekst(req.body, 'potpis', { obavezno: true, max: 200000 });
  if (!potpis.startsWith('data:image/')) throw losZahtev('Potpis mora biti slika (data URL).');

  req.nalog.potpis = potpis;
  req.nalog.sertifikat ??= `PEST-CA-${req.nalog.id.slice(-4).toUpperCase()}`;
  sacuvaj();
  upisiLog(req.nalog, 'Sačuvan potpis', `Nalog ${req.nalog.username}`, 'Korisnik je sačuvao svoj potpis.');
  res.json({ nalog: javniNalog(req.nalog) });
}));
