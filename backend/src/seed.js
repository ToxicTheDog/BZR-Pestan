/**
 * Početni sadržaj baze. Pokreće se samo kad JSON fajl ne postoji
 * (ili ručno: `npm run seed -- --force`).
 */
import bcrypt from 'bcryptjs';
import { PODRAZUMEVANA_PRAVA } from './prava.js';

const sada = () => new Date().toISOString();
const pre = (dana) => new Date(Date.now() - dana * 86400000).toISOString();
const za = (dana) => new Date(Date.now() + dana * 86400000).toISOString();

const hes = (l) => bcrypt.hashSync(l, 10);

export function pocetnaBaza() {
  return {
    sektori: [
      { id: 's1', naziv: 'Ekstruzija', sifra: 'EKS', opis: 'Linije za ekstruziju cevi.', aktivan: true },
      { id: 's2', naziv: 'Kontrola kvaliteta', sifra: 'KVL', opis: 'Laboratorija i kontrola proizvoda.', aktivan: true },
      { id: 's3', naziv: 'Održavanje', sifra: 'ODR', opis: 'Mašinsko i elektro održavanje.', aktivan: true },
    ],

    nalozi: [
      {
        id: 'n1', username: 'admin', fullName: 'Nikola Ivanović',
        email: 'nikola.ivanovic@pestan.rs', telefon: '034/700-121', role: 'admin',
        aktivan: true, createdAt: pre(420), lastLoginAt: null, mustChangePassword: false,
        potpis: null, sertifikat: 'PEST-CA-0001', izuzeci: {}, lozinkaHes: hes('demo1234'),
        sektori: [], sviSektori: true,
      },
      {
        id: 'n2', username: 'm.stankovic', fullName: 'Marija Stanković',
        email: 'marija.stankovic@pestan.rs', telefon: '034/700-145', role: 'usluzilac',
        aktivan: true, createdAt: pre(390), lastLoginAt: null, mustChangePassword: false,
        potpis: null, sertifikat: 'PEST-CA-0014', izuzeci: {}, lozinkaHes: hes('demo1234'),
        sektori: ['s1', 's2'], sviSektori: false,
      },
      {
        id: 'n3', username: 's.jovanovic', fullName: 'Sonja Jovanović',
        email: 'sonja.jovanovic@pestan.rs', telefon: '034/700-118', role: 'odobrilac',
        aktivan: true, createdAt: pre(365), lastLoginAt: null, mustChangePassword: false,
        potpis: null, sertifikat: 'PEST-CA-0008', izuzeci: {}, lozinkaHes: hes('demo1234'),
        sektori: ['s3'], sviSektori: false,
      },
    ],

    zaposleni: [
      {
        id: 'z1', ime: 'Miloš', prezime: 'Đorđević', radnoMesto: 'Operater ekstrudera',
        sektorId: 's1', lokacija: 'Hala 1', email: 'zaposleni1@pestan.rs',
        telefon: '062/300-100', datumZaposlenja: pre(760), brojCipela: '44', konfekcija: 'L',
        aktivan: true, lekarskiVazi: za(210), obukaBzrVazi: za(320),
      },
      {
        id: 'z2', ime: 'Jovana', prezime: 'Ristić', radnoMesto: 'Kontrolor kvaliteta',
        sektorId: 's2', lokacija: 'Laboratorija', email: 'zaposleni2@pestan.rs',
        telefon: '063/301-107', datumZaposlenja: pre(520), brojCipela: '39', konfekcija: 'S',
        aktivan: true, lekarskiVazi: za(120), obukaBzrVazi: za(40),
      },
      {
        id: 'z3', ime: 'Stefan', prezime: 'Nikolić', radnoMesto: 'Bravar održavanja',
        sektorId: 's3', lokacija: 'Hala 2', email: 'zaposleni3@pestan.rs',
        telefon: '064/302-114', datumZaposlenja: pre(640), brojCipela: '45', konfekcija: 'XL',
        aktivan: true, lekarskiVazi: za(18), obukaBzrVazi: za(150),
      },
    ],

    kategorije: [
      { id: 'k1', naziv: 'Zaštita glave', sifra: 'LZO-GL', tip: 'LZO', ikona: 'hard-hat', rokDana: 730, zahtevaOdobrenje: false, opis: 'Zaštitni šlemovi i kape sa školjkom.' },
      { id: 'k5', naziv: 'Zaštita ruku', sifra: 'LZO-RU', tip: 'LZO', ikona: 'hand', rokDana: 30, zahtevaOdobrenje: false, opis: 'Rukavice po nameni i klasi zaštite.' },
      { id: 'k6', naziv: 'Zaštitna obuća', sifra: 'LZO-OB', tip: 'LZO', ikona: 'footprints', rokDana: 365, zahtevaOdobrenje: false, opis: 'Cipele i čizme sa kapnom.' },
      { id: 'k9', naziv: 'Alat i uređaji', sifra: 'ALT', tip: 'ALAT', ikona: 'wrench', rokDana: 0, zahtevaOdobrenje: true, opis: 'Ručni i električni alat sa evidencijom pregleda.' },
    ],

    oprema: [
      { id: 'o1', inv: 'LZO-GL-0001', naziv: 'Zaštitni šlem beli', kategorijaId: 'k1', proizvodjac: 'Uvex', model: 'Pheos B-WR', serijski: 'SN918273', velicina: 'univ.', stanje: 'slobodno', lokacija: 'Magacin A', kolicina: 1, minZaliha: 0, cena: 3400, datumNabavke: pre(120), atestVazi: null, rokDana: null, napomena: '' },
      { id: 'o2', inv: 'LZO-RU-0002', naziv: 'Rukavice nitril, klasa 4', kategorijaId: 'k5', proizvodjac: 'Ansell', model: 'HyFlex 11-840', serijski: '', velicina: '9', stanje: 'slobodno', lokacija: 'Magacin A', kolicina: 60, minZaliha: 15, cena: 890, datumNabavke: pre(60), atestVazi: null, rokDana: null, napomena: '' },
      { id: 'o3', inv: 'LZO-OB-0003', naziv: 'Zaštitne cipele S3', kategorijaId: 'k6', proizvodjac: 'Portwest', model: 'Steelite', serijski: 'SN918410', velicina: '44', stanje: 'slobodno', lokacija: 'Magacin A', kolicina: 1, minZaliha: 0, cena: 8900, datumNabavke: pre(200), atestVazi: null, rokDana: null, napomena: '' },
      { id: 'o4', inv: 'ALT-0004', naziv: 'Detektor gasa', kategorijaId: 'k9', proizvodjac: 'Dräger', model: 'X-am 2500', serijski: 'SN918547', velicina: '—', stanje: 'servis', lokacija: 'Održavanje', kolicina: 1, minZaliha: 0, cena: 74000, datumNabavke: pre(400), atestVazi: za(160), rokDana: 180, napomena: 'Kalibracija senzora.' },
    ],

    // Kolekcije koje čekaju svoje rute u sledećem koraku.
    zaduzenja: [],
    razduzenja: [],
    kontrole: [],
    kartoni: [],
    mailovi: [],
    sabloni: [],

    logovi: [
      { id: 'l1', at: sada(), ko: 'sistem', akcija: 'Inicijalizacija', entitet: 'Baza', detalj: 'Napravljena početna baza sa demo nalozima.' },
    ],

    pravaUloga: {
      admin: [...PODRAZUMEVANA_PRAVA.admin],
      usluzilac: [...PODRAZUMEVANA_PRAVA.usluzilac],
      odobrilac: [...PODRAZUMEVANA_PRAVA.odobrilac],
    },

    podesavanja: {
      firma: {
        naziv: 'Peštan d.o.o.', pib: '101040297', maticni: '07599719',
        adresa: 'Bukovički put bb, 34300 Aranđelovac',
        liceZaBzr: 'Nikola Ivanović', licenca: '164-02-00123/2019-01',
      },
      rokovi: { upozorenjeDana: 7, kriticnoDana: 2, podsetnikMailom: true },
      potpisi: { obavezanPriZaduzenju: true, obavezanPriRazduzenju: true, digitalniPotpisAktivan: true, cuvajOtisak: true },
      mail: { posiljalac: 'bzr@pestan.rs', smtp: 'smtp.pestan.rs', port: 587, automatskaObavestenja: true, kopijaBzrLicu: true },
    },
  };
}

// `npm run seed -- --force` prepisuje postojeću bazu.
if (process.argv.includes('--force')) {
  const { konfig } = await import('./konfig.js');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(konfig.bazaPutanja), { recursive: true });
  writeFileSync(konfig.bazaPutanja, JSON.stringify(pocetnaBaza(), null, 2), 'utf8');
  console.log(`Baza je ispisana u ${konfig.bazaPutanja}`);
}
