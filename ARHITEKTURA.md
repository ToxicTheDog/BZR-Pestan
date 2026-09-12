# Arhitektura — mapa za brzo snalaženje

Namena: naći pravo mesto za izmenu bez čitanja celog repoa. Putanje su od korena.

## Tema i pravila (nepregovaračka)

- **Jezik:** srpski, latinica — kod, komentari, nazivi promenljivih, UI tekst, commit poruke.
- **Tema:** bela, urednička. Levi gusti rail + glavna kolona + uski „dosije" desno.
  Hairline linije (`border-line`), tabularne cifre (`tnum`), oštri radiusi (`rounded-card` = 3px).
- **Zabranjeno:** gradijenti, glow, senke na karticama, centrirana simetrija, tekst koji klizi
  (marquee), generični 3-kolonski feature grid.
- **Akcenat:** `safety-*` (signalno narandžasta) — samo za primarnu radnju i oznake.
  Statusi: `signal-ok / warn / danger / info` (+ `*Bg` varijante).
- **Rok teče od potpisa:** `dueAt = signedAt + rokDana`. Nikad od datuma kreiranja.

## Frontend — `frontend/src`

| Fajl | Šta radi | Ključni eksporti |
| --- | --- | --- |
| `App.tsx` | rute + gejtovanje pravom | `Zasticena` |
| `main.tsx` | bootstrap | — |
| `index.css` | dizajn sistem: `.panel .btn-* .input .th .td .row .chip .eyebrow`, `@media print` | — |
| `lib/types.ts` | **ceo model podataka** | `Baza`, `Nalog`, `Zaposleni`, `Kategorija`, `Oprema`, `Zaduzenje`, `Razduzenje`, `Karton`, `Kontrola`, `Mail`, `Log`, `Podesavanja`, `Permission`, `Role` |
| `lib/store.tsx` | **jedino mesto koje menja podatke** + sesija; `localStorage` ključ nosi verziju | `StoreProvider`, `useStore()` -> `{ baza, akcije, ja, prijava, odjava, smem }` |
| `lib/permissions.ts` | katalog prava, fabrička prava uloge, računanje konačnog prava | `PRAVA`, `SVA_PRAVA`, `ULOGE`, `PODRAZUMEVANA_PRAVA`, `imaPravo` |
| `lib/izbor.ts` | izvedeni podaci (selektori) nad `baza` | `napraviPresek`, `rokZaduzenja`, `vaziRok`, `punoIme`, `nadji*`, `OZNAKA_*` |
| `lib/format.ts` | datumi, pretraga bez kvačica, odbrojavanje, otisak | `datum`, `datumVreme`, `relativno`, `danaDo`, `sadrzi`, `procitajRok`, `useSada`, `otisak` |
| `demo/seed.ts` | demo podaci; sve vreme je relativno na „sada" | `napraviBazu` |
| `demo/potpis.ts` | generisani rukopisni potpis iz imena | `demoPotpis` |
| `components/Shell.tsx` | rail, navigacija, zaglavlje strane, asimetrična podela | `Shell`, `Zaglavlje`, `SaDosijeom` |
| `components/ui.tsx` | UI komplet | `Modal`, `Fioka`, `Polje`, `Pretraga`, `Prekidac`, `Oznaka`, `Tacka`, `Prazno`, `Traka`, `Odeljak`, `Podatak`, `Potvrda`, `Tabovi`, `Filteri`, `Brojac`, `useToast` |
| `components/Potpis.tsx` | crtanje i prikaz potpisa | `PotpisPad`, `PrikazPotpisa`, `DigitalniBlok` |
| `components/Rok.tsx` | status roka na jednom mestu | `RokOznaka`, `RokTraka`, `NAZIV_ROKA`, `TON_ROKA` |
| `components/Dijalozi.tsx` | pop-up potpisa (pokreće rok) i razduženja | `DijalogPotpisa`, `DijalogRazduzenja` |

Strane u `pages/`: `Prijava` (ujedno početna), `Pregled`, `Zaduzenja`, `NovoZaduzenje`,
`Razduzenja`, `Odobrenja`, `Kontrole`, `Inventar`, `Kartoni`, `Zaposleni`, `Posta`,
`Nalozi`, `Podesavanja`, `Logovi`, `MojNalog`.

## Backend — `backend/src`

| Fajl | Šta radi |
| --- | --- |
| `index.js` | Express, CORS, montiranje ruta, `obradiGreske` |
| `konfig.js` | `.env` čitač + podrazumevane vrednosti |
| `baza.js` | JSON skladište: `baza()`, `sacuvaj()`, `id()`, `sledeciBroj()` |
| `seed.js` | početni sadržaj baze (`pocetnaBaza`), `npm run seed -- --force` |
| `auth.js` | JWT, bcrypt, `trazenaPrijava`, `trazenoPravo(pravo)`, `javniNalog` |
| `prava.js` | isti katalog prava kao frontend — **menjati u paru** |
| `greske.js` | `HttpGreska`, `losZahtev/neovlascen/zabranjeno/nijeNadjeno/sukob`, `async_` |
| `provera.js` | validacija ulaza: `tekst`, `broj`, `logicki`, `izbor`, `spoji` |
| `dnevnik.js` | `upisiLog(nalog, akcija, entitet, detalj)` |
| `rute/auth.js` | prijava, `ja`, lozinka, potpis |
| `rute/nalozi.js` | nalozi + izuzeci prava |
| `rute/sifarnik.js` | zaposleni, kategorije, oprema (+ `POST /oprema/premesti`) |
| `rute/sistem.js` | podešavanja, prava uloga, logovi |

Rute koje tek dolaze: zaduženja, razduženja, odobrenja, kontrole, kartoni, pošta.
Kolekcije za njih već postoje u bazi (prazne). Frontend do tada radi nad demo podacima.

## Gde se šta menja

| Zadatak | Fajlovi |
| --- | --- |
| novo polje na entitetu | `lib/types.ts` -> `demo/seed.ts` -> `lib/store.tsx` (akcija) -> strana |
| **nova kolekcija u bazi** | isto + **podići `KLJUC` verziju** u `lib/store.tsx`, inače stari `localStorage` puca |
| novo pravo | `lib/permissions.ts` **i** `backend/src/prava.js` (isti spisak) |
| novo dugme/radnja | `smem('pravo')` oko njega + akcija u `store.tsx` |
| izmena izgleda statusa | `components/Rok.tsx` ili `Oznaka` u `ui.tsx` — ne inline po stranama |
| štampa kartona | `index.css` blok `@media print` + `<thead>` u `pages/Kartoni.tsx` (zaglavlje se ponavlja po strani) |
| nova API ruta | `backend/src/rute/*.js` + montiranje u `index.js` + red u `backend/README.md` |

## Pravila koja se lako prekrše

1. Podatke menja **samo** `store.tsx` (frontend) / rute preko `baza()` + `sacuvaj()` (backend).
2. Rok se računa samo kroz `rokZaduzenja` / `vaziRok` — nema ručnog računanja datuma po stranama.
3. Svaka akcija piše u dnevnik (`saLogom` / `upisiLog`).
4. `npm run build` u `frontend/` pre svakog push-a (uključuje `tsc --noEmit`).
5. Kolona sa strane ne sme biti `sticky` — zamrzava sadržaj dok se ne skroluje do dna.
