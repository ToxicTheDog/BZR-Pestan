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

## Projekat

Portal za bezbednost i zdravlje na radu (Peštan d.o.o.). Za sada je napravljen
samo frontend — React + TypeScript + Vite + Tailwind, nad demo podacima u
pregledaču (`localStorage`), bez backenda.

```bash
cd frontend
npm install
npm run dev      # razvojni server
npm run build    # tsc --noEmit + produkcioni build (pokrenuti pre svakog push-a)
```

Detalji o modulima, ulogama i rokovima su u `README.md`.

## Konvencije

- Kod, komentari, nazivi promenljivih i poruke u UI-ju su na srpskom (latinica).
- `frontend/src/lib/store.tsx` je jedino mesto koje menja podatke — kad dođe
  backend, akcije se tu zamenjuju API pozivima, ekrani se ne diraju.
- Pre push-a pokrenuti `npm run build` u `frontend/` (uključuje proveru tipova).
