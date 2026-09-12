/** Prijava, JWT i provera prava na svakoj ruti. */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { konfig } from './konfig.js';
import { baza } from './baza.js';
import { imaPravo } from './prava.js';
import { neovlascen, zabranjeno } from './greske.js';

export const hesuj = (lozinka) => bcrypt.hashSync(lozinka, 10);
export const proveriLozinku = (lozinka, hes) => bcrypt.compareSync(lozinka, hes);

export function napraviToken(nalog) {
  return jwt.sign({ sub: nalog.id, role: nalog.role }, konfig.jwtTajna, {
    expiresIn: `${konfig.jwtSati}h`,
  });
}

/** Nalog bez osetljivih polja — ovo ide u odgovor. */
export function javniNalog(n) {
  const { lozinkaHes: _l, ...ostatak } = n;
  return ostatak;
}

/** Traži ispravan token; postavlja `req.nalog`. */
export function trazenaPrijava(req, _res, next) {
  const zaglavlje = req.headers.authorization ?? '';
  const token = zaglavlje.startsWith('Bearer ') ? zaglavlje.slice(7) : null;
  if (!token) return next(neovlascen());
  try {
    const podaci = jwt.verify(token, konfig.jwtTajna);
    const nalog = baza().nalozi.find((n) => n.id === podaci.sub);
    if (!nalog) return next(neovlascen('Nalog više ne postoji.'));
    if (!nalog.aktivan) return next(zabranjeno('Nalog je isključen.'));
    req.nalog = nalog;
    next();
  } catch {
    next(neovlascen('Token je istekao ili nije ispravan.'));
  }
}

/** Kapija za pojedinačno pravo; koristi se posle `trazenaPrijava`. */
export function trazenoPravo(pravo) {
  return (req, _res, next) => {
    if (!imaPravo(req.nalog, pravo, baza().pravaUloga)) {
      return next(zabranjeno(`Za ovu radnju potrebno je pravo „${pravo}".`));
    }
    next();
  };
}
