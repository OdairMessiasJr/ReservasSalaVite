import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calendario from './pages/Calendario';
import AdicionarSala from './pages/AdicionarSala';
import Login from './pages/Login';

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