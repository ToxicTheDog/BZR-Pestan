import type {
  Baza, Karton, Kategorija, Kontrola, Mail, Nalog, Oprema, Razduzenje, Sablon, Sektor,
  Zaduzenje, Zaposleni,
} from '../lib/types';
import { PODRAZUMEVANA_PRAVA } from '../lib/permissions';
import { otisak } from '../lib/format';
import { demoPotpis } from './potpis';

/* Sve vreme je relativno na trenutak otvaranja demoa, da rokovi uvek
   pokazuju i „ističe uskoro" i „isteklo" — bez ručnog nameštanja datuma. */
const SAD = Date.now();
const pre = (dana: number, sati = 0) =>
  new Date(SAD - dana * 86400000 - sati * 3600000).toISOString();
const za = (dana: number, sati = 0) =>
  new Date(SAD + dana * 86400000 + sati * 3600000).toISOString();

const digitalni = (ime: string, sert: string, vreme: string) => ({
  potpisnik: ime,
  sertifikat: sert,
  otisak: otisak(`${ime}|${sert}|${vreme}`),
  vreme,
});

/* ----------------------------- Sektori ----------------------------- */

const sektori: Sektor[] = [
  { id: 's1', naziv: 'Ekstruzija', sifra: 'EKS', opis: 'Linije za ekstruziju cevi.', aktivan: true },
  { id: 's2', naziv: 'Brizganje', sifra: 'BRZ', opis: 'Brizgalice i montaža fitinga.', aktivan: true },
  { id: 's3', naziv: 'Alatnica', sifra: 'ALT', opis: 'Izrada i održavanje alata.', aktivan: true },
  { id: 's4', naziv: 'Održavanje', sifra: 'ODR', opis: 'Mašinsko i elektro održavanje.', aktivan: true },
  { id: 's5', naziv: 'Magacin', sifra: 'MAG', opis: 'Prijem, skladištenje i otprema.', aktivan: true },
  { id: 's6', naziv: 'Kontrola kvaliteta', sifra: 'KVL', opis: 'Laboratorija i kontrola proizvoda.', aktivan: true },
  { id: 's7', naziv: 'Transport', sifra: 'TRN', opis: 'Vozni park i isporuka.', aktivan: true },
  { id: 's8', naziv: 'Nabavka', sifra: 'NAB', opis: 'Nabavka i ugovaranje.', aktivan: true },
];

/* ----------------------------- Nalozi ----------------------------- */

const nalozi: Nalog[] = [
  {
    id: 'n1', username: 'admin', fullName: 'Nikola Ivanović',
    email: 'nikola.ivanovic@pestan.rs', telefon: '034/700-121', role: 'admin',
    aktivan: true, createdAt: pre(420), lastLoginAt: pre(0, 2), mustChangePassword: false,
    potpis: demoPotpis('Nikola Ivanović'), sertifikat: 'PEST-CA-0001',
    izuzeci: {}, sektori: [], sviSektori: true,
  },
  {
    id: 'n2', username: 'm.stankovic', fullName: 'Marija Stanković',
    email: 'marija.stankovic@pestan.rs', telefon: '034/700-145', role: 'usluzilac',
    aktivan: true, createdAt: pre(390), lastLoginAt: pre(0, 5), mustChangePassword: false,
    potpis: demoPotpis('Marija Stanković'), sertifikat: 'PEST-CA-0014',
    izuzeci: { 'inventar.brisanje': true },
    sektori: ['s1', 's2', 's6'], sviSektori: false,
  },
  {
    id: 'n3', username: 'd.petrovic', fullName: 'Dragan Petrović',
    email: 'dragan.petrovic@pestan.rs', telefon: '034/700-146', role: 'usluzilac',
    aktivan: true, createdAt: pre(240), lastLoginAt: pre(1, 3), mustChangePassword: false,
    potpis: demoPotpis('Dragan Petrović'), sertifikat: 'PEST-CA-0021',
    izuzeci: { 'mail.posalji': false },
    sektori: ['s3', 's4', 's5', 's7'], sviSektori: false,
  },
  {
    id: 'n4', username: 's.jovanovic', fullName: 'Sonja Jovanović',
    email: 'sonja.jovanovic@pestan.rs', telefon: '034/700-118', role: 'odobrilac',
    aktivan: true, createdAt: pre(365), lastLoginAt: pre(0, 9), mustChangePassword: false,
    potpis: demoPotpis('Sonja Jovanović'), sertifikat: 'PEST-CA-0008',
    izuzeci: {}, sektori: ['s1', 's2', 's6'], sviSektori: false,
  },
  {
    id: 'n5', username: 'v.markovic', fullName: 'Vladimir Marković',
    email: 'vladimir.markovic@pestan.rs', telefon: '034/700-119', role: 'odobrilac',
    aktivan: true, createdAt: pre(150), lastLoginAt: pre(4), mustChangePassword: true,
    potpis: null, sertifikat: null,
    izuzeci: { 'zaduzenja.produzi': true },
    sektori: ['s3', 's4', 's5', 's7', 's8'], sviSektori: false,
  },
  {
    id: 'n6', username: 'a.tomic', fullName: 'Ana Tomić',
    email: 'ana.tomic@pestan.rs', telefon: '034/700-147', role: 'usluzilac',
    aktivan: false, createdAt: pre(500), lastLoginAt: pre(96), mustChangePassword: false,
    potpis: demoPotpis('Ana Tomić'), sertifikat: 'PEST-CA-0004',
    izuzeci: {}, sektori: ['s5'], sviSektori: false,
  },
];

/* ---------------------------- Zaposleni ---------------------------- */

type Z = [string, string, string, string, string, string, string, number, number];
const zaposleniRed: Z[] = [
  // ime, prezime, radno mesto, org. jedinica, lokacija, cipele, konfekcija, lekarski(+dana), obuka(+dana)
  ['Miloš', 'Đorđević', 'Operater ekstrudera', 'Ekstruzija', 'Hala 1', '44', 'L', 210, 320],
  ['Jovana', 'Ристić', 'Kontrolor kvaliteta', 'Kontrola kvaliteta', 'Laboratorija', '39', 'S', 120, 40],
  ['Stefan', 'Nikolić', 'Bravar održavanja', 'Održavanje', 'Hala 2', '45', 'XL', 18, 150],
  ['Marko', 'Pavlović', 'Viljuškarista', 'Magacin', 'Magacin A', '43', 'L', 260, 12],
  ['Ivana', 'Milošević', 'Operater brizgalice', 'Brizganje', 'Hala 3', '38', 'M', 95, 200],
  ['Nenad', 'Simić', 'Alatničar', 'Alatnica', 'Alatnica', '44', 'L', 330, 280],
  ['Tijana', 'Vasić', 'Referent nabavke', 'Nabavka', 'Uprava', '37', 'S', 190, 95],
  ['Aleksandar', 'Lukić', 'Elektroinstalater', 'Održavanje', 'Hala 1', '46', 'XL', 55, -8],
  ['Danijela', 'Kostić', 'Pakerka', 'Ekstruzija', 'Hala 1', '38', 'M', 145, 175],
  ['Bojan', 'Radovanović', 'Vozač kamiona', 'Transport', 'Portirnica', '45', 'XXL', 75, 240],
  ['Sanja', 'Ilić', 'Magacioner', 'Magacin', 'Magacin B', '40', 'M', 300, 60],
  ['Filip', 'Janković', 'Operater CNC', 'Alatnica', 'Alatnica', '43', 'L', 230, 310],
  ['Katarina', 'Mitrović', 'Laborant', 'Kontrola kvaliteta', 'Laboratorija', '38', 'S', 165, 130],
  ['Zoran', 'Antić', 'Rukovodilac smene', 'Brizganje', 'Hala 3', '44', 'XL', 4, 85],
];

const idSektora = (naziv: string) => sektori.find((s) => s.naziv === naziv)?.id ?? sektori[0].id;

const zaposleni: Zaposleni[] = zaposleniRed.map((r, i) => ({
  id: `z${i + 1}`,
  ime: r[0],
  prezime: r[1] === 'Ристić' ? 'Ristić' : r[1],
  radnoMesto: r[2],
  sektorId: idSektora(r[3]),
  lokacija: r[4],
  email: `zaposleni${i + 1}@pestan.rs`,
  telefon: `06${(i % 6) + 2}/${300 + i}-${100 + i * 7}`,
  datumZaposlenja: pre(400 + i * 120),
  brojCipela: r[5],
  konfekcija: r[6],
  aktivan: true,
  lekarskiVazi: za(r[7]),
  obukaBzrVazi: za(r[8]),
}));

/* --------------------------- Kategorije --------------------------- */

const kategorije: Kategorija[] = [
  { id: 'k1', naziv: 'Zaštita glave', sifra: 'LZO-GL', tip: 'LZO', ikona: 'hard-hat', rokDana: 730, zahtevaOdobrenje: false, opis: 'Zaštitni šlemovi i kape sa školjkom.' },
  { id: 'k2', naziv: 'Zaštita očiju i lica', sifra: 'LZO-OC', tip: 'LZO', ikona: 'glasses', rokDana: 365, zahtevaOdobrenje: false, opis: 'Naočare, viziri, štitnici za zavarivanje.' },
  { id: 'k3', naziv: 'Zaštita sluha', sifra: 'LZO-SL', tip: 'LZO', ikona: 'ear', rokDana: 180, zahtevaOdobrenje: false, opis: 'Antifoni i čepići za uši.' },
  { id: 'k4', naziv: 'Zaštita disajnih organa', sifra: 'LZO-DI', tip: 'LZO', ikona: 'wind', rokDana: 90, zahtevaOdobrenje: false, opis: 'Maske, polumaske i filteri.' },
  { id: 'k5', naziv: 'Zaštita ruku', sifra: 'LZO-RU', tip: 'LZO', ikona: 'hand', rokDana: 30, zahtevaOdobrenje: false, opis: 'Rukavice po nameni i klasi zaštite.' },
  { id: 'k6', naziv: 'Zaštitna obuća', sifra: 'LZO-OB', tip: 'LZO', ikona: 'footprints', rokDana: 365, zahtevaOdobrenje: false, opis: 'Cipele i čizme sa kapnom i antiprobojnim ulošcima.' },
  { id: 'k7', naziv: 'Radna odeća', sifra: 'LZO-OD', tip: 'LZO', ikona: 'shirt', rokDana: 365, zahtevaOdobrenje: false, opis: 'Odela, bluze, pantalone, prsluci visoke vidljivosti.' },
  { id: 'k8', naziv: 'Rad na visini', sifra: 'LZO-VI', tip: 'LZO', ikona: 'anchor', rokDana: 180, zahtevaOdobrenje: true, opis: 'Pojasevi, amortizeri pada, užad i karabineri.' },
  { id: 'k9', naziv: 'Alat i uređaji', sifra: 'ALT', tip: 'ALAT', ikona: 'wrench', rokDana: 0, zahtevaOdobrenje: true, opis: 'Ručni i električni alat sa evidencijom pregleda.' },
  { id: 'k10', naziv: 'Potrošni materijal', sifra: 'POT', tip: 'POTROSNO', ikona: 'package', rokDana: 0, zahtevaOdobrenje: false, opis: 'Krema za ruke, ulošci za maske, sredstva za čišćenje.' },
];

/* ----------------------------- Oprema ----------------------------- */

type O = [string, string, string, string, string, string, number, number | null];
const opremaRed: O[] = [
  // naziv, kategorija, proizvođač, model, veličina, lokacija, količina, rok override
  ['Zaštitni šlem beli', 'k1', 'Uvex', 'Pheos B-WR', 'univ.', 'Magacin A', 1, null],
  ['Zaštitni šlem žuti', 'k1', 'Uvex', 'Pheos B-WR', 'univ.', 'Magacin A', 1, null],
  ['Zaštitni šlem plavi', 'k1', '3M', 'G3000', 'univ.', 'Magacin A', 1, null],
  ['Zaštitne naočare prozirne', 'k2', '3M', 'SecureFit 400', 'univ.', 'Magacin A', 1, null],
  ['Vizir za brusilicu', 'k2', 'Honeywell', 'Bionic', 'univ.', 'Alatnica', 1, null],
  ['Maska za zavarivanje', 'k2', 'ESAB', 'Sentinel A50', 'univ.', 'Alatnica', 1, 365],
  ['Antifoni naglavni', 'k3', '3M', 'Peltor X4A', 'univ.', 'Magacin A', 1, null],
  ['Čepići za uši (kutija)', 'k3', 'Uvex', 'Xact-fit', 'univ.', 'Magacin A', 24, null],
  ['Polumaska FFP3', 'k4', '3M', '8833', 'M', 'Magacin B', 40, null],
  ['Polumaska sa filterima A2P3', 'k4', 'Sundström', 'SR100', 'M', 'Magacin B', 1, 60],
  ['Rukavice nitril, klasa 4', 'k5', 'Ansell', 'HyFlex 11-840', '9', 'Magacin A', 60, null],
  ['Rukavice protiv posekotina', 'k5', 'Ansell', 'HyFlex 11-627', '10', 'Magacin A', 35, null],
  ['Rukavice termootporne', 'k5', 'Uvex', 'Profatherm', '10', 'Hala 3', 12, 45],
  ['Zaštitne cipele S3', 'k6', 'Portwest', 'Steelite', '44', 'Magacin A', 1, null],
  ['Zaštitne cipele S3', 'k6', 'Portwest', 'Steelite', '43', 'Magacin A', 1, null],
  ['Zaštitne cipele S1P', 'k6', 'Panda', 'Strong', '39', 'Magacin A', 1, null],
  ['Zaštitne čizme S5', 'k6', 'Dunlop', 'Purofort', '45', 'Magacin B', 1, null],
  ['Radno odelo dvodelno', 'k7', 'Portwest', 'Texo', 'L', 'Magacin A', 1, null],
  ['Radno odelo dvodelno', 'k7', 'Portwest', 'Texo', 'XL', 'Magacin A', 1, null],
  ['Prsluk visoke vidljivosti', 'k7', 'Portwest', 'HiVis C470', 'univ.', 'Portirnica', 18, null],
  ['Zimska jakna', 'k7', 'Portwest', 'Aviemore', 'L', 'Magacin B', 1, 730],
  ['Pojas za rad na visini', 'k8', 'Petzl', 'Avao Bod', 'univ.', 'Alatnica', 1, null],
  ['Amortizer pada sa užetom', 'k8', 'Petzl', 'Absorbica-Y', 'univ.', 'Alatnica', 1, 90],
  ['Karabiner sa navojem', 'k8', 'Petzl', 'Om Triact', 'univ.', 'Alatnica', 6, null],
  ['Ugaona brusilica 125 mm', 'k9', 'Bosch', 'GWS 750', '—', 'Alatnica', 1, null],
  ['Akumulatorska bušilica', 'k9', 'Makita', 'DHP482', '—', 'Alatnica', 1, null],
  ['Momentni ključ 40–200 Nm', 'k9', 'Gedore', 'Dremometer', '—', 'Alatnica', 1, 180],
  ['Digitalni multimetar', 'k9', 'Fluke', '117', '—', 'Održavanje', 1, null],
  ['Detektor gasa', 'k9', 'Dräger', 'X-am 2500', '—', 'Održavanje', 1, 180],
  ['Krema za zaštitu ruku', 'k10', 'Stokoderm', 'Universal', '100 ml', 'Magacin A', 45, null],
  ['Filter P3 rezervni', 'k10', 'Sundström', 'SR510', 'univ.', 'Magacin B', 22, null],
  ['Sredstvo za čišćenje vizira', 'k10', '3M', 'Lens cleaner', '500 ml', 'Magacin A', 3, null],
];

const oprema: Oprema[] = opremaRed.map((r, i) => {
  const kat = kategorije.find((k) => k.id === r[1])!;
  const potrosno = kat.tip === 'POTROSNO' || r[6] > 1;
  return {
    id: `o${i + 1}`,
    inv: `${kat.sifra}-${String(i + 1).padStart(4, '0')}`,
    naziv: r[0],
    kategorijaId: r[1],
    proizvodjac: r[2],
    model: r[3],
    serijski: potrosno ? '' : `SN${(918273 + i * 137).toString().slice(0, 6)}`,
    velicina: r[4],
    stanje: 'slobodno',
    lokacija: r[5],
    kolicina: r[6],
    minZaliha: potrosno ? Math.max(5, Math.round(r[6] * 0.25)) : 0,
    cena: 1200 + ((i * 2137) % 48000),
    datumNabavke: pre(60 + i * 23),
    atestVazi: kat.id === 'k8' || kat.id === 'k9' ? za(((i * 37) % 400) - 30) : null,
    rokDana: r[7],
    napomena: '',
  };
});

// Nekoliko komada namerno nije na stanju — servis, rezervacija, otpis.
oprema[24].stanje = 'servis';
oprema[24].napomena = 'Poslato na servis 14. u mesecu, zamenjene četkice.';
oprema[28].stanje = 'servis';
oprema[28].napomena = 'Kalibracija senzora kod ovlašćenog servisa.';
oprema[16].stanje = 'otpisano';
oprema[16].napomena = 'Probušen đon, otpisano po zapisniku 12/26.';
oprema[23].stanje = 'rezervisano';
oprema[31].kolicina = 1;

/* ---------------------------- Zaduženja ---------------------------- */

type ZadRed = {
  id: string; zap: string; stavke: [string, number][]; izdao: string;
  odobrio?: string | null; status: Zaduzenje['status']; potpisanPre: number | null;
  rokDana: number; napomena?: string;
};

