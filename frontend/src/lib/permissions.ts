import type { Nalog, Permission, Role } from './types';

export const ULOGE: Record<Role, { naziv: string; kratko: string; opis: string }> = {
  admin: {
    naziv: 'Administrator',
    kratko: 'ADMIN',
    opis: 'Puna kontrola: nalozi, prava, konfiguracija, inventar, evidencije i logovi.',
  },
  usluzilac: {
    naziv: 'Uslužilac',
    kratko: 'USLUŽ',
    opis: 'Izdaje i razdužuje opremu, potpisuje svojim potpisom, popisuje i dodaje opremu.',
  },
  odobrilac: {
    naziv: 'Odobrilac',
    kratko: 'ODOBR',
    opis: 'Odobrava izdavanje opreme i ima uvid u to ko je, kome i kada izdao.',
  },
};

/** Grupe se koriste i za matricu prava u administraciji. */
export const PRAVA: { grupa: string; stavke: { id: Permission; naziv: string }[] }[] = [
  {
    grupa: 'Inventar',
    stavke: [
      { id: 'inventar.vidi', naziv: 'Pregled inventara' },
      { id: 'inventar.upis', naziv: 'Dodavanje i izmena opreme' },
      { id: 'inventar.brisanje', naziv: 'Otpis i brisanje opreme' },
    ],
  },
  {
    grupa: 'Zaduženja',
    stavke: [
      { id: 'zaduzenja.vidi', naziv: 'Pregled zaduženja' },
      { id: 'zaduzenja.izdaj', naziv: 'Izdavanje opreme i potpis' },
      { id: 'zaduzenja.razduzi', naziv: 'Razduživanje opreme' },
      { id: 'zaduzenja.produzi', naziv: 'Produženje roka' },
    ],
  },
  {
    grupa: 'Odobrenja',
    stavke: [
      { id: 'odobrenja.vidi', naziv: 'Pregled zahteva' },
      { id: 'odobrenja.odlucuj', naziv: 'Odobravanje i odbijanje' },
    ],
  },
  {
    grupa: 'Kontrole',
    stavke: [
      { id: 'kontrole.vidi', naziv: 'Pregled kontrola i provera' },
      { id: 'kontrole.sprovedi', naziv: 'Sprovođenje i zaključivanje' },
    ],
  },
  {
    grupa: 'Kartoni i zaposleni',
    stavke: [
      { id: 'kartoni.vidi', naziv: 'Pregled kartona' },
      { id: 'kartoni.upis', naziv: 'Popunjavanje kartona' },
      { id: 'zaposleni.vidi', naziv: 'Pregled zaposlenih' },
      { id: 'zaposleni.upis', naziv: 'Izmena zaposlenih' },
    ],
  },
  {
    grupa: 'Pošta',
    stavke: [
      { id: 'mail.vidi', naziv: 'Pregled poslate pošte' },
      { id: 'mail.posalji', naziv: 'Slanje e-pošte' },
    ],
  },
  {
    grupa: 'Administracija',
    stavke: [
      { id: 'sektori.upravljaj', naziv: 'Upravljanje sektorima i nadležnošću' },
      { id: 'nalozi.upravljaj', naziv: 'Upravljanje nalozima i pravima' },
      { id: 'podesavanja.upravljaj', naziv: 'Konfiguracija sistema' },
      { id: 'logovi.vidi', naziv: 'Pregled logova' },
    ],
  },
];

export const SVA_PRAVA: Permission[] = PRAVA.flatMap((g) => g.stavke.map((s) => s.id));

export const NAZIV_PRAVA: Record<Permission, string> = Object.fromEntries(
  PRAVA.flatMap((g) => g.stavke.map((s) => [s.id, s.naziv])),
) as Record<Permission, string>;

/** Fabrička prava po ulozi; admin ih menja u Podešavanjima. */
export const PODRAZUMEVANA_PRAVA: Record<Role, Permission[]> = {
  admin: [...SVA_PRAVA],
  usluzilac: [
    'inventar.vidi',
    'inventar.upis',
    'zaduzenja.vidi',
    'zaduzenja.izdaj',
    'zaduzenja.razduzi',
    'zaduzenja.produzi',
    'odobrenja.vidi',
    'kontrole.vidi',
    'kontrole.sprovedi',
    'kartoni.vidi',
    'kartoni.upis',
    'zaposleni.vidi',
    'mail.vidi',
    'mail.posalji',
  ],
  odobrilac: [
    'inventar.vidi',
    'zaduzenja.vidi',
    'odobrenja.vidi',
    'odobrenja.odlucuj',
    'kontrole.vidi',
    'kartoni.vidi',
    'zaposleni.vidi',
    'mail.vidi',
  ],
};

/**
 * Konačno pravo = pravo uloge, osim ako admin nije postavio izuzetak
 * baš za taj nalog. Izuzetak radi u oba smera — i daje i oduzima.
 */
export function imaPravo(
  nalog: Nalog | null,
  pravo: Permission,
  pravaUloga: Record<Role, Permission[]>,
): boolean {
  if (!nalog || !nalog.aktivan) return false;
  const izuzetak = nalog.izuzeci[pravo];
  if (izuzetak !== undefined) return izuzetak;
  return (pravaUloga[nalog.role] ?? []).includes(pravo);
}

export function brojIzuzetaka(nalog: Nalog): number {
  return Object.keys(nalog.izuzeci).length;
}
