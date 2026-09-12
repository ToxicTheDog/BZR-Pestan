import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import type {
  Baza, Kategorija, Kontrola, Mail, Nalog, Oprema, Permission, Podesavanja, Razduzenje,
  Role, Sablon, StanjeVracene, Zaduzenje, Zaposleni,
} from './types';
import { napraviBazu } from '../demo/seed';
import { imaPravo } from './permissions';
import { otisak } from './format';

const KLJUC = 'bzr-pestan-demo-v1';
const KLJUC_SESIJA = 'bzr-pestan-sesija-v1';

function ucitaj(): Baza {
  try {
    const sirovo = localStorage.getItem(KLJUC);
    if (sirovo) return JSON.parse(sirovo) as Baza;
  } catch {
    /* pokvaren zapis — vraćamo se na sveže demo podatke */
  }
  return napraviBazu();
}

const id = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function sledeciBroj(prefix: string, postojeci: string[]): string {
  const godina = new Date().getFullYear();
  const brojevi = postojeci
    .map((b) => Number(b.split('-').pop()))
    .filter((n) => Number.isFinite(n)) as number[];
  const sledeci = (brojevi.length ? Math.max(...brojevi) : 0) + 1;
  return `${prefix}-${godina}-${String(sledeci).padStart(4, '0')}`;
}

type NovoZaduzenjeUlaz = {
  zaposleniId: string;
  stavke: Zaduzenje['stavke'];
  rokDana: number;
  napomena: string;
  trebaOdobrenje: boolean;
};

type Akcije = {
  /* inventar */
  dodajOpremu: (o: Omit<Oprema, 'id'>) => Oprema;
  izmeniOpremu: (id: string, izmene: Partial<Oprema>) => void;
  obrisiOpremu: (id: string) => void;
  izmeniKategoriju: (id: string, izmene: Partial<Kategorija>) => void;
  dodajKategoriju: (k: Omit<Kategorija, 'id'>) => void;
  /* zaposleni */
  dodajZaposlenog: (z: Omit<Zaposleni, 'id'>) => void;
  izmeniZaposlenog: (id: string, izmene: Partial<Zaposleni>) => void;
  /* zaduženja */
  napraviZaduzenje: (ulaz: NovoZaduzenjeUlaz) => Zaduzenje;
  potpisiZaduzenje: (id: string, potpisPrimaoca: string, potpisIzdavaoca: string | null) => void;
  odobriZaduzenje: (id: string) => void;
  odbijZaduzenje: (id: string, razlog: string) => void;
  produziZaduzenje: (id: string, dana: number, razlog: string) => void;
  razduzi: (
    zaduzenjeId: string,
    podaci: { stanje: StanjeVracene; napomena: string; potpisVratioca: string; potpisPrimaoca: string | null },
  ) => Razduzenje;
  /* kontrole */
  dodajKontrolu: (k: Omit<Kontrola, 'id' | 'broj'>) => void;
  zakljuciKontrolu: (
    id: string,
    podaci: { stavke: Kontrola['stavke']; nalaz: Kontrola['nalaz']; napomena: string; potpis: string | null },
  ) => void;
  /* pošta */
  posaljiMail: (m: Omit<Mail, 'id' | 'createdAt' | 'status'>) => void;
  izmeniSablon: (id: string, izmene: Partial<Sablon>) => void;
  /* nalozi i konfiguracija */
  dodajNalog: (n: Omit<Nalog, 'id' | 'createdAt' | 'lastLoginAt' | 'izuzeci' | 'potpis' | 'sertifikat'>) => void;
  izmeniNalog: (id: string, izmene: Partial<Nalog>) => void;
  obrisiNalog: (id: string) => void;
  postaviIzuzetak: (nalogId: string, pravo: Permission, vrednost: boolean | undefined) => void;
  postaviPravoUloge: (uloga: Role, pravo: Permission, ukljuceno: boolean) => void;
  izmeniPodesavanja: (izmene: Partial<Podesavanja>) => void;
  /* ostalo */
  upisiLog: (akcija: string, entitet: string, detalj: string) => void;
  resetDemo: () => void;
};

type Ctx = {
  baza: Baza;
  akcije: Akcije;
  /* sesija */
  ja: Nalog | null;
  prijava: (username: string, lozinka: string) => { ok: true } | { ok: false; greska: string };
  odjava: () => void;
  smem: (pravo: Permission) => boolean;
};

