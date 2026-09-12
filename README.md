# BZR-Pestan

Portal za bezbednost i zdravlje na radu — Peštan d.o.o.

Trenutno je napravljen **samo frontend**. Aplikacija radi nad demo podacima
u pregledaču (bez backenda, bez mreže); podaci se čuvaju u `localStorage`
i mogu se u svakom trenutku vratiti na početno stanje iz Podešavanja.

## Pokretanje

```bash
cd frontend
npm install
npm run dev      # razvojni server na http://localhost:5173
npm run build    # provera tipova + produkcioni build
```

Prijava: bilo koji demo nalog sa liste na ekranu za prijavu, lozinka
proizvoljna (4+ znaka).

## Uloge

| Uloga | Šta radi |
| --- | --- |
| **Administrator** | Puna kontrola: nalozi, prava, konfiguracija, inventar, evidencije, logovi. |
| **Uslužilac** | Izdaje i razdužuje opremu, potpisuje svojim potpisom, popisuje i dodaje opremu. |
| **Odobrilac** | Odobrava izdavanje opreme i ima uvid u to ko je, kome i kada izdao. |

Prava se nasleđuju iz uloge (matrica u Podešavanjima → „Prava uloga"), a
administrator svakom nalogu pojedinačno može da **da** ili **oduzme** bilo
koje pravo — izuzetak je jači od uloge.

## Moduli

- **Pregled** — rokovi koji gore, zahtevi, kontrole na redu, stanje magacina.
- **Zaduženja** — izdavanje opreme kroz čarobnjak; po snimanju iskače pop-up
  za potpis primaoca i overu uslužioca. **Od trenutka potpisa kreće rok**
  (`dueAt = signedAt + rokDana`), sa živim odbrojavanjem u celom portalu.
- **Razduženja** — povrat opreme, stanje pri povratu i potpisi obe strane.
- **Odobrenja** — zahtevi za opremu koja traži saglasnost, sa razlogom odbijanja.
- **Kontrole i provere** — periodični pregledi, kontrola LZO, pregled radnog
  mesta i provera obučenosti, sa listom provere, nalazom i potpisom.
- **Inventar** — kategorije sa podrazumevanim rokom zaduženja, stanje komada,
  minimalne zalihe i atesti.
- **Kartoni** — lični karton LZO (Obrazac 6), spreman za štampu.
- **Zaposleni** — podaci za karton: radno mesto, veličine, lekarski, obuka BZR.
- **Pošta** — poslate poruke i šabloni sa okidačima (potvrda, podsetnik, istek).
- **Nalozi i prava**, **Podešavanja**, **Logovi**, **Moj nalog** (sačuvan potpis).

## Rokovi

Administrator u Podešavanjima zadaje prag upozorenja i kritični prag u danima.
Rok zaduženja predlaže kategorija opreme (uslužilac ga može promeniti), a
status se svuda prikazuje isto: `u roku` → `ističe uskoro` → `ističe danas-sutra`
→ `rok istekao`.

## Potpisi

- **Potpis u aplikaciji** — crta se na platnu (miš, prst, olovka); nalog može
  da sačuva svoj potpis i da ga posle samo potvrđuje.
- **Digitalni potpis** — uz dokument se pamte potpisnik, sertifikat, otisak
  dokumenta i vreme overe.

## Struktura

```
frontend/src
  components/   Shell, ticker, UI komplet, potpisi, dijalozi
  lib/          tipovi, prava, formatiranje i odbrojavanje, demo skladište
  demo/         generator demo podataka i demo potpisa
  pages/        ekrani portala
```

## Sledeći korak

Backend: `lib/store.tsx` je jedino mesto koje menja podatke, pa se akcije
mogu jedna po jedna zameniti pozivima API-ja bez diranja ekrana.