const zadRed: ZadRed[] = [
  { id: '1', zap: 'z1', stavke: [['o1', 1], ['o14', 1], ['o18', 1]], izdao: 'n2', odobrio: 'n4', status: 'aktivno', potpisanPre: 312, rokDana: 365 },
  { id: '2', zap: 'z3', stavke: [['o11', 2]], izdao: 'n2', odobrio: null, status: 'aktivno', potpisanPre: 29, rokDana: 30, napomena: 'Redovna mesečna zamena rukavica.' },
  { id: '3', zap: 'z8', stavke: [['o22', 1], ['o23', 1]], izdao: 'n3', odobrio: 'n4', status: 'aktivno', potpisanPre: 179, rokDana: 180, napomena: 'Radovi na krovu hale 1.' },
  { id: '4', zap: 'z4', stavke: [['o20', 1], ['o15', 1]], izdao: 'n2', odobrio: null, status: 'aktivno', potpisanPre: 358, rokDana: 365 },
  { id: '5', zap: 'z5', stavke: [['o13', 2]], izdao: 'n3', odobrio: null, status: 'aktivno', potpisanPre: 44, rokDana: 45 },
  { id: '6', zap: 'z6', stavke: [['o25', 1], ['o26', 1]], izdao: 'n2', odobrio: 'n5', status: 'aktivno', potpisanPre: 120, rokDana: 0, napomena: 'Trajno zaduženje alatničara.' },
  { id: '7', zap: 'z2', stavke: [['o4', 1], ['o7', 1]], izdao: 'n2', odobrio: null, status: 'aktivno', potpisanPre: 95, rokDana: 365 },
  { id: '8', zap: 'z10', stavke: [['o9', 5]], izdao: 'n3', odobrio: null, status: 'aktivno', potpisanPre: 88, rokDana: 90 },
  { id: '9', zap: 'z12', stavke: [['o27', 1]], izdao: 'n2', odobrio: 'n4', status: 'aktivno', potpisanPre: 186, rokDana: 180, napomena: 'Rok probijen — momentni ključ nije vraćen na kalibraciju.' },
  { id: '10', zap: 'z9', stavke: [['o12', 2]], izdao: 'n3', odobrio: null, status: 'aktivno', potpisanPre: 36, rokDana: 30 },
  { id: '11', zap: 'z14', stavke: [['o10', 1], ['o31', 2]], izdao: 'n2', odobrio: null, status: 'aktivno', potpisanPre: 58, rokDana: 60 },
  { id: '12', zap: 'z13', stavke: [['o16', 1], ['o19', 1]], izdao: 'n3', odobrio: null, status: 'ceka_potpis', potpisanPre: null, rokDana: 365, napomena: 'Čeka se potpis primaoca — oprema je spremna u magacinu.' },
  { id: '13', zap: 'z11', stavke: [['o29', 1]], izdao: 'n2', odobrio: null, status: 'ceka_odobrenje', potpisanPre: null, rokDana: 180, napomena: 'Detektor gasa za ulazak u šaht.' },
  { id: '14', zap: 'z7', stavke: [['o21', 1]], izdao: 'n3', odobrio: null, status: 'ceka_odobrenje', potpisanPre: null, rokDana: 730 },
  { id: '15', zap: 'z10', stavke: [['o28', 1]], izdao: 'n3', odobrio: 'n4', status: 'odbijeno', potpisanPre: null, rokDana: 90, napomena: 'Multimetar traži elektro obuku.' },
  { id: '16', zap: 'z1', stavke: [['o30', 2]], izdao: 'n2', odobrio: null, status: 'razduzeno', potpisanPre: 210, rokDana: 90 },
  { id: '17', zap: 'z5', stavke: [['o3', 1]], izdao: 'n2', odobrio: null, status: 'razduzeno', potpisanPre: 400, rokDana: 730 },
  { id: '18', zap: 'z6', stavke: [['o24', 1]], izdao: 'n3', odobrio: 'n5', status: 'razduzeno', potpisanPre: 150, rokDana: 120 },
];

const imeNaloga = (id: string) => nalozi.find((n) => n.id === id)?.fullName ?? '';
const imeZaposlenog = (id: string) => {
  const z = zaposleni.find((x) => x.id === id)!;
  return `${z.ime} ${z.prezime}`;
};

const zaduzenja: Zaduzenje[] = zadRed.map((r, i) => {
  const signedAt = r.potpisanPre === null ? null : pre(r.potpisanPre, (i % 7) + 1);
  const dueAt = signedAt && r.rokDana > 0 ? new Date(new Date(signedAt).getTime() + r.rokDana * 86400000).toISOString() : null;
  const kreirano = signedAt ?? pre(2 + (i % 5), i);
  const izdavalac = nalozi.find((n) => n.id === r.izdao)!;
  return {
    id: `zd${r.id}`,
    broj: `ZAD-2026-${String(i + 1).padStart(4, '0')}`,
    zaposleniId: r.zap,
    sektorId: zaposleni.find((z) => z.id === r.zap)?.sektorId ?? '',
    stavke: r.stavke.map(([opremaId, kolicina]) => ({
      opremaId,
      kolicina,
      velicina: oprema.find((o) => o.id === opremaId)?.velicina ?? '',
    })),
    izdaoId: r.izdao,
    odobrioId: r.odobrio ?? null,
    odobrenoAt: r.odobrio ? pre((r.potpisanPre ?? 1) + 1) : null,
    razlogOdbijanja: r.status === 'odbijeno' ? 'Zaposleni nema važeću obuku za rad sa elektro opremom.' : null,
    status: r.status,
    createdAt: kreirano,
    signedAt,
    dueAt,
    rokDana: r.rokDana,
    potpisPrimaoca: signedAt ? demoPotpis(imeZaposlenog(r.zap)) : null,
    potpisIzdavaoca: signedAt ? izdavalac.potpis : null,
    digitalni: signedAt && izdavalac.sertifikat
      ? digitalni(izdavalac.fullName, izdavalac.sertifikat, signedAt)
      : null,
    napomena: r.napomena ?? '',
    produzenja: r.id === '9'
      ? [{ at: pre(30), dana: 30, ko: imeNaloga('n2'), razlog: 'Servis kalibracije pomeren za sledeći mesec.' }]
      : [],
  };
});

