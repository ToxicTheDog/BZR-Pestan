import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider } from './components/ui';
import { Shell } from './components/Shell';
import type { Permission } from './lib/types';
import { Prijava } from './pages/Prijava';
import { Pregled } from './pages/Pregled';
import { Zaduzenja } from './pages/Zaduzenja';
import { NovoZaduzenje } from './pages/NovoZaduzenje';
import { Razduzenja } from './pages/Razduzenja';
import { Odobrenja } from './pages/Odobrenja';
import { Kontrole } from './pages/Kontrole';
import { Inventar } from './pages/Inventar';
import { Kartoni } from './pages/Kartoni';
import { Zaposleni } from './pages/Zaposleni';
import { Posta } from './pages/Posta';
import { Nalozi } from './pages/Nalozi';
import { Podesavanja } from './pages/Podesavanja';
import { Logovi } from './pages/Logovi';
import { MojNalog } from './pages/MojNalog';

/** Ruta koja traži konkretno pravo; bez njega se vraća na pregled. */
function Zasticena({ pravo, children }: { pravo: Permission; children: React.ReactNode }) {
  const { smem } = useStore();
  return smem(pravo) ? <>{children}</> : <Navigate to="/pregled" replace />;
}

function Rute() {
  const { ja } = useStore();

  // Nema početne strane — neprijavljen korisnik vidi samo prijavu.
  if (!ja) return <Prijava />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/pregled" replace />} />
        <Route path="/pregled" element={<Pregled />} />
        <Route path="/zaduzenja" element={<Zasticena pravo="zaduzenja.vidi"><Zaduzenja /></Zasticena>} />
        <Route path="/zaduzenja/novo" element={<Zasticena pravo="zaduzenja.izdaj"><NovoZaduzenje /></Zasticena>} />
        <Route path="/razduzenja" element={<Zasticena pravo="zaduzenja.vidi"><Razduzenja /></Zasticena>} />
        <Route path="/odobrenja" element={<Zasticena pravo="odobrenja.vidi"><Odobrenja /></Zasticena>} />
        <Route path="/kontrole" element={<Zasticena pravo="kontrole.vidi"><Kontrole /></Zasticena>} />
        <Route path="/inventar" element={<Zasticena pravo="inventar.vidi"><Inventar /></Zasticena>} />
        <Route path="/kartoni" element={<Zasticena pravo="kartoni.vidi"><Kartoni /></Zasticena>} />
        <Route path="/zaposleni" element={<Zasticena pravo="zaposleni.vidi"><Zaposleni /></Zasticena>} />
        <Route path="/posta" element={<Zasticena pravo="mail.vidi"><Posta /></Zasticena>} />
        <Route path="/nalozi" element={<Zasticena pravo="nalozi.upravljaj"><Nalozi /></Zasticena>} />
        <Route path="/podesavanja" element={<Zasticena pravo="podesavanja.upravljaj"><Podesavanja /></Zasticena>} />
        <Route path="/logovi" element={<Zasticena pravo="logovi.vidi"><Logovi /></Zasticena>} />
        <Route path="/moj-nalog" element={<MojNalog />} />
        <Route path="*" element={<Navigate to="/pregled" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StoreProvider>
          <Rute />
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
