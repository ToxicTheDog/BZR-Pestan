# BZR portal — backend

Node.js (Express) API za portal bezbednosti i zdravlja na radu.

## Pokretanje

```bash
cd backend
cp .env.example .env      # podesiti JWT_TAJNA pre produkcije
npm install
npm run dev               # http://localhost:4000
```

Prvo pokretanje pravi `podaci/baza.json` sa demo nalozima
(`admin`, `m.stankovic`, `s.jovanovic` — lozinka `demo1234`).
`npm run seed -- --force` vraća bazu na početno stanje.

## Skladište

JSON fajl, bez native zavisnosti — backend radi svuda gde radi Node. Upis je
atomičan (privremeni fajl pa `rename`). Kad projekat preraste ovo, menja se
samo `src/baza.js`; rute rade preko `baza().<kolekcija>` i `sacuvaj()`.

## Auth

`POST /api/auth/prijava` vraća JWT; token ide u `Authorization: Bearer <token>`.
Prava se računaju isto kao na frontendu: pravo uloge + pojedinačni izuzetak
naloga, gde je izuzetak jači (`src/prava.js`).

## Rute

| Metod | Putanja | Pravo |
| --- | --- | --- |
| POST | `/api/auth/prijava` | — |
| GET | `/api/auth/ja` | prijava |
| POST | `/api/auth/lozinka` | prijava |
| PUT | `/api/auth/potpis` | prijava |
| GET/POST | `/api/nalozi` | `nalozi.upravljaj` |
| PATCH/DELETE | `/api/nalozi/:id` | `nalozi.upravljaj` |
| PUT | `/api/nalozi/:id/pravo` | `nalozi.upravljaj` |
| GET | `/api/zaposleni` | `zaposleni.vidi` |
| | *(`?q=` pretraga, `?sektor=`, `?limit=&offset=`; odgovor nosi i `ukupno`)* | |
| POST/PATCH | `/api/zaposleni` | `zaposleni.upis` |
| GET | `/api/kategorije` | `inventar.vidi` |
| POST/PATCH/DELETE | `/api/kategorije` | `inventar.upis` |
| GET | `/api/oprema` | `inventar.vidi` |
| POST/PATCH | `/api/oprema` | `inventar.upis` |
| POST | `/api/oprema/premesti` | `inventar.upis` |
| DELETE | `/api/oprema/:id` | `inventar.brisanje` |
| GET | `/api/podesavanja` | prijava |
| PATCH | `/api/podesavanja` | `podesavanja.upravljaj` |
| PUT | `/api/podesavanja/prava-uloge` | `podesavanja.upravljaj` |
| GET | `/api/logovi` | `logovi.vidi` |

## Sledeći korak

Zaduženja (sa potpisom koji pokreće rok), razduženja, odobrenja, kontrole,
kartoni i pošta. Kolekcije za njih već postoje u bazi, prazne.
Frontend do tada radi nad demo podacima u pregledaču.
