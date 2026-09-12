/** Zaposleni, kategorije i oprema — osnovni šifarnici portala. */
import { Router } from 'express';
import { baza, sacuvaj, id } from '../baza.js';
import { trazenaPrijava, trazenoPravo } from '../auth.js';
import { async_, losZahtev, nijeNadjeno, sukob } from '../greske.js';
import { broj, izbor, logicki, spoji, tekst } from '../provera.js';
import { upisiLog } from '../dnevnik.js';

const STANJA = ['slobodno', 'zaduzeno', 'servis', 'rezervisano', 'otpisano'];
const TIPOVI = ['LZO', 'ALAT', 'POTROSNO'];

/* ---------------------------- Zaposleni ---------------------------- */

export const zaposleni = Router();
zaposleni.use(trazenaPrijava);

zaposleni.get('/', trazenoPravo('zaposleni.vidi'), async_((_req, res) => {
  res.json({ stavke: baza().zaposleni });
}));

function poljaZaposlenog(telo, obavezno) {
  return spoji({
    ime: tekst(telo, 'ime', { obavezno, min: 2, max: 60 }),
    prezime: tekst(telo, 'prezime', { obavezno, min: 2, max: 60 }),
    radnoMesto: tekst(telo, 'radnoMesto', { max: 120 }),
    organizacionaJedinica: tekst(telo, 'organizacionaJedinica', { max: 120 }),
    lokacija: tekst(telo, 'lokacija', { max: 120 }),
    email: tekst(telo, 'email', { max: 160 }),
    telefon: tekst(telo, 'telefon', { max: 40 }),
    brojCipela: tekst(telo, 'brojCipela', { max: 10 }),
    konfekcija: tekst(telo, 'konfekcija', { max: 10 }),
    datumZaposlenja: tekst(telo, 'datumZaposlenja', { max: 40 }),
    lekarskiVazi: telo?.lekarskiVazi === null ? null : tekst(telo, 'lekarskiVazi', { max: 40 }),
    obukaBzrVazi: telo?.obukaBzrVazi === null ? null : tekst(telo, 'obukaBzrVazi', { max: 40 }),
    aktivan: logicki(telo, 'aktivan'),
  });
}

zaposleni.post('/', trazenoPravo('zaposleni.upis'), async_((req, res) => {
  const nov = {
    id: id('z'),
    ime: '', prezime: '', radnoMesto: '', organizacionaJedinica: '', lokacija: '',
    email: '', telefon: '', datumZaposlenja: new Date().toISOString(),
    brojCipela: '', konfekcija: '', aktivan: true, lekarskiVazi: null, obukaBzrVazi: null,
    ...poljaZaposlenog(req.body, true),
  };
  baza().zaposleni.unshift(nov);
  sacuvaj();
  upisiLog(req.nalog, 'Dodat zaposleni', `${nov.ime} ${nov.prezime}`, nov.radnoMesto);
  res.status(201).json({ zaposleni: nov });
}));

zaposleni.patch('/:id', trazenoPravo('zaposleni.upis'), async_((req, res) => {
  const z = baza().zaposleni.find((x) => x.id === req.params.id);
  if (!z) throw nijeNadjeno('Zaposleni ne postoji.');
  const izmene = poljaZaposlenog(req.body, false);
  Object.assign(z, izmene);
  sacuvaj();
  upisiLog(req.nalog, 'Izmenjen zaposleni', `${z.ime} ${z.prezime}`, Object.keys(izmene).join(', '));
  res.json({ zaposleni: z });
}));

/* ---------------------------- Kategorije ---------------------------- */

export const kategorije = Router();
kategorije.use(trazenaPrijava);

kategorije.get('/', trazenoPravo('inventar.vidi'), async_((_req, res) => {
  const b = baza();
  res.json({
    stavke: b.kategorije.map((k) => ({
      ...k,
      brojStavki: b.oprema.filter((o) => o.kategorijaId === k.id).length,
    })),
  });
}));

function poljaKategorije(telo, obavezno) {
  return spoji({
    naziv: tekst(telo, 'naziv', { obavezno, min: 2, max: 80 }),
    sifra: tekst(telo, 'sifra', { obavezno, min: 2, max: 16 })?.toUpperCase(),
    tip: izbor(telo, 'tip', TIPOVI),
    ikona: tekst(telo, 'ikona', { max: 40 }),
    opis: tekst(telo, 'opis', { max: 300 }),
    rokDana: broj(telo, 'rokDana', { min: 0, max: 3650 }),
    zahtevaOdobrenje: logicki(telo, 'zahtevaOdobrenje'),
  });
}

kategorije.post('/', trazenoPravo('inventar.upis'), async_((req, res) => {
  const polja = poljaKategorije(req.body, true);
  if (baza().kategorije.some((k) => k.sifra === polja.sifra)) throw sukob('Šifra kategorije je zauzeta.');

  const nova = {
    id: id('k'), tip: 'LZO', ikona: 'package', opis: '', rokDana: 365, zahtevaOdobrenje: false,
    ...polja,
  };
  baza().kategorije.push(nova);
  sacuvaj();
  upisiLog(req.nalog, 'Dodata kategorija', nova.naziv, nova.opis);
  res.status(201).json({ kategorija: nova });
}));

kategorije.patch('/:id', trazenoPravo('inventar.upis'), async_((req, res) => {
  const k = baza().kategorije.find((x) => x.id === req.params.id);
  if (!k) throw nijeNadjeno('Kategorija ne postoji.');
  const izmene = poljaKategorije(req.body, false);
  if (izmene.sifra && baza().kategorije.some((x) => x.sifra === izmene.sifra && x.id !== k.id)) {
    throw sukob('Šifra kategorije je zauzeta.');
  }
  Object.assign(k, izmene);
  sacuvaj();
  upisiLog(req.nalog, 'Izmenjena kategorija', k.naziv, Object.keys(izmene).join(', '));
  res.json({ kategorija: k });
}));

kategorije.delete('/:id', trazenoPravo('inventar.upis'), async_((req, res) => {
  const b = baza();
  const i = b.kategorije.findIndex((x) => x.id === req.params.id);
  if (i === -1) throw nijeNadjeno('Kategorija ne postoji.');
  const zauzeto = b.oprema.filter((o) => o.kategorijaId === req.params.id).length;
  if (zauzeto > 0) throw sukob(`Kategorija nije prazna — ${zauzeto} stavki treba prvo premestiti.`);

  const [obrisana] = b.kategorije.splice(i, 1);
  sacuvaj();
  upisiLog(req.nalog, 'Obrisana kategorija', obrisana.naziv, 'Kategorija uklonjena iz šifarnika.');
  res.json({ ok: true });
}));

/* ------------------------------ Oprema ------------------------------ */

export const oprema = Router();
oprema.use(trazenaPrijava);

oprema.get('/', trazenoPravo('inventar.vidi'), async_((req, res) => {
  const b = baza();
  const kategorijaId = req.query.kategorija;
  const stanje = req.query.stanje;
  let stavke = b.oprema;
  if (kategorijaId) stavke = stavke.filter((o) => o.kategorijaId === kategorijaId);
  if (stanje) stavke = stavke.filter((o) => o.stanje === stanje);
  res.json({ stavke });
}));

function poljaOpreme(telo, obavezno) {
  return spoji({
    inv: tekst(telo, 'inv', { obavezno, min: 2, max: 40 }),
    naziv: tekst(telo, 'naziv', { obavezno, min: 2, max: 120 }),
    kategorijaId: tekst(telo, 'kategorijaId', { obavezno }),
    proizvodjac: tekst(telo, 'proizvodjac', { max: 80 }),
    model: tekst(telo, 'model', { max: 80 }),
    serijski: tekst(telo, 'serijski', { max: 80 }),
    velicina: tekst(telo, 'velicina', { max: 20 }),
    lokacija: tekst(telo, 'lokacija', { max: 80 }),
    napomena: tekst(telo, 'napomena', { max: 500 }),
    stanje: izbor(telo, 'stanje', STANJA),
    kolicina: broj(telo, 'kolicina', { min: 0, max: 100000 }),
    minZaliha: broj(telo, 'minZaliha', { min: 0, max: 100000 }),
    cena: broj(telo, 'cena', { min: 0 }),
    datumNabavke: tekst(telo, 'datumNabavke', { max: 40 }),
    atestVazi: telo?.atestVazi === null ? null : tekst(telo, 'atestVazi', { max: 40 }),
    rokDana: telo?.rokDana === null ? null : broj(telo, 'rokDana', { min: 0, max: 3650 }),
  });
}

oprema.post('/', trazenoPravo('inventar.upis'), async_((req, res) => {
  const b = baza();
  const polja = poljaOpreme(req.body, true);
  if (!b.kategorije.some((k) => k.id === polja.kategorijaId)) throw losZahtev('Kategorija ne postoji.');
  if (b.oprema.some((o) => o.inv === polja.inv)) throw sukob('Inventarski broj je već u upotrebi.');

  const nova = {
    id: id('o'),
    proizvodjac: '', model: '', serijski: '', velicina: '', lokacija: 'Magacin A',
    stanje: 'slobodno', kolicina: 1, minZaliha: 0, cena: 0,
    datumNabavke: new Date().toISOString(), atestVazi: null, rokDana: null, napomena: '',
    ...polja,
  };
  b.oprema.unshift(nova);
  sacuvaj();
  upisiLog(req.nalog, 'Dodata oprema', nova.inv, `${nova.naziv} upisana u inventar.`);
  res.status(201).json({ oprema: nova });
}));

oprema.patch('/:id', trazenoPravo('inventar.upis'), async_((req, res) => {
  const b = baza();
  const o = b.oprema.find((x) => x.id === req.params.id);
  if (!o) throw nijeNadjeno('Oprema ne postoji.');
  const izmene = poljaOpreme(req.body, false);
  if (izmene.kategorijaId && !b.kategorije.some((k) => k.id === izmene.kategorijaId)) {
    throw losZahtev('Kategorija ne postoji.');
  }
  if (izmene.inv && b.oprema.some((x) => x.inv === izmene.inv && x.id !== o.id)) {
    throw sukob('Inventarski broj je već u upotrebi.');
  }
  Object.assign(o, izmene);
  sacuvaj();
  upisiLog(req.nalog, 'Izmenjena oprema', o.inv, Object.keys(izmene).join(', '));
  res.json({ oprema: o });
}));

/** Grupno premeštanje u drugu kategoriju. */
oprema.post('/premesti', trazenoPravo('inventar.upis'), async_((req, res) => {
  const b = baza();
  const kategorijaId = tekst(req.body, 'kategorijaId', { obavezno: true });
  const kat = b.kategorije.find((k) => k.id === kategorijaId);
  if (!kat) throw losZahtev('Kategorija ne postoji.');

  const ids = req.body?.opremaIds;
  if (!Array.isArray(ids) || ids.length === 0) throw losZahtev('Pošaljite listu „opremaIds".');

  let premeseno = 0;
  for (const o of b.oprema) {
    if (ids.includes(o.id)) {
      o.kategorijaId = kategorijaId;
      premeseno++;
    }
  }
  sacuvaj();
  upisiLog(req.nalog, 'Premeštena oprema', kat.naziv, `${premeseno} stavki premešteno u kategoriju ${kat.naziv}.`);
  res.json({ premeseno });
}));

oprema.delete('/:id', trazenoPravo('inventar.brisanje'), async_((req, res) => {
  const b = baza();
  const i = b.oprema.findIndex((x) => x.id === req.params.id);
  if (i === -1) throw nijeNadjeno('Oprema ne postoji.');
  const [obrisana] = b.oprema.splice(i, 1);
  sacuvaj();
  upisiLog(req.nalog, 'Obrisana oprema', obrisana.inv, `${obrisana.naziv} uklonjena iz inventara.`);
  res.json({ ok: true });
}));
