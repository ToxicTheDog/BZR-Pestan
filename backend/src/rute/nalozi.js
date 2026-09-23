import { Router } from 'express';
import { baza, sacuvaj, id } from '../baza.js';
import { hesuj, javniNalog, trazenaPrijava, trazenoPravo } from '../auth.js';
import { SVA_PRAVA, ULOGE } from '../prava.js';
import { async_, losZahtev, nijeNadjeno, sukob } from '../greske.js';
import { izbor, logicki, spoji, tekst } from '../provera.js';
import { upisiLog } from '../dnevnik.js';

export const nalozi = Router();
nalozi.use(trazenaPrijava, trazenoPravo('nalozi.upravljaj'));

nalozi.get('/', async_((_req, res) => {
  res.json({ stavke: baza().nalozi.map(javniNalog) });
}));

nalozi.post('/', async_((req, res) => {
  const b = baza();
  const username = tekst(req.body, 'username', { obavezno: true, min: 3, max: 40 }).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(username)) throw losZahtev('Korisničko ime sme da sadrži samo slova, cifre, tačku, crtu i donju crtu.');
  if (b.nalozi.some((n) => n.username === username)) throw sukob('Korisničko ime je zauzeto.');

  const lozinka = tekst(req.body, 'lozinka', { obavezno: true, min: 8, max: 200 });

  const nov = {
    id: id('n'),
    username,
    fullName: tekst(req.body, 'fullName', { obavezno: true, min: 2 }),
    email: tekst(req.body, 'email') ?? '',
    telefon: tekst(req.body, 'telefon') ?? '',
    role: izbor(req.body, 'role', ULOGE, { obavezno: true }),
    aktivan: logicki(req.body, 'aktivan') ?? true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    mustChangePassword: logicki(req.body, 'mustChangePassword') ?? true,
    potpis: null,
    sertifikat: null,
    izuzeci: {},
    sektori: [],
    sviSektori: false,
    lozinkaHes: hesuj(lozinka),
  };

  b.nalozi.push(nov);
  sacuvaj();
  upisiLog(req.nalog, 'Kreiran nalog', `Nalog ${nov.username}`, `Uloga: ${nov.role}.`);
  res.status(201).json({ nalog: javniNalog(nov) });
}));

nalozi.patch('/:id', async_((req, res) => {
  const nalog = baza().nalozi.find((n) => n.id === req.params.id);
  if (!nalog) throw nijeNadjeno('Nalog ne postoji.');

  const izmene = spoji({
    fullName: tekst(req.body, 'fullName', { min: 2 }),
    email: tekst(req.body, 'email'),
    telefon: tekst(req.body, 'telefon'),
    role: izbor(req.body, 'role', ULOGE),
    aktivan: logicki(req.body, 'aktivan'),
    mustChangePassword: logicki(req.body, 'mustChangePassword'),
  });

  // Admin ne sme sam sebe da isključi ili spusti ulogu — ostao bi portal bez admina.
  if (nalog.id === req.nalog.id && (izmene.aktivan === false || (izmene.role && izmene.role !== 'admin'))) {
    throw losZahtev('Ne možete isključiti niti promeniti ulogu sopstvenom nalogu.');
  }

  const lozinka = tekst(req.body, 'lozinka', { min: 8, max: 200 });
  if (lozinka) {
    nalog.lozinkaHes = hesuj(lozinka);
    nalog.mustChangePassword = true;
  }

  Object.assign(nalog, izmene);
  sacuvaj();
  upisiLog(req.nalog, 'Izmenjen nalog', `Nalog ${nalog.username}`, Object.keys({ ...izmene, ...(lozinka ? { lozinka: 1 } : {}) }).join(', '));
  res.json({ nalog: javniNalog(nalog) });
}));

nalozi.delete('/:id', async_((req, res) => {
  const b = baza();
  const i = b.nalozi.findIndex((n) => n.id === req.params.id);
  if (i === -1) throw nijeNadjeno('Nalog ne postoji.');
  if (b.nalozi[i].id === req.nalog.id) throw losZahtev('Ne možete obrisati sopstveni nalog.');

  const [obrisan] = b.nalozi.splice(i, 1);
  sacuvaj();
  upisiLog(req.nalog, 'Obrisan nalog', `Nalog ${obrisan.username}`, 'Nalog uklonjen iz sistema.');
  res.json({ ok: true });
}));

/** Nadležnost naloga po sektorima — koga vidi i kome odobrava. */
nalozi.put('/:id/nadleznost', async_((req, res) => {
  const b = baza();
  const nalog = b.nalozi.find((n) => n.id === req.params.id);
  if (!nalog) throw nijeNadjeno('Nalog ne postoji.');

  const svi = logicki(req.body, 'sviSektori') ?? false;
  const trazeni = req.body?.sektori;
  if (!Array.isArray(trazeni)) throw losZahtev('Pošaljite listu „sektori".');
  const nepoznat = trazeni.find((x) => !b.sektori.some((s) => s.id === x));
  if (nepoznat) throw losZahtev(`Sektor „${nepoznat}" ne postoji.`);

  nalog.sektori = Array.from(new Set(trazeni));
  nalog.sviSektori = svi;
  sacuvaj();
  upisiLog(
    req.nalog, 'Izmenjena nadležnost', `Nalog ${nalog.username}`,
    svi ? 'Nadležnost: svi sektori.' : `Nadležnost: ${nalog.sektori.length} sektora.`,
  );
  res.json({ nalog: javniNalog(nalog) });
}));

/** Izuzetak od prava uloge: `true` daje, `false` oduzima, `null` vraća na ulogu. */
nalozi.put('/:id/pravo', async_((req, res) => {
  const nalog = baza().nalozi.find((n) => n.id === req.params.id);
  if (!nalog) throw nijeNadjeno('Nalog ne postoji.');

  const pravo = izbor(req.body, 'pravo', SVA_PRAVA, { obavezno: true });
  const vrednost = req.body?.vrednost;
  if (vrednost !== null && typeof vrednost !== 'boolean') {
    throw losZahtev('Polje „vrednost" mora biti true, false ili null.');
  }

  if (vrednost === null) delete nalog.izuzeci[pravo];
  else nalog.izuzeci[pravo] = vrednost;

  sacuvaj();
  upisiLog(
    req.nalog, 'Izmenjena prava', `Nalog ${nalog.username}`,
    vrednost === null ? `Vraćeno na pravo uloge: ${pravo}` : `${vrednost ? 'Dato' : 'Oduzeto'} pravo: ${pravo}`,
  );
  res.json({ nalog: javniNalog(nalog) });
}));
