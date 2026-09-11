import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

/* ---------- Pretraga bez obzira na pismo i kvačice ---------- */

const CIRILICA: [string, string][] = [
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

export function normalize(input: unknown): string {
  if (input === null || input === undefined) return '';
  let text = String(input);
  for (const [cir, lat] of CIRILICA) text = text.split(cir).join(lat);
  return text
    .toLowerCase()
    .replace(/đ/g, 'dj').replace(/š/g, 's').replace(/č/g, 'c')
    .replace(/ć/g, 'c').replace(/ž/g, 'z')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sadrzi(text: unknown, upit: string): boolean {
  return normalize(text).includes(normalize(upit));
}

/* ---------- Datumi ---------- */

export function datum(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;
}

export function datumVreme(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${datum(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relativno(iso: string | null | undefined): string {
  if (!iso) return '—';
  const razlika = Date.now() - new Date(iso).getTime();
  const min = Math.round(razlika / 60000);
  if (min < 1) return 'upravo sad';
  if (min < 60) return `pre ${min} min`;
  const sati = Math.round(min / 60);
  if (sati < 24) return `pre ${sati} h`;
  const dana = Math.round(sati / 24);
  if (dana < 30) return `pre ${dana} d`;
  return datum(iso);
}

export function dodajDana(iso: string, dana: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dana);
  return d.toISOString();
}

export function danaDo(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function novac(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${Number(v).toLocaleString('sr-RS')} RSD`;
}

export function danaRec(n: number): string {
  const abs = Math.abs(n);
  if (abs === 1) return '1 dan';
  return `${abs} dana`;
}

/* ---------- Odbrojavanje ---------- */

export type StatusRoka = 'trajno' | 'u_roku' | 'uskoro' | 'kriticno' | 'isteklo';

export type Rok = {
  status: StatusRoka;
  msDo: number;
  danaDo: number;
  /** Koliko je roka potrošeno, 0–1. */
  udeo: number;
  tekst: string;
};

/** Čita rok jednog zaduženja u odnosu na „sada" koje prosleđuje ticker. */
export function procitajRok(
  signedAt: string | null,
  dueAt: string | null,
  sada: number,
  upozorenjeDana: number,
  kriticnoDana: number,
): Rok {
  if (!dueAt) {
    return { status: 'trajno', msDo: Infinity, danaDo: Infinity, udeo: 0, tekst: 'trajno zaduženje' };
  }
  const kraj = new Date(dueAt).getTime();
  const pocetak = signedAt ? new Date(signedAt).getTime() : kraj;
  const msDo = kraj - sada;
  const dana = Math.ceil(msDo / 86400000);
  const ukupno = Math.max(1, kraj - pocetak);
  const udeo = Math.min(1, Math.max(0, (sada - pocetak) / ukupno));

  if (msDo <= 0) {
    return {
      status: 'isteklo',
      msDo,
      danaDo: dana,
      udeo: 1,
      tekst: `isteklo pre ${danaRec(Math.max(1, Math.abs(dana)))}`,
    };
  }
  const status: StatusRoka =
    dana <= kriticnoDana ? 'kriticno' : dana <= upozorenjeDana ? 'uskoro' : 'u_roku';
  return { status, msDo, danaDo: dana, udeo, tekst: `još ${odbrojavanje(msDo)}` };
}

/** Ispod jednog dana prikazuje se sat:minut:sekund — timer koji zaista otkucava. */
export function odbrojavanje(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const sek = Math.floor(ms / 1000);
  const dana = Math.floor(sek / 86400);
  const sati = Math.floor((sek % 86400) / 3600);
  const min = Math.floor((sek % 3600) / 60);
  const s = sek % 60;
  if (dana >= 1) return `${danaRec(dana)} ${pad(sati)}:${pad(min)}`;
  return `${pad(sati)}:${pad(min)}:${pad(s)}`;
}

/** Jedan otkucaj za ceo portal — svi timeri se osvežavaju u istom ritmu. */
export function useSada(intervalMs = 1000): number {
  const [sada, setSada] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setSada(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return sada;
}

export function inicijali(punoIme: string): string {
  return punoIme
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/** Demo otisak digitalnog potpisa — deterministički, čitljiv, bez kriptografije. */
export function otisak(ulaz: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < ulaz.length; i++) {
    h1 = (h1 ^ ulaz.charCodeAt(i)) >>> 0;
    h1 = (h1 * 0x01000193) >>> 0;
    h2 = (h2 + ulaz.charCodeAt(i) * (i + 7)) >>> 0;
  }
  const hex = (h1.toString(16) + h2.toString(16)).padEnd(16, '0').slice(0, 16).toUpperCase();
  return hex.match(/.{1,4}/g)!.join(' ');
}