// Stanje opreme prati aktivna zaduženja.
for (const z of zaduzenja) {
  if (z.status !== 'aktivno' && z.status !== 'ceka_potpis') continue;
  for (const s of z.stavke) {
    const o = oprema.find((x) => x.id === s.opremaId);
    if (!o) continue;
    if (o.kolicina > 1) o.kolicina = Math.max(0, o.kolicina - s.kolicina);
    else if (o.stanje === 'slobodno') o.stanje = z.status === 'aktivno' ? 'zaduzeno' : 'rezervisano';
  }
}

/* --------------------------- Razduženja --------------------------- */

const razduzena = zaduzenja.filter((z) => z.status === 'razduzeno');
const razduzenja: Razduzenje[] = razduzena.map((z, i) => {
  const vracenoAt = pre(10 + i * 9);
  const primalac = nalozi.find((n) => n.id === (i === 2 ? 'n3' : 'n2'))!;
  return {
    id: `rz${i + 1}`,
    broj: `RAZ-2026-${String(i + 1).padStart(4, '0')}`,
    zaduzenjeId: z.id,
    vracenoAt,
    primioId: primalac.id,
    stanje: i === 1 ? 'habanje' : i === 2 ? 'osteceno' : 'ispravno',
    potpisVratioca: demoPotpis(imeZaposlenog(z.zaposleniId) + '-raz'),
    potpisPrimaoca: primalac.potpis,
    digitalni: primalac.sertifikat ? digitalni(primalac.fullName, primalac.sertifikat, vracenoAt) : null,
    napomena: i === 2 ? 'Karabiner ima vidljivo oštećenje navoja — izdvojen iz upotrebe.' : '',
  };
});

/* ---------------------------- Kontrole ---------------------------- */

const stavkeLzo = (): Kontrola['stavke'] => [
  { pitanje: 'Oprema je kompletna i u ispravnom stanju', ok: true, napomena: '' },
  { pitanje: 'Oznake i atest su čitljivi', ok: true, napomena: '' },
  { pitanje: 'Rok upotrebe nije istekao', ok: true, napomena: '' },
  { pitanje: 'Zaposleni je obučen za korišćenje', ok: true, napomena: '' },
  { pitanje: 'Oprema se čuva na propisan način', ok: null, napomena: '' },
];

const kontroleRed: [string, Kontrola['tip'], string, string, string, number, number | null, Kontrola['nalaz'] | null][] = [
  ['Periodični pregled opreme za rad na visini', 'periodicni', 'Pojas Petzl Avao Bod', 'Alatnica', 'n2', -12, -12, 'uredno'],
  ['Kontrola nošenja LZO — hala 1', 'lzo', 'Ekstruzija, prva smena', 'Hala 1', 'n3', -6, -6, 'primedbe'],
  ['Pregled radnog mesta — brizgalica 3', 'radno_mesto', 'Brizgalica BM-03', 'Hala 3', 'n2', -3, -3, 'neispravno'],
  ['Provera obučenosti novozaposlenih', 'obuka', '4 zaposlena', 'Uprava', 'n4', -20, -20, 'uredno'],
  ['Kontrola nošenja LZO — magacin', 'lzo', 'Magacin A i B', 'Magacin', 'n3', 1, null, null],
  ['Periodični pregled detektora gasa', 'periodicni', 'Dräger X-am 2500', 'Održavanje', 'n2', 4, null, null],
  ['Pregled protivpožarnih aparata', 'periodicni', 'Aparati S-9, hala 2', 'Hala 2', 'n2', 9, null, null],
  ['Kontrola LZO u transportu', 'lzo', 'Vozači i utovar', 'Portirnica', 'n3', 21, null, null],
];

const kontrole: Kontrola[] = kontroleRed.map((r, i) => {
  const stavke = stavkeLzo();
  if (r[7] === 'primedbe') {
    stavke[3] = { pitanje: stavke[3].pitanje, ok: false, napomena: 'Dvojica zaposlenih bez antifona kod linije 2.' };
  }
  if (r[7] === 'neispravno') {
    stavke[0] = { pitanje: stavke[0].pitanje, ok: false, napomena: 'Zaštitna ograda demontirana i nije vraćena.' };
    stavke[4] = { pitanje: stavke[4].pitanje, ok: false, napomena: 'Prolaz zakrčen paletama.' };
  }
  const izvrseno = r[6] === null ? null : pre(Math.abs(r[6]));
  return {
    id: `kt${i + 1}`,
    broj: `KON-2026-${String(i + 1).padStart(3, '0')}`,
    naziv: r[0],
    tip: r[1],
    predmet: r[2],
    lokacija: r[3],
    zaduzenId: r[4],
    planiranoZa: r[5] < 0 ? pre(Math.abs(r[5])) : za(r[5]),
    izvrsenoAt: izvrseno,
    nalaz: r[7],
    stavke: izvrseno ? stavke : stavke.map((s) => ({ ...s, ok: null })),
    potpis: izvrseno ? nalozi.find((n) => n.id === r[4])?.potpis ?? null : null,
    napomena: r[7] === 'neispravno' ? 'Zaustaviti mašinu do vraćanja zaštitne ograde.' : '',
  };
});

