import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CaesarCipher from './pages/CaesarCipher';
import StreamCiphers from './pages/StreamCiphers';
import BlockCiphers from './pages/BlockCiphers';
import ModesOfOperation from './pages/ModesOfOperation';
import NumberTheory from './pages/NumberTheory';
import EllipticCurves from './pages/EllipticCurves';
import Hashing from './pages/Hashing';
import Protocols from './pages/Protocols';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="caesar" element={<CaesarCipher />} />
          <Route path="stream" element={<StreamCiphers />} />
          <Route path="block" element={<BlockCiphers />} />
          <Route path="modes" element={<ModesOfOperation />} />
          <Route path="number-theory" element={<NumberTheory />} />
          <Route path="ecc" element={<EllipticCurves />} />
          <Route path="hashing" element={<Hashing />} />
          <Route path="protocols" element={<Protocols />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
