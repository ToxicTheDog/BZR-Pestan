/* Model podataka portala. Frontend faza — sve živi u demo skladištu. */

export type Role = 'admin' | 'usluzilac' | 'odobrilac';

/** Jedno pravo = jedna radnja koju nalog sme da uradi. */
export type Permission =
  | 'inventar.vidi'
  | 'inventar.upis'
  | 'inventar.brisanje'
  | 'zaduzenja.vidi'
  | 'zaduzenja.izdaj'
  | 'zaduzenja.razduzi'
  | 'zaduzenja.produzi'
  | 'odobrenja.vidi'
  | 'odobrenja.odlucuj'
  | 'kontrole.vidi'
  | 'kontrole.sprovedi'
  | 'kartoni.vidi'
  | 'kartoni.upis'
  | 'zaposleni.vidi'
  | 'zaposleni.upis'
  | 'mail.vidi'
  | 'mail.posalji'
  | 'nalozi.upravljaj'
  | 'podesavanja.upravljaj'
  | 'logovi.vidi';

export type Nalog = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  telefon: string;
  role: Role;
  aktivan: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  /** Potpis u aplikaciji — data URL sa canvasa. */
  potpis: string | null;
  /** Serijski broj demo sertifikata za digitalni potpis. */
  sertifikat: string | null;
  /** Izuzeci koje admin postavlja pojedinačno, preko prava uloge. */
  izuzeci: Partial<Record<Permission, boolean>>;
};

export type Zaposleni = {
  id: string;
  ime: string;
  prezime: string;
  radnoMesto: string;
  organizacionaJedinica: string;
  lokacija: string;
  email: string;
  telefon: string;
  datumZaposlenja: string;
  brojCipela: string;
  konfekcija: string;
  aktivan: boolean;
  lekarskiVazi: string | null;
  obukaBzrVazi: string | null;
};

export type TipKategorije = 'LZO' | 'ALAT' | 'POTROSNO';

export type Kategorija = {
  id: string;
  naziv: string;
  sifra: string;
  tip: TipKategorije;
  ikona: string;
  /** Podrazumevani rok zaduženja u danima; 0 = trajno zaduženje. */
  rokDana: number;
  zahtevaOdobrenje: boolean;
  opis: string;
};

export type StanjeOpreme = 'slobodno' | 'zaduzeno' | 'servis' | 'rezervisano' | 'otpisano';

export type Oprema = {
  id: string;
  inv: string;
  naziv: string;
  kategorijaId: string;
  proizvodjac: string;
  model: string;
  serijski: string;
  velicina: string;
  stanje: StanjeOpreme;
  lokacija: string;
  kolicina: number;
  minZaliha: number;
  cena: number;
  datumNabavke: string;
  atestVazi: string | null;
  /** Override roka iz kategorije; null = nasleđuje kategoriju. */
  rokDana: number | null;
  napomena: string;
};

export type StatusZaduzenja =
  | 'ceka_odobrenje'
  | 'odbijeno'
  | 'ceka_potpis'
  | 'aktivno'
  | 'razduzeno';

export type StavkaZaduzenja = {
  opremaId: string;
  kolicina: number;
  velicina: string;
};

export type DigitalniPotpis = {
  potpisnik: string;
  sertifikat: string;
  otisak: string;
  vreme: string;
};

export type Zaduzenje = {
  id: string;
  broj: string;
  zaposleniId: string;
  stavke: StavkaZaduzenja[];
  izdaoId: string;
  odobrioId: string | null;
  odobrenoAt: string | null;
  razlogOdbijanja: string | null;
  status: StatusZaduzenja;
  createdAt: string;
  /** Trenutak potpisa primaoca — odatle kreće odbrojavanje. */
  signedAt: string | null;
  dueAt: string | null;
  rokDana: number;
  potpisPrimaoca: string | null;
  potpisIzdavaoca: string | null;
  digitalni: DigitalniPotpis | null;
  napomena: string;
  produzenja: { at: string; dana: number; ko: string; razlog: string }[];
};

export type StanjeVracene = 'ispravno' | 'habanje' | 'osteceno' | 'nestalo';

export type Razduzenje = {
  id: string;
  broj: string;
  zaduzenjeId: string;
  vracenoAt: string;
  primioId: string;
  stanje: StanjeVracene;
  potpisVratioca: string | null;
  potpisPrimaoca: string | null;
  digitalni: DigitalniPotpis | null;
  napomena: string;
};

export type TipKontrole = 'periodicni' | 'lzo' | 'radno_mesto' | 'obuka';
export type NalazKontrole = 'uredno' | 'primedbe' | 'neispravno';

export type StavkaKontrole = { pitanje: string; ok: boolean | null; napomena: string };

export type Kontrola = {
  id: string;
  broj: string;
  naziv: string;
  tip: TipKontrole;
  predmet: string;
  lokacija: string;
  zaduzenId: string;
  planiranoZa: string;
  izvrsenoAt: string | null;
  nalaz: NalazKontrole | null;
  stavke: StavkaKontrole[];
  potpis: string | null;
  napomena: string;
};

export type StatusMaila = 'poslato' | 'u_redu' | 'greska';

export type Mail = {
  id: string;
  za: string;
  zaIme: string;
  tema: string;
  telo: string;
  sablonId: string | null;
  status: StatusMaila;
  createdAt: string;
  vezano: string | null;
};

export type Sablon = {
  id: string;
  naziv: string;
  tema: string;
  telo: string;
  okidac: string;
  aktivan: boolean;
};

export type Log = {
  id: string;
  at: string;
  ko: string;
  akcija: string;
  entitet: string;
  detalj: string;
};

export type Podesavanja = {
  firma: {
    naziv: string;
    pib: string;
    maticni: string;
    adresa: string;
    liceZaBzr: string;
    licenca: string;
  };
  rokovi: {
    /** Koliko dana pre isteka se pali upozorenje. */
    upozorenjeDana: number;
    /** Koliko dana pre isteka je stanje kritično. */
    kriticnoDana: number;
    podsetnikMailom: boolean;
  };
  potpisi: {
    obavezanPriZaduzenju: boolean;
    obavezanPriRazduzenju: boolean;
    digitalniPotpisAktivan: boolean;
    cuvajOtisak: boolean;
  };
  mail: {
    posiljalac: string;
    smtp: string;
    port: number;
    automatskaObavestenja: boolean;
    kopijaBzrLicu: boolean;
  };
};

export type Baza = {
  nalozi: Nalog[];
  zaposleni: Zaposleni[];
  kategorije: Kategorija[];
  oprema: Oprema[];
  zaduzenja: Zaduzenje[];
  razduzenja: Razduzenje[];
  kontrole: Kontrola[];
  mailovi: Mail[];
  sabloni: Sablon[];
  logovi: Log[];
  /** Prava po ulozi — admin ih menja u Podešavanjima. */
  pravaUloga: Record<Role, Permission[]>;
  podesavanja: Podesavanja;
};
