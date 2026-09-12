/**
 * BZR portal — HTTP API.
 *
 * Pokretanje: `npm run dev` (razvoj) ili `npm start`.
 * Podaci stoje u JSON fajlu iz `BAZA_PUTANJA`; vidi `baza.js`.
 */
import express from 'express';
import cors from 'cors';
import { konfig } from './konfig.js';
import { ucitaj } from './baza.js';
import { obradiGreske } from './greske.js';
import { auth } from './rute/auth.js';
import { nalozi } from './rute/nalozi.js';
import { kategorije, oprema, zaposleni } from './rute/sifarnik.js';
import { logovi, podesavanja } from './rute/sistem.js';

const app = express();

app.use(
  cors({
    origin(izvor, cb) {
      // Alati bez Origin zaglavlja (curl, health check) prolaze.
      if (!izvor || konfig.corsIzvori.includes(izvor)) return cb(null, true);
      cb(new Error('CORS: izvor nije dozvoljen.'));
    },
  }),
);
// Potpisi stižu kao data URL slike, pa telo mora da bude šire od podrazumevanog.
app.use(express.json({ limit: '2mb' }));

app.get('/api/zdravlje', (_req, res) => {
  res.json({ ok: true, vreme: new Date().toISOString() });
});

app.use('/api/auth', auth);
app.use('/api/nalozi', nalozi);
app.use('/api/zaposleni', zaposleni);
app.use('/api/kategorije', kategorije);
app.use('/api/oprema', oprema);
app.use('/api/podesavanja', podesavanja);
app.use('/api/logovi', logovi);

app.use((_req, res) => res.status(404).json({ greska: 'Ruta ne postoji.' }));
app.use(obradiGreske);

ucitaj();
app.listen(konfig.port, () => {
  console.log(`BZR API sluša na http://localhost:${konfig.port}`);
  console.log(`Baza: ${konfig.bazaPutanja}`);
});
