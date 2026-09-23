/**
 * Pretraga bez obzira na pismo i kvačice — isti pojam daje isti rezultat kao
 * u frontendu (`frontend/src/lib/format.ts`). Kad se menja jedno, menja se i
 * drugo, isto kao spisak prava.
 */

const CIRILICA = [
  ['Љ', 'lj'], ['Њ', 'nj'], ['Џ', 'dz'], ['љ', 'lj'], ['њ', 'nj'], ['џ', 'dz'],
  ['А', 'a'], ['Б', 'b'], ['В', 'v'], ['Г', 'g'], ['Д', 'd'], ['Ђ', 'dj'],
  ['Е', 'e'], ['Ж', 'z'], ['З', 'z'], ['И', 'i'], ['Ј', 'j'], ['К', 'k'],
  ['Л', 'l'], ['М', 'm'], ['Н', 'n'], ['О', 'o'], ['П', 'p'], ['Р', 'r'],
  ['С', 's'], ['Т', 't'], ['Ћ', 'c'], ['У', 'u'], ['Ф', 'f'], ['Х', 'h'],
  ['Ц', 'c'], ['Ч', 'c'], ['Ш', 's'],
  ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['ђ', 'dj'],
  ['е', 'e'], ['ж', 'z'], ['з', 'z'], ['и', 'i'], ['ј', 'j'], ['к', 'k'],
  ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
  ['с', 's'], ['т', 't'], ['ћ', 'c'], ['у', 'u'], ['ф', 'f'], ['х', 'h'],
  ['ц', 'c'], ['ч', 'c'], ['ш', 's'],
];

export function normalizuj(ulaz) {
  if (ulaz === null || ulaz === undefined) return '';
  let t = String(ulaz);
  for (const [cir, lat] of CIRILICA) t = t.split(cir).join(lat);
  return t
    .toLowerCase()
    .replace(/đ/g, 'dj').replace(/š/g, 's').replace(/č/g, 'c')
    .replace(/ć/g, 'c').replace(/ž/g, 'z')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sadrzi(tekst, upit) {
  return normalizuj(tekst).includes(normalizuj(upit));
}

/** Svaka reč pojma mora da se nađe u nekom od polja. */
export function odgovara(polja, upit) {
  if (!upit || !String(upit).trim()) return true;
  return String(upit)
    .trim()
    .split(/\s+/)
    .every((rec) => polja.some((p) => sadrzi(p, rec)));
}
