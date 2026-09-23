import type { Baza, Kontrola, Nalog, Oprema, Sektor, Zaduzenje, Zaposleni } from './types';
import { procitajRok, type Rok, danaDo } from './format';
import { imaPravo } from './permissions';

/* ------------------------- Nadležnost po sektorima -------------------------
 *
 * Nalog pokriva sektore iz `nalog.sektori`, a `sviSektori` ga oslobađa podele.
 * Sve što je vezano za zaposlenog (zaduženja, razduženja, kartoni, pošta)
 * filtrira se kroz ovu jednu funkciju — nema paralelnih pravila po stranama.
 */

export type Nadleznost = { svi: true } | { svi: false; sektori: Set<string> };

export function nadleznost(nalog: Nalog | null): Nadleznost {
  if (!nalog) return { svi: false, sektori: new Set() };
  if (nalog.sviSektori) return { svi: true };
  return { svi: false, sektori: new Set(nalog.sektori ?? []) };
}

export function uNadleznosti(n: Nadleznost, sektorId: string | undefined | null): boolean {
  if (n.svi) return true;
  return Boolean(sektorId) && n.sektori.has(sektorId as string);
}

/** Nalog bez ijednog sektora ne vidi nikoga — to se u administraciji ističe. */
export function bezNadleznosti(nalog: Nalog): boolean {
  return !nalog.sviSektori && (nalog.sektori ?? []).length === 0;
}

export function nadjiSektor(baza: Baza, id: string | undefined | null): Sektor | undefined {
  return id ? baza.sektori.find((s) => s.id === id) : undefined;
}

export function nazivSektora(baza: Baza, id: string | undefined | null): string {
  return nadjiSektor(baza, id)?.naziv ?? '—';
}

export function sektorZaposlenog(baza: Baza, zaposleniId: string): string | undefined {
  return baza.zaposleni.find((z) => z.id === zaposleniId)?.sektorId;
}

/** Nalozi koji odobravaju zahteve za dati sektor — izvedeno, ne upisano. */
export function odobriociSektora(baza: Baza, sektorId: string): Nalog[] {
  return baza.nalozi.filter(
    (n) =>
      n.aktivan &&
      imaPravo(n, 'odobrenja.odlucuj', baza.pravaUloga) &&
      (n.sviSektori || (n.sektori ?? []).includes(sektorId)),
  );
}

/** Nalozi koji izdaju opremu zaposlenima iz datog sektora. */
export function usluziociSektora(baza: Baza, sektorId: string): Nalog[] {
  return baza.nalozi.filter(
    (n) =>
      n.aktivan &&
      imaPravo(n, 'zaduzenja.izdaj', baza.pravaUloga) &&
      (n.sviSektori || (n.sektori ?? []).includes(sektorId)),
  );
}

/* ------------------------- Filtrirani pogledi ------------------------- */

export function vidljiviZaposleni(baza: Baza, nalog: Nalog | null): Zaposleni[] {
  const n = nadleznost(nalog);
  return baza.zaposleni.filter((z) => uNadleznosti(n, z.sektorId));
}

/** Za zaduženje se gleda snimljeni sektor, ne trenutni sektor zaposlenog. */
export function vidljivaZaduzenja(baza: Baza, nalog: Nalog | null): Zaduzenje[] {
  const n = nadleznost(nalog);
  return baza.zaduzenja.filter((z) => uNadleznosti(n, z.sektorId ?? sektorZaposlenog(baza, z.zaposleniId)));
}

export function vidljivaRazduzenja(baza: Baza, nalog: Nalog | null) {
  const dozvoljena = new Set(vidljivaZaduzenja(baza, nalog).map((z) => z.id));
  return baza.razduzenja.filter((r) => dozvoljena.has(r.zaduzenjeId));
}

export function vidljiviKartoni(baza: Baza, nalog: Nalog | null) {
  const n = nadleznost(nalog);
  return baza.kartoni.filter((k) => uNadleznosti(n, sektorZaposlenog(baza, k.zaposleniId)));
}

export function vidljivaPosta(baza: Baza, nalog: Nalog | null) {
  const n = nadleznost(nalog);
  const adrese = new Set(vidljiviZaposleni(baza, nalog).map((z) => z.email));
  // Poruke koje nisu vezane za zaposlenog (obaveštenja službi) vide svi.
  return baza.mailovi.filter((m) => n.svi || adrese.has(m.za));
}

export function punoIme(z: Zaposleni | undefined | null): string {
  return z ? `${z.ime} ${z.prezime}` : '—';
}

export function nadjiZaposlenog(baza: Baza, id: string) {
  return baza.zaposleni.find((z) => z.id === id);
}

export function nadjiNalog(baza: Baza, id: string | null) {
  return id ? baza.nalozi.find((n) => n.id === id) : undefined;
}

export function nadjiOpremu(baza: Baza, id: string) {
  return baza.oprema.find((o) => o.id === id);
}

export function kategorijaOpreme(baza: Baza, o: Oprema | undefined) {
  return o ? baza.kategorije.find((k) => k.id === o.kategorijaId) : undefined;
}

/** Rok koji važi za komad opreme: override na opremi, pa kategorija. */
export function vaziRok(baza: Baza, o: Oprema): number {
  if (o.rokDana !== null) return o.rokDana;
  return kategorijaOpreme(baza, o)?.rokDana ?? 0;
}