const StoreCtx = createContext<Ctx>(null as unknown as Ctx);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [baza, setBaza] = useState<Baza>(ucitaj);
  const [jaId, setJaId] = useState<string | null>(() => localStorage.getItem(KLJUC_SESIJA));

  useEffect(() => {
    try {
      localStorage.setItem(KLJUC, JSON.stringify(baza));
    } catch {
      /* prepun storage — demo i dalje radi u memoriji */
    }
  }, [baza]);

  useEffect(() => {
    if (jaId) localStorage.setItem(KLJUC_SESIJA, jaId);
    else localStorage.removeItem(KLJUC_SESIJA);
  }, [jaId]);

  const ja = useMemo(() => baza.nalozi.find((n) => n.id === jaId) ?? null, [baza.nalozi, jaId]);

  /** Log se piše uz svaku akciju, isto kao što će raditi i backend. */
  const saLogom = useCallback(
    (b: Baza, akcija: string, entitet: string, detalj: string, ko?: string): Baza => ({
      ...b,
      logovi: [
        { id: id('l'), at: new Date().toISOString(), ko: ko ?? 'sistem', akcija, entitet, detalj },
        ...b.logovi,
      ].slice(0, 400),
    }),
    [],
  );

  const akcije = useMemo<Akcije>(() => {
    const koSam = () => ja?.fullName ?? 'sistem';

    return {
      dodajOpremu(o) {
        const nova: Oprema = { ...o, id: id('o') };
        setBaza((b) =>
          saLogom({ ...b, oprema: [nova, ...b.oprema] }, 'Dodata oprema', nova.inv, `${nova.naziv} upisana u inventar.`, koSam()),
        );
        return nova;
      },

      izmeniOpremu(opremaId, izmene) {
        setBaza((b) => {
          const stara = b.oprema.find((o) => o.id === opremaId);
          return saLogom(
            { ...b, oprema: b.oprema.map((o) => (o.id === opremaId ? { ...o, ...izmene } : o)) },
            'Izmenjena oprema',
            stara?.inv ?? opremaId,
            Object.keys(izmene).join(', '),
            koSam(),
          );
        });
      },

      obrisiOpremu(opremaId) {
        setBaza((b) => {
          const stara = b.oprema.find((o) => o.id === opremaId);
          return saLogom(
            { ...b, oprema: b.oprema.filter((o) => o.id !== opremaId) },
            'Obrisana oprema',
            stara?.inv ?? opremaId,
            `${stara?.naziv ?? ''} uklonjena iz inventara.`,
            koSam(),
          );
        });
      },

      izmeniKategoriju(katId, izmene) {
        setBaza((b) =>
          saLogom(
            { ...b, kategorije: b.kategorije.map((k) => (k.id === katId ? { ...k, ...izmene } : k)) },
            'Izmenjena kategorija',
            b.kategorije.find((k) => k.id === katId)?.naziv ?? katId,
            izmene.rokDana !== undefined ? `Rok zaduženja: ${izmene.rokDana} dana.` : Object.keys(izmene).join(', '),
            koSam(),
          ),
        );
      },

      dodajKategoriju(k) {
        setBaza((b) =>
          saLogom({ ...b, kategorije: [...b.kategorije, { ...k, id: id('k') }] }, 'Dodata kategorija', k.naziv, k.opis, koSam()),
        );
      },

      dodajZaposlenog(z) {
        setBaza((b) =>
          saLogom({ ...b, zaposleni: [{ ...z, id: id('z') }, ...b.zaposleni] }, 'Dodat zaposleni', `${z.ime} ${z.prezime}`, z.radnoMesto, koSam()),
        );
      },

      izmeniZaposlenog(zapId, izmene) {
        setBaza((b) =>
          saLogom(
            { ...b, zaposleni: b.zaposleni.map((z) => (z.id === zapId ? { ...z, ...izmene } : z)) },
            'Izmenjen zaposleni',
            b.zaposleni.find((z) => z.id === zapId)?.prezime ?? zapId,
            Object.keys(izmene).join(', '),
            koSam(),
          ),
        );
      },

      napraviZaduzenje(ulaz) {
        const novo: Zaduzenje = {
          id: id('zd'),
          broj: sledeciBroj('ZAD', baza.zaduzenja.map((z) => z.broj)),
          zaposleniId: ulaz.zaposleniId,
          stavke: ulaz.stavke,
          izdaoId: ja?.id ?? 'n2',
          odobrioId: null,
          odobrenoAt: null,
          razlogOdbijanja: null,
          status: ulaz.trebaOdobrenje ? 'ceka_odobrenje' : 'ceka_potpis',
          createdAt: new Date().toISOString(),
          signedAt: null,
          dueAt: null,
          rokDana: ulaz.rokDana,
          potpisPrimaoca: null,
          potpisIzdavaoca: null,
          digitalni: null,
          napomena: ulaz.napomena,
          produzenja: [],
        };
        setBaza((b) =>
          saLogom(
            { ...b, zaduzenja: [novo, ...b.zaduzenja] },
            ulaz.trebaOdobrenje ? 'Podnet zahtev' : 'Kreirano zaduženje',
            novo.broj,
            `${ulaz.stavke.length} stavki, rok ${ulaz.rokDana || '—'} dana.`,
            koSam(),
          ),
        );
        return novo;
      },

      /** Potpis primaoca je trenutak od kog teče rok — odatle kreće timer. */
      potpisiZaduzenje(zadId, potpisPrimaoca, potpisIzdavaoca) {
        const sada = new Date().toISOString();
        setBaza((b) => {
          const zad = b.zaduzenja.find((z) => z.id === zadId);
          if (!zad) return b;
          const dueAt =
            zad.rokDana > 0 ? new Date(Date.now() + zad.rokDana * 86400000).toISOString() : null;
          const potpisnik = ja?.fullName ?? 'Uslužilac';
          const sertifikat = ja?.sertifikat ?? 'PEST-CA-DEMO';
          const azurirano: Zaduzenje = {
            ...zad,
            status: 'aktivno',
            signedAt: sada,
            dueAt,
            potpisPrimaoca,
            potpisIzdavaoca,
            digitalni: b.podesavanja.potpisi.digitalniPotpisAktivan
              ? {
                  potpisnik,
                  sertifikat,
                  otisak: otisak(`${zad.broj}|${potpisnik}|${sada}`),
                  vreme: sada,
                }
              : null,
          };
          // Potpisana oprema izlazi iz slobodnog stanja.
          const oprema = b.oprema.map((o) => {
            const stavka = zad.stavke.find((s) => s.opremaId === o.id);
            if (!stavka) return o;
            if (o.kolicina > 1) return { ...o, kolicina: Math.max(0, o.kolicina - stavka.kolicina) };
            return { ...o, stanje: 'zaduzeno' as const };
          });
          return saLogom(
            { ...b, oprema, zaduzenja: b.zaduzenja.map((z) => (z.id === zadId ? azurirano : z)) },
            'Potpisano zaduženje',
            zad.broj,
            dueAt ? `Rok teče od potpisa, ističe za ${zad.rokDana} dana.` : 'Trajno zaduženje.',
            koSam(),
          );
        });
      },

      odobriZaduzenje(zadId) {
        setBaza((b) => {
          const zad = b.zaduzenja.find((z) => z.id === zadId);
          if (!zad) return b;
          return saLogom(
            {
              ...b,
              zaduzenja: b.zaduzenja.map((z) =>
                z.id === zadId
                  ? { ...z, status: 'ceka_potpis', odobrioId: ja?.id ?? null, odobrenoAt: new Date().toISOString() }
                  : z,
              ),
            },
            'Odobren zahtev',
            zad.broj,
            'Zahtev odobren, čeka se potpis primaoca.',
            koSam(),
          );
        });
      },

      odbijZaduzenje(zadId, razlog) {
        setBaza((b) => {
          const zad = b.zaduzenja.find((z) => z.id === zadId);
          if (!zad) return b;
          return saLogom(
            {
              ...b,
              zaduzenja: b.zaduzenja.map((z) =>
                z.id === zadId
                  ? { ...z, status: 'odbijeno', odobrioId: ja?.id ?? null, odobrenoAt: new Date().toISOString(), razlogOdbijanja: razlog }
                  : z,
              ),
            },
            'Odbijen zahtev',
            zad.broj,
            razlog,
            koSam(),
          );
        });
      },

      produziZaduzenje(zadId, dana, razlog) {
        setBaza((b) => {
          const zad = b.zaduzenja.find((z) => z.id === zadId);
          if (!zad || !zad.dueAt) return b;
          const noviRok = new Date(new Date(zad.dueAt).getTime() + dana * 86400000).toISOString();
          return saLogom(
            {
              ...b,
              zaduzenja: b.zaduzenja.map((z) =>
                z.id === zadId
                  ? {
                      ...z,
                      dueAt: noviRok,
                      rokDana: z.rokDana + dana,
                      produzenja: [...z.produzenja, { at: new Date().toISOString(), dana, ko: koSam(), razlog }],
                    }
                  : z,
              ),
            },
            'Produžen rok',
            zad.broj,
            `Rok produžen za ${dana} dana. ${razlog}`,
            koSam(),
          );
        });
      },

      razduzi(zaduzenjeId, podaci) {
        const sada = new Date().toISOString();
        const novo: Razduzenje = {
          id: id('rz'),
          broj: sledeciBroj('RAZ', baza.razduzenja.map((r) => r.broj)),
          zaduzenjeId,
          vracenoAt: sada,
          primioId: ja?.id ?? 'n2',
          stanje: podaci.stanje,
          potpisVratioca: podaci.potpisVratioca,
          potpisPrimaoca: podaci.potpisPrimaoca,
          digitalni: {
            potpisnik: ja?.fullName ?? 'Uslužilac',
            sertifikat: ja?.sertifikat ?? 'PEST-CA-DEMO',
            otisak: otisak(`${zaduzenjeId}|razduzenje|${sada}`),
            vreme: sada,
          },
          napomena: podaci.napomena,
        };
        setBaza((b) => {
          const zad = b.zaduzenja.find((z) => z.id === zaduzenjeId);
          const oprema = b.oprema.map((o) => {
            const stavka = zad?.stavke.find((s) => s.opremaId === o.id);
            if (!stavka) return o;
            if (o.minZaliha > 0 || o.kolicina > 1) return { ...o, kolicina: o.kolicina + stavka.kolicina };
            const stanje =
              podaci.stanje === 'osteceno' ? 'servis' : podaci.stanje === 'nestalo' ? 'otpisano' : 'slobodno';
            return { ...o, stanje: stanje as Oprema['stanje'] };
          });
          return saLogom(
            {
              ...b,
              oprema,
              razduzenja: [novo, ...b.razduzenja],
              zaduzenja: b.zaduzenja.map((z) => (z.id === zaduzenjeId ? { ...z, status: 'razduzeno' } : z)),
            },
            'Razduženje',
            novo.broj,
            `Oprema vraćena (${podaci.stanje}). ${podaci.napomena}`,
            koSam(),
          );
        });
        return novo;
      },

      dodajKontrolu(k) {
        setBaza((b) =>
          saLogom(
            {
              ...b,
              kontrole: [
                { ...k, id: id('kt'), broj: sledeciBroj('KON', b.kontrole.map((x) => x.broj)) },
                ...b.kontrole,
              ],
            },
            'Zakazana kontrola',
            k.naziv,
            k.predmet,
            koSam(),
          ),
        );
      },

      zakljuciKontrolu(kontrolaId, podaci) {
        setBaza((b) => {
          const k = b.kontrole.find((x) => x.id === kontrolaId);
          if (!k) return b;
          return saLogom(
            {
              ...b,
              kontrole: b.kontrole.map((x) =>
                x.id === kontrolaId ? { ...x, ...podaci, izvrsenoAt: new Date().toISOString() } : x,
              ),
            },
            'Sprovedena kontrola',
            k.broj,
            `Nalaz: ${podaci.nalaz}. ${podaci.napomena}`,
            koSam(),
          );
        });
      },

      posaljiMail(m) {
        setBaza((b) =>
          saLogom(
            {
              ...b,
              mailovi: [
                { ...m, id: id('m'), createdAt: new Date().toISOString(), status: 'poslato' },
                ...b.mailovi,
              ],
            },
            'Poslata e-pošta',
            m.za,
            m.tema,
            koSam(),
          ),
        );
      },

      izmeniSablon(sablonId, izmene) {
        setBaza((b) => ({
          ...b,
          sabloni: b.sabloni.map((s) => (s.id === sablonId ? { ...s, ...izmene } : s)),
        }));
      },

      dodajNalog(n) {
        const nov: Nalog = {
          ...n,
          id: id('n'),
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
          potpis: null,
          sertifikat: null,
          izuzeci: {},
        };
        setBaza((b) =>
          saLogom({ ...b, nalozi: [...b.nalozi, nov] }, 'Kreiran nalog', `Nalog ${nov.username}`, `Uloga: ${nov.role}.`, koSam()),
        );
      },

      izmeniNalog(nalogId, izmene) {
        setBaza((b) =>
          saLogom(
            { ...b, nalozi: b.nalozi.map((n) => (n.id === nalogId ? { ...n, ...izmene } : n)) },
            'Izmenjen nalog',
            `Nalog ${b.nalozi.find((n) => n.id === nalogId)?.username ?? nalogId}`,
            Object.keys(izmene).join(', '),
            koSam(),
          ),
        );
      },

      obrisiNalog(nalogId) {
        setBaza((b) =>
          saLogom(
            { ...b, nalozi: b.nalozi.filter((n) => n.id !== nalogId) },
            'Obrisan nalog',
            `Nalog ${b.nalozi.find((n) => n.id === nalogId)?.username ?? nalogId}`,
            'Nalog uklonjen iz sistema.',
            koSam(),
          ),
        );
      },

      postaviIzuzetak(nalogId, pravo, vrednost) {
        setBaza((b) =>
          saLogom(
            {
              ...b,
              nalozi: b.nalozi.map((n) => {
                if (n.id !== nalogId) return n;
                const izuzeci = { ...n.izuzeci };
                if (vrednost === undefined) delete izuzeci[pravo];
                else izuzeci[pravo] = vrednost;
                return { ...n, izuzeci };
              }),
            },
            'Izmenjena prava',
            `Nalog ${b.nalozi.find((n) => n.id === nalogId)?.username ?? nalogId}`,
            vrednost === undefined ? `Vraćeno na pravo uloge: ${pravo}` : `${vrednost ? 'Dato' : 'Oduzeto'} pravo: ${pravo}`,
            koSam(),
          ),
        );
      },

      postaviPravoUloge(uloga, pravo, ukljuceno) {
        setBaza((b) => {
          const trenutna = b.pravaUloga[uloga] ?? [];
          const sledeca = ukljuceno
            ? Array.from(new Set([...trenutna, pravo]))
            : trenutna.filter((p) => p !== pravo);
          return saLogom(
            { ...b, pravaUloga: { ...b.pravaUloga, [uloga]: sledeca } },
            'Izmenjena prava uloge',
            uloga,
            `${ukljuceno ? 'Dato' : 'Oduzeto'} pravo: ${pravo}`,
            koSam(),
          );
        });
      },

      izmeniPodesavanja(izmene) {
        setBaza((b) =>
          saLogom(
            { ...b, podesavanja: { ...b.podesavanja, ...izmene } },
            'Promenjena podešavanja',
            Object.keys(izmene).join(', '),
            'Konfiguracija portala je izmenjena.',
            koSam(),
          ),
        );
      },

      upisiLog(akcija, entitet, detalj) {
        setBaza((b) => saLogom(b, akcija, entitet, detalj, koSam()));
      },

      resetDemo() {
        setBaza(napraviBazu());
      },
    };
  }, [ja, saLogom, baza.zaduzenja, baza.razduzenja]);

  const prijava = useCallback(
    (username: string, lozinka: string): { ok: true } | { ok: false; greska: string } => {
      const nalog = baza.nalozi.find((n) => n.username.toLowerCase() === username.trim().toLowerCase());
      if (!nalog) return { ok: false, greska: 'Nalog sa tim korisničkim imenom ne postoji.' };
      if (!nalog.aktivan) return { ok: false, greska: 'Nalog je isključen. Obratite se administratoru.' };
      if (lozinka.trim().length < 4) return { ok: false, greska: 'Unesite lozinku (demo prihvata bilo koju od 4+ znaka).' };
      setJaId(nalog.id);
      setBaza((b) => ({
        ...b,
        nalozi: b.nalozi.map((n) => (n.id === nalog.id ? { ...n, lastLoginAt: new Date().toISOString() } : n)),
        logovi: [
          { id: id('l'), at: new Date().toISOString(), ko: nalog.fullName, akcija: 'Prijava', entitet: 'Portal', detalj: 'Uspešna prijava na portal.' },
          ...b.logovi,
        ].slice(0, 400),
      }));
      return { ok: true };
    },
    [baza.nalozi],
  );

  const odjava = useCallback(() => setJaId(null), []);

  const smem = useCallback(
    (pravo: Permission) => imaPravo(ja, pravo, baza.pravaUloga),
    [ja, baza.pravaUloga],
  );

  const value = useMemo<Ctx>(
    () => ({ baza, akcije, ja, prijava, odjava, smem }),
    [baza, akcije, ja, prijava, odjava, smem],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  return useContext(StoreCtx);
}