/* ----------------------------- Kartoni ----------------------------- */

// Karton postoji za svakog zaposlenog koji je već nešto zadužio.
// z7 i z11 namerno ostaju bez kartona, da se u demou vidi otvaranje novog.
const bezKartona = ['z7', 'z11'];
const saZaduzenjem = Array.from(new Set(zaduzenja.map((z) => z.zaposleniId))).filter(
  (id) => !bezKartona.includes(id),
);
const kartoni: Karton[] = saZaduzenjem.map((zapId, i) => {
  const kreiraoId = i % 2 === 0 ? 'n2' : 'n3';
  const usluzilac = nalozi.find((n) => n.id === kreiraoId)!;
  return {
    id: `kr${i + 1}`,
    broj: `KRT-2026-${String(i + 1).padStart(4, '0')}`,
    zaposleniId: zapId,
    kreiranAt: pre(420 - i * 9),
    kreiraoId,
    potpisZaposlenog: demoPotpis(`${imeZaposlenog(zapId)}-karton`),
    potpisUsluzioca: usluzilac.potpis,
    potpisLicaBzr: nalozi[0].potpis,
    liceZaBzr: 'Nikola Ivanović',
    napomena: '',
  };
});

/* ------------------------------ Pošta ------------------------------ */

const sabloni: Sablon[] = [
  {
    id: 's1', naziv: 'Potvrda o zaduženju', okidac: 'Potpisano zaduženje', aktivan: true,
    tema: 'Potvrda o zaduženju opreme {{broj}}',
    telo: 'Poštovani {{zaposleni}},\n\nevidentirano je zaduženje {{broj}} od {{datum}}.\nStavke: {{stavke}}\nRok vraćanja: {{rok}}.\n\nPotpisani primerak nalazi se u vašem ličnom kartonu.\n\nSlužba bezbednosti i zdravlja na radu\n{{firma}}',
  },
  {
    id: 's2', naziv: 'Podsetnik pred istek roka', okidac: 'N dana pre isteka', aktivan: true,
    tema: 'Podsetnik: rok zaduženja {{broj}} ističe za {{danaDo}}',
    telo: 'Poštovani {{zaposleni}},\n\nrok zaduženja {{broj}} ističe {{rok}}.\nMolimo da opremu vratite u magacin ili zatražite produženje kod uslužioca.\n\nSlužba bezbednosti i zdravlja na radu',
  },
  {
    id: 's3', naziv: 'Obaveštenje o isteklom roku', okidac: 'Rok istekao', aktivan: true,
    tema: 'Istekao rok zaduženja {{broj}}',
    telo: 'Poštovani {{zaposleni}},\n\nrok zaduženja {{broj}} je istekao {{rok}}.\nZaduženje je označeno kao probijeno i vidljivo je rukovodiocu.\n\nSlužba bezbednosti i zdravlja na radu',
  },
  {
    id: 's4', naziv: 'Zahtev za odobrenje', okidac: 'Novi zahtev', aktivan: true,
    tema: 'Zahtev za odobrenje izdavanja opreme {{broj}}',
    telo: 'Poštovani,\n\npodnet je zahtev {{broj}} za izdavanje opreme zaposlenom {{zaposleni}}.\nPodnosilac: {{izdao}}.\n\nZahtev možete odobriti u portalu, u odeljku Odobrenja.',
  },
  {
    id: 's5', naziv: 'Nalaz kontrole', okidac: 'Zaključena kontrola', aktivan: false,
    tema: 'Nalaz kontrole {{broj}} — {{nalaz}}',
    telo: 'Kontrola {{broj}} ({{naziv}}) zaključena je sa nalazom: {{nalaz}}.\nPrimedbe i mere nalaze se u prilogu zapisnika.',
  },
];

const mailRed: [string, string, string, string, Mail['status'], number, string | null][] = [
  ['z1', 's1', 'Potvrda o zaduženju opreme ZAD-2026-0001', 'Evidentirano zaduženje sa rokom vraćanja.', 'poslato', 312, 'zd1'],
  ['z12', 's3', 'Istekao rok zaduženja ZAD-2026-0009', 'Momentni ključ nije vraćen na kalibraciju.', 'poslato', 6, 'zd9'],
  ['z9', 's3', 'Istekao rok zaduženja ZAD-2026-0010', 'Rok za zamenu rukavica je probijen.', 'poslato', 6, 'zd10'],
  ['z3', 's2', 'Podsetnik: rok zaduženja ZAD-2026-0002 ističe za 1 dan', 'Rukavice nitril, klasa 4 — zamena sutra.', 'poslato', 1, 'zd2'],
  ['z5', 's2', 'Podsetnik: rok zaduženja ZAD-2026-0005 ističe za 1 dan', 'Termootporne rukavice — zamena sutra.', 'poslato', 1, 'zd5'],
  ['z11', 's4', 'Zahtev za odobrenje izdavanja opreme ZAD-2026-0013', 'Detektor gasa za ulazak u šaht.', 'poslato', 2, 'zd13'],
  ['z13', 's1', 'Oprema spremna za preuzimanje — ZAD-2026-0012', 'Cipele i radno odelo čekaju potpis u magacinu.', 'u_redu', 0, 'zd12'],
  ['z10', 's3', 'Istekao rok zaduženja ZAD-2026-0008', 'Polumaske FFP3 — obavezna zamena.', 'greska', 3, 'zd8'],
];

const mailovi: Mail[] = mailRed.map((r, i) => {
  const z = zaposleni.find((x) => x.id === r[0])!;
  const sablon = sabloni.find((s) => s.id === r[1])!;
  return {
    id: `m${i + 1}`,
    za: z.email,
    zaIme: `${z.ime} ${z.prezime}`,
    tema: r[2],
    telo: `${r[3]}\n\n${sablon.telo.split('\n').slice(-3).join('\n')}`,
    sablonId: r[1],
    status: r[4],
    createdAt: pre(r[5], i),
    vezano: r[6],
  };
});

/* ------------------------------ Logovi ------------------------------ */

const logRed: [string, string, string, string, number][] = [
  ['n2', 'Potpisano zaduženje', 'ZAD-2026-0012', 'Pripremljeno zaduženje čeka potpis primaoca.', 0],
  ['n4', 'Odobren zahtev', 'ZAD-2026-0003', 'Odobreno izdavanje opreme za rad na visini.', 1],
  ['n1', 'Izmenjena prava', 'Nalog d.petrovic', 'Oduzeto pravo „Slanje e-pošte".', 1],
  ['n2', 'Dodata oprema', 'LZO-DI-0010', 'Polumaska Sundström SR100 upisana u inventar.', 2],
  ['n3', 'Sprovedena kontrola', 'KON-2026-003', 'Nalaz: neispravno — zaustavljena brizgalica BM-03.', 3],
  ['n1', 'Promenjena podešavanja', 'Rokovi', 'Upozorenje pomereno sa 5 na 7 dana.', 4],
  ['n4', 'Odbijen zahtev', 'ZAD-2026-0015', 'Zaposleni nema važeću elektro obuku.', 5],
  ['n2', 'Razduženje', 'RAZ-2026-0003', 'Karabiner vraćen oštećen, izdvojen iz upotrebe.', 10],
  ['n1', 'Kreiran nalog', 'Nalog v.markovic', 'Uloga: Odobrilac. Obavezna promena lozinke.', 150],
  ['n5', 'Prijava', 'Portal', 'Prva prijava sa privremenom lozinkom.', 4],
];

const logovi = logRed.map((r, i) => ({
  id: `l${i + 1}`,
  at: pre(r[4], i + 1),
  ko: imeNaloga(r[0]),
  akcija: r[1],
  entitet: r[2],
  detalj: r[3],
}));

/* ---------------------------- Cela baza ---------------------------- */

export function napraviBazu(): Baza {
  return {
    nalozi,
    zaposleni,
    sektori,
    kategorije,
    oprema,
    zaduzenja,
    razduzenja,
    kontrole,
    kartoni,
    mailovi,
    sabloni,
    logovi,
    pravaUloga: {
      admin: [...PODRAZUMEVANA_PRAVA.admin],
      usluzilac: [...PODRAZUMEVANA_PRAVA.usluzilac],
      odobrilac: [...PODRAZUMEVANA_PRAVA.odobrilac],
    },
    podesavanja: {
      firma: {
        naziv: 'Peštan d.o.o.',
        pib: '101040297',
        maticni: '07599719',
        adresa: 'Bukovički put bb, 34300 Aranđelovac',
        liceZaBzr: 'Nikola Ivanović',
        licenca: '164-02-00123/2019-01',
      },
      rokovi: { upozorenjeDana: 7, kriticnoDana: 2, podsetnikMailom: true },
      potpisi: {
        obavezanPriZaduzenju: true,
        obavezanPriRazduzenju: true,
        digitalniPotpisAktivan: true,
        cuvajOtisak: true,
      },
      mail: {
        posiljalac: 'bzr@pestan.rs',
        smtp: 'smtp.pestan.rs',
        port: 587,
        automatskaObavestenja: true,
        kopijaBzrLicu: true,
      },
    },
  };
}