export function rokZaduzenja(baza: Baza, z: Zaduzenje, sada: number): Rok {
  const { upozorenjeDana, kriticnoDana } = baza.podesavanja.rokovi;
  return procitajRok(z.signedAt, z.dueAt, sada, upozorenjeDana, kriticnoDana);
}

export function opisStavki(baza: Baza, z: Zaduzenje): string {
  return z.stavke
    .map((s) => {
      const o = nadjiOpremu(baza, s.opremaId);
      return `${o?.naziv ?? 'oprema'}${s.kolicina > 1 ? ` ×${s.kolicina}` : ''}`;
    })
    .join(', ');
}

export function brojKomada(z: Zaduzenje): number {
  return z.stavke.reduce((zbir, s) => zbir + s.kolicina, 0);
}

export type Presek = {
  aktivna: Zaduzenje[];
  isteklo: Zaduzenje[];
  uskoro: Zaduzenje[];
  kriticno: Zaduzenje[];
  cekaOdobrenje: Zaduzenje[];
  cekaPotpis: Zaduzenje[];
  slobodnoKomada: number;
  zaduzenoKomada: number;
  uServisu: number;
  niskeZalihe: Oprema[];
  atestIstice: Oprema[];
  kontroleNaRedu: Kontrola[];
  kontroleKasne: Kontrola[];
  nalaziSaPrimedbama: Kontrola[];
  istekliLekarski: Zaposleni[];
  istekleObuke: Zaposleni[];
};

/**
 * Jedan prolaz kroz bazu — dashboard i dosije čitaju isti presek.
 * Računa se nad zaduženjima u nadležnosti naloga, da se brojači slažu
 * sa onim što nalog zaista vidi u listama.
 */
export function napraviPresek(baza: Baza, sada: number, nalog: Nalog | null = null): Presek {
  const zaduzenja = nalog ? vidljivaZaduzenja(baza, nalog) : baza.zaduzenja;
  const zaposleni = nalog ? vidljiviZaposleni(baza, nalog) : baza.zaposleni;
  const aktivna = zaduzenja.filter((z) => z.status === 'aktivno');
  const isteklo: Zaduzenje[] = [];
  const uskoro: Zaduzenje[] = [];
  const kriticno: Zaduzenje[] = [];

  for (const z of aktivna) {
    const r = rokZaduzenja(baza, z, sada);
    if (r.status === 'isteklo') isteklo.push(z);
    else if (r.status === 'kriticno') kriticno.push(z);
    else if (r.status === 'uskoro') uskoro.push(z);
  }

  const poRoku = (a: Zaduzenje, b: Zaduzenje) =>
    new Date(a.dueAt ?? 0).getTime() - new Date(b.dueAt ?? 0).getTime();

  return {
    aktivna,
    isteklo: isteklo.sort(poRoku),
    uskoro: uskoro.sort(poRoku),
    kriticno: kriticno.sort(poRoku),
    cekaOdobrenje: zaduzenja.filter((z) => z.status === 'ceka_odobrenje'),
    cekaPotpis: zaduzenja.filter((z) => z.status === 'ceka_potpis'),
    slobodnoKomada: baza.oprema.filter((o) => o.stanje === 'slobodno').length,
    zaduzenoKomada: baza.oprema.filter((o) => o.stanje === 'zaduzeno').length,
    uServisu: baza.oprema.filter((o) => o.stanje === 'servis').length,
    niskeZalihe: baza.oprema.filter((o) => o.minZaliha > 0 && o.kolicina <= o.minZaliha),
    atestIstice: baza.oprema.filter((o) => {
      const d = danaDo(o.atestVazi);
      return d !== null && d <= 30;
    }),
    kontroleNaRedu: baza.kontrole
      .filter((k) => !k.izvrsenoAt && new Date(k.planiranoZa).getTime() >= sada)
      .sort((a, b) => new Date(a.planiranoZa).getTime() - new Date(b.planiranoZa).getTime()),
    kontroleKasne: baza.kontrole.filter((k) => !k.izvrsenoAt && new Date(k.planiranoZa).getTime() < sada),
    nalaziSaPrimedbama: baza.kontrole.filter((k) => k.nalaz === 'primedbe' || k.nalaz === 'neispravno'),
    istekliLekarski: zaposleni.filter((z) => {
      const d = danaDo(z.lekarskiVazi);
      return d !== null && d <= 30;
    }),
    istekleObuke: zaposleni.filter((z) => {
      const d = danaDo(z.obukaBzrVazi);
      return d !== null && d <= 30;
    }),
  };
}

export const OZNAKA_STANJA: Record<Oprema['stanje'], string> = {
  slobodno: 'Slobodno',
  zaduzeno: 'Zaduženo',
  servis: 'Servis',
  rezervisano: 'Rezervisano',
  otpisano: 'Otpisano',
};

export const OZNAKA_STATUSA: Record<Zaduzenje['status'], string> = {
  ceka_odobrenje: 'Čeka odobrenje',
  odbijeno: 'Odbijeno',
  ceka_potpis: 'Čeka potpis',
  aktivno: 'Aktivno',
  razduzeno: 'Razduženo',
};

export const OZNAKA_KONTROLE: Record<Kontrola['tip'], string> = {
  periodicni: 'Periodični pregled',
  lzo: 'Kontrola LZO',
  radno_mesto: 'Pregled radnog mesta',
  obuka: 'Provera obučenosti',
};
