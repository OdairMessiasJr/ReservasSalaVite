const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, 'db.json');
const readData = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeData = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.status(200).json({ message: 'Login bem-sucedido' });
    } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
    }
});

// --- ROTAS DE SALAS ---
app.get('/api/salas', (req, res) => {
    try { const { salas } = readData(); res.status(200).json(salas); } catch (e) { res.status(500).json({ message: 'Erro ao ler salas' }); }
});

app.post('/api/salas', (req, res) => {
    try {
        const { nome } = req.body;
        const data = readData();
        const novaSala = { id: Date.now(), nome };
        data.salas.push(novaSala);
        writeData(data);
        res.status(201).json(novaSala);
    } catch (e) { res.status(500).json({ message: 'Erro ao criar sala' }); }
});

app.delete('/api/salas', (req, res) => {
    try {
        const { id } = req.body;
        const dbData = readData();
        const salasAtualizadas = dbData.salas.filter(sala => sala.id !== id);
        if (dbData.salas.length === salasAtualizadas.length) {
            return res.status(404).json({ message: "Sala não encontrada" });
        }
        const reservasAtualizadas = dbData.reservas.filter(reserva => reserva.salaId !== id);
        writeData({ salas: salasAtualizadas, reservas: reservasAtualizadas });
        res.status(200).json({ message: 'Sala e reservas associadas deletadas.' });
    } catch (e) { res.status(500).json({ message: 'Erro ao deletar sala' }); }
});


// --- ROTAS DE RESERVAS ---
app.get('/api/reservas', (req, res) => {
    try {
        const { data: dataFiltro } = req.query;
        const { reservas } = readData();
        const reservasFiltradas = dataFiltro ? reservas.filter(r => r.data === dataFiltro) : reservas;
        res.status(200).json(reservasFiltradas);
    } catch (e) { res.status(500).json({ message: 'Erro ao ler reservas' }); }
});

app.get('/api/reservas/all', (req, res) => {
    try {
        const { salas, reservas } = readData();
        const reservasComNome = reservas.map(reserva => {
            const sala = salas.find(s => s.id === reserva.salaId);
            return { ...reserva, salaNome: sala ? sala.nome : 'Desconhecida' };
        });
        res.status(200).json(reservasComNome);
    } catch (e) { res.status(500).json({ message: 'Erro ao ler todas as reservas' }); }
});

app.post('/api/reservas', (req, res) => {
    try {
        // 1. RECEBER OS NOVOS CAMPOS DO FRONTEND
        const { salaId, data, horarioInicio, quantidadeAulas, tempoPorAula, responsavel } = req.body;

        // Validação básica
        if (!quantidadeAulas || !tempoPorAula || !horarioInicio) {
            return res.status(400).json({ message: "Todos os campos de horário são obrigatórios." });
        }

        // 2. CALCULAR A DURAÇÃO TOTAL EM MINUTOS
        const duracaoTotal = Number(quantidadeAulas) * Number(tempoPorAula);

        // 3. CALCULAR O HORÁRIO DE TÉRMINO (lógica existente)
        const dataInicioObj = new Date(`${data}T${horarioInicio}:00`);
        const dataFimObj = new Date(dataInicioObj.getTime() + duracaoTotal * 60000); // Usa a duração total
        const horarioFim = `${String(dataFimObj.getHours()).padStart(2, '0')}:${String(dataFimObj.getMinutes()).padStart(2, '0')}`;

        const dbData = readData();
        const reservasDoDia = dbData.reservas.filter(r => r.salaId === salaId && r.data === data);

        // 4. CHECAR CONFLITO DE HORÁRIO (lógica existente, continua funcionando)
        const haConflito = reservasDoDia.some(reservaExistente => {
            const inicioExistente = new Date(`${reservaExistente.data}T${reservaExistente.horarioInicio}`);
            const fimExistente = new Date(`${reservaExistente.data}T${reservaExistente.horarioFim}`);
            return dataInicioObj < fimExistente && dataFimObj > inicioExistente;
        });

        if (haConflito) {
            return res.status(409).json({ message: 'Conflito de horário. Já existe uma reserva neste intervalo.' });
        }

        // 5. SALVAR A NOVA RESERVA (lógica existente)
        const novaReserva = { id: Date.now(), salaId: Number(salaId), data, horarioInicio, horarioFim, responsavel };
        dbData.reservas.push(novaReserva);
        writeData(dbData);
        res.status(201).json(novaReserva);
    } catch (e) {
        console.error('ERRO AO CRIAR RESERVA:', e);
        res.status(500).json({ message: 'Erro interno no servidor' });
    }
});

app.delete('/api/reservas', (req, res) => {
    try {
        const { id } = req.body;
        const dbData = readData();
        const reservasAtualizadas = dbData.reservas.filter(r => r.id !== id);
        writeData({ ...dbData, reservas: reservasAtualizadas });
        res.status(200).json({ message: 'Reserva cancelada.' });
    } catch(e) { res.status(500).json({ message: 'Erro ao deletar reserva' }); }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});