/**
 * Demo potpisi. Umesto praznih polja, svaki nalog i zaposleni dobija
 * prepoznatljiv rukopisni trag izveden iz imena — isto ime, isti potpis.
 */
function seedRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function demoPotpis(seed: string): string {
  const r = seedRandom(seed);
  const sirina = 360;
  const visina = 110;
  const tacke = 7 + Math.floor(r() * 4);
  const dy = visina / 2;
  let d = `M 18 ${(dy + 18 + r() * 12).toFixed(1)}`;
  let x = 18;
  const korak = (sirina - 46) / tacke;
  for (let i = 0; i < tacke; i++) {
    const x1 = x + korak * 0.35;
    const y1 = dy - (10 + r() * 40);
    const x2 = x + korak * 0.7;
    const y2 = dy + (r() * 34 - 12);
    x += korak;
    const y = dy + (r() * 26 - 10);
    d += ` C ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  // Potez preko potpisa — ono što se u praksi uvek povuče na kraju.
  const yLinija = dy + 26 + r() * 10;
  d += ` M 24 ${yLinija.toFixed(1)} C ${(sirina * 0.35).toFixed(1)} ${(yLinija + 12).toFixed(1)}, ${(
    sirina * 0.7
  ).toFixed(1)} ${(yLinija - 14).toFixed(1)}, ${(sirina - 26).toFixed(1)} ${(yLinija - 2).toFixed(1)}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sirina}" height="${visina}" viewBox="0 0 ${sirina} ${visina}"><path d="${d}" fill="none" stroke="#14161A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
