import { sql } from '@vercel/postgres';
import { verifyAuth, rateLimiter } from '../middleware/auth.mjs';

const limiter = rateLimiter();

function validarData(data) {
    const dataObj = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return !isNaN(dataObj) && dataObj >= hoje;
}

function validarHorario(horario) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(horario);
}

function logarOperacao(tipo, dados, resultado) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${tipo}:`, {
        dados,
        resultado,
    });
}

export default async function handler(request, response) {
    // Verificação de método
    if (request.method !== 'POST') return response.status(405).end();

    // Rate Limiting
    const clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    if (!limiter(clientIp)) {
        return response.status(429).json({ message: 'Muitas requisições. Por favor, tente novamente mais tarde.' });
    }

    // Autenticação
    const authResult = verifyAuth(request, response);
    if (authResult.error) {
        return response.status(authResult.status).json({ message: authResult.error });
    }

    try {
        const { salaId, data, horarioInicio, quantidadeAulas, tempoPorAula, responsavel } = await request.json();
        
        // Validação de campos obrigatórios
        // Validações de campos obrigatórios
        if (!salaId || !data || !horarioInicio || !quantidadeAulas || !tempoPorAula || !responsavel) {
            const erro = { message: 'Todos os campos são obrigatórios: salaId, data, horarioInicio, quantidadeAulas, tempoPorAula, responsavel' };
            logarOperacao('ERRO_VALIDACAO', { salaId, data, horarioInicio, quantidadeAulas, tempoPorAula, responsavel }, erro);
            return response.status(400).json(erro);
        }

        // Validação de data
        if (!validarData(data)) {
            const erro = { message: 'A data deve ser válida e não pode ser anterior a hoje' };
            logarOperacao('ERRO_DATA', { data }, erro);
            return response.status(400).json(erro);
        }

        // Validação de horário
        if (!validarHorario(horarioInicio)) {
            const erro = { message: 'O horário deve estar no formato HH:MM (24h)' };
            logarOperacao('ERRO_HORARIO', { horarioInicio }, erro);
            return response.status(400).json(erro);
        }

        // Validação de valores numéricos
        if (isNaN(Number(quantidadeAulas)) || isNaN(Number(tempoPorAula)) || 
            Number(quantidadeAulas) <= 0 || Number(tempoPorAula) <= 0) {
            const erro = { message: 'Quantidade de aulas e tempo por aula devem ser números positivos' };
            logarOperacao('ERRO_NUMERICO', { quantidadeAulas, tempoPorAula }, erro);
            return response.status(400).json(erro);
        }

        const duracaoTotal = Number(quantidadeAulas) * Number(tempoPorAula);
        const horarioFim = new Date(new Date(`${data}T${horarioInicio}`).getTime() + duracaoTotal * 60000)
            .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

        const { rows: conflitos } = await sql`
            SELECT COUNT(*) FROM reservas
            WHERE sala_id = ${salaId} AND data = ${data}
            AND (horario_inicio, horario_fim) OVERLAPS (CAST(${horarioInicio} AS TIME), CAST(${horarioFim} AS TIME));
        `;
        
        if (conflitos[0].count > 0) {
            return response.status(409).json({ message: 'Conflito de horário. Já existe uma reserva neste intervalo.' });
        }

        await sql`
            INSERT INTO reservas (sala_id, responsavel, data, horario_inicio, horario_fim)
            VALUES (${salaId}, ${responsavel}, ${data}, ${horarioInicio}, ${horarioFim});
        `;
        const resultado = { message: 'Reserva criada' };
        logarOperacao('RESERVA_CRIADA', {
            salaId,
            data,
            horarioInicio,
            horarioFim,
            responsavel
        }, resultado);
        
        return response.status(201).json(resultado);

    } catch (error) {
        logarOperacao('ERRO_INTERNO', {
            erro: error.message,
            stack: error.stack
        }, null);
        
        return response.status(500).json({ 
            error: 'Erro ao criar reserva',
            message: 'Ocorreu um erro interno. Por favor, tente novamente mais tarde.'
        });
    }
}