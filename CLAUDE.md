# CLAUDE.md

Uputstva za Claude Code u ovom repozitorijumu.

## Pull request — kako se zatvara (zahtev vlasnika)

Vlasnik repoa ne odobrava PR-ove ručno i ne želi da se na njih čeka u krug.

- Posle **prve** provere PR-a: ako je CI zelen, nema konflikta i nema nerešenih
  review komentara, a vlasnik nije odobrio — **skini draft status i spoji PR na
  `main` sam**, pa ugasi praćenje PR-a.
- **Nema ponavljajućih check-in petlji.** Jedna provera, pa merge. Satno
  provaravanje PR-a koji nikog ne čeka samo troši tokene.
- Ako je CI crven, postoji merge konflikt ili nerešen review komentar — to se
  prvo reši i pushuje, pa tek onda merge.
- GitHub ne dozvoljava approve sopstvenog PR-a; merge je dovoljan i nije
  potrebno tražiti odobrenje.

## Prvo pročitaj

**`ARHITEKTURA.md`** — mapa repoa: koji fajl šta radi, gde se šta menja, koja su
pravila teme. Napisana je da se u njoj nađe pravo mesto bez čitanja celog koda.

## Projekat

Portal za bezbednost i zdravlje na radu (Peštan d.o.o.).

- `frontend/` — React + TypeScript + Vite + Tailwind. Radi nad demo podacima u
  pregledaču (`localStorage`); još nije prebačen na API.
- `backend/` — Node.js + Express, JSON skladište, JWT. Pokriva auth, naloge i
  prava, zaposlene, kategorije, opremu, podešavanja i logove.

```bash
cd frontend && npm install && npm run dev    # http://localhost:5173
cd frontend && npm run build                 # tsc --noEmit + build, pre svakog push-a

cd backend && npm install && npm run dev     # http://localhost:4000
cd backend && npm run seed -- --force        # vrati bazu na početno stanje
```

Detalji o modulima, ulogama i rokovima su u `README.md`.

## Konvencije

- Kod, komentari, nazivi promenljivih i poruke u UI-ju su na srpskom (latinica).
- `frontend/src/lib/store.tsx` je jedino mesto koje menja podatke — kad frontend
  pređe na API, akcije se tu zamenjuju pozivima, ekrani se ne diraju.
- Spisak prava postoji na dva mesta (`frontend/src/lib/permissions.ts` i
  `backend/src/prava.js`) i menja se u paru.
- Kad se u `Baza` doda nova kolekcija, podići verziju ključa u `store.tsx`.
- Pre push-a pokrenuti `npm run build` u `frontend/` (uključuje proveru tipova).
