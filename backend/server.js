import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

// --- INICIALIZAÇÃO DO FIREBASE ---
// Importa a chave de serviço que você baixou
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Acessa o serviço do Firestore
const db = admin.firestore();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


// --- ROTAS DE AUTENTICAÇÃO (sem mudanças) ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.status(200).json({ message: 'Login bem-sucedido' });
    } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
    }
});


// --- ROTAS DE SALAS (adaptadas para Firestore) ---
app.get('/api/salas', async (req, res) => {
    try {
        const salasSnapshot = await db.collection('salas').get();
        const salas = salasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(salas);
    } catch (e) { res.status(500).json({ message: 'Erro ao buscar salas' }); }
});

app.post('/api/salas', async (req, res) => {
    try {
        const { nome } = req.body;
        const docRef = await db.collection('salas').add({ nome });
        res.status(201).json({ id: docRef.id, nome });
    } catch (e) { res.status(500).json({ message: 'Erro ao criar sala' }); }
});

app.delete('/api/salas', async (req, res) => {
    try {
        const { id } = req.body;
        // Deleta a sala
        await db.collection('salas').doc(id).delete();
        
        // Encontra e deleta todas as reservas associadas
        const reservasQuery = db.collection('reservas').where('salaId', '==', id);
        const reservasSnapshot = await reservasQuery.get();
        
        const batch = db.batch();
        reservasSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        res.status(200).json({ message: 'Sala e reservas associadas deletadas.' });
    } catch (e) { res.status(500).json({ message: 'Erro ao deletar sala' }); }
});


// --- ROTAS DE RESERVAS (adaptadas para Firestore) ---
app.get('/api/reservas', async (req, res) => {
    try {
        const { data: dataFiltro } = req.query;
        const reservasQuery = db.collection('reservas').where('data', '==', dataFiltro);
        const snapshot = await reservasQuery.get();
        const reservas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(reservas);
    } catch (e) { res.status(500).json({ message: 'Erro ao buscar reservas' }); }
});

app.get('/api/reservas/all', async (req, res) => {
    try {
        const [salasSnap, reservasSnap] = await Promise.all([
            db.collection('salas').get(),
            db.collection('reservas').get()
        ]);
        const salas = salasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const reservas = reservasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const reservasComNome = reservas.map(reserva => {
            const sala = salas.find(s => s.id === reserva.salaId);
            return { ...reserva, salaNome: sala ? sala.nome : 'Desconhecida' };
        });
        res.status(200).json(reservasComNome);
    } catch (e) { res.status(500).json({ message: 'Erro ao buscar todas as reservas' }); }
});

app.post('/api/reservas', async (req, res) => {
    try {
        const { salaId, data, horarioInicio, duracao, quantidadeAulas, tempoPorAula, responsavel } = req.body;
        
        let duracaoTotal;
        if (duracao) { // Lógica antiga
            duracaoTotal = duracao;
        } else { // Nova lógica
            duracaoTotal = Number(quantidadeAulas) * Number(tempoPorAula);
        }

        const dataInicioObj = new Date(`${data}T${horarioInicio}:00`);
        const dataFimObj = new Date(dataInicioObj.getTime() + duracaoTotal * 60000);
        const horarioFim = `${String(dataFimObj.getHours()).padStart(2, '0')}:${String(dataFimObj.getMinutes()).padStart(2, '0')}`;

        // Checagem de conflito no Firestore
        const reservasDoDiaQuery = db.collection('reservas')
            .where('salaId', '==', salaId)
            .where('data', '==', data);
        
        const snapshot = await reservasDoDiaQuery.get();
        const reservasDoDia = snapshot.docs.map(doc => doc.data());

        const haConflito = reservasDoDia.some(reservaExistente => {
            const inicioExistente = new Date(`${reservaExistente.data}T${reservaExistente.horarioInicio}`);
            const fimExistente = new Date(`${reservaExistente.data}T${reservaExistente.horarioFim}`);
            return dataInicioObj < fimExistente && dataFimObj > inicioExistente;
        });

        if (haConflito) {
            return res.status(409).json({ message: 'Conflito de horário. Já existe uma reserva neste intervalo.' });
        }

        const novaReserva = { salaId, data, horarioInicio, horarioFim, responsavel };
        const docRef = await db.collection('reservas').add(novaReserva);
        res.status(201).json({ id: docRef.id, ...novaReserva });
    } catch (e) {
        console.error('ERRO AO CRIAR RESERVA:', e);
        res.status(500).json({ message: 'Erro interno no servidor' });
    }
});

app.delete('/api/reservas', async (req, res) => {
    try {
        const { id } = req.body;
        await db.collection('reservas').doc(id).delete();
        res.status(200).json({ message: 'Reserva cancelada.' });
    } catch (e) { res.status(500).json({ message: 'Erro ao deletar reserva' }); }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});