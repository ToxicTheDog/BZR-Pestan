/** Greška sa HTTP statusom — rute je bacaju, `obradiGreske` je pretvara u JSON. */
export class HttpGreska extends Error {
  constructor(status, poruka, detalji) {
    super(poruka);
    this.status = status;
    this.detalji = detalji;
  }
}

export const losZahtev = (poruka, detalji) => new HttpGreska(400, poruka, detalji);
export const neovlascen = (poruka = 'Prijava je obavezna.') => new HttpGreska(401, poruka);
export const zabranjeno = (poruka = 'Nemate pravo za ovu radnju.') => new HttpGreska(403, poruka);
export const nijeNadjeno = (poruka = 'Traženi zapis ne postoji.') => new HttpGreska(404, poruka);
export const sukob = (poruka) => new HttpGreska(409, poruka);

/** Omotač za async rute, da odbijeni Promise ne obori proces. */
export const async_ = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function obradiGreske(err, _req, res, _next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    greska: err.message || 'Neočekivana greška.',
    ...(err.detalji ? { detalji: err.detalji } : {}),
  });
}
