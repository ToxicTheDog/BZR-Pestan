/**
 * Katalog prava i fabrička prava po ulozi.
 * Mora da ostane poravnato sa `frontend/src/lib/permissions.ts`.
 */
export const ULOGE = ['admin', 'usluzilac', 'odobrilac'];

export const SVA_PRAVA = [
  'inventar.vidi', 'inventar.upis', 'inventar.brisanje',
  'zaduzenja.vidi', 'zaduzenja.izdaj', 'zaduzenja.razduzi', 'zaduzenja.produzi',
  'odobrenja.vidi', 'odobrenja.odlucuj',
  'kontrole.vidi', 'kontrole.sprovedi',
  'kartoni.vidi', 'kartoni.upis',
  'zaposleni.vidi', 'zaposleni.upis',
  'mail.vidi', 'mail.posalji',
  'nalozi.upravljaj', 'podesavanja.upravljaj', 'logovi.vidi',
];

export const PODRAZUMEVANA_PRAVA = {
  admin: [...SVA_PRAVA],
  usluzilac: [
    'inventar.vidi', 'inventar.upis',
    'zaduzenja.vidi', 'zaduzenja.izdaj', 'zaduzenja.razduzi', 'zaduzenja.produzi',
    'odobrenja.vidi',
    'kontrole.vidi', 'kontrole.sprovedi',
    'kartoni.vidi', 'kartoni.upis',
    'zaposleni.vidi',
    'mail.vidi', 'mail.posalji',
  ],
  odobrilac: [
    'inventar.vidi',
    'zaduzenja.vidi',
    'odobrenja.vidi', 'odobrenja.odlucuj',
    'kontrole.vidi',
    'kartoni.vidi',
    'zaposleni.vidi',
    'mail.vidi',
  ],
};

/**
 * Konačno pravo: pravo uloge, osim ako admin nije postavio izuzetak baš za
 * taj nalog. Izuzetak radi u oba smera — i daje i oduzima.
 */
export function imaPravo(nalog, pravo, pravaUloga) {
  if (!nalog || !nalog.aktivan) return false;
  const izuzetak = nalog.izuzeci?.[pravo];
  if (izuzetak !== undefined) return izuzetak;
  return (pravaUloga[nalog.role] ?? []).includes(pravo);
}
