import { Routes, Route } from 'react-router-dom';
import Layout from './src/components/Layout';
import Home from './pages/Home';
import Calendario from './pages/Calendario';
import AdicionarSala from './src/pages/AdicionarSala';
import Login from './src/pages/Login';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/adicionar-sala" element={<AdicionarSala />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Layout>
  );
}