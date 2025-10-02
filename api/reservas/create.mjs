import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    if (request.method !== 'POST') return response.status(405).end();
    try {
        const { salaId, data, horarioInicio, quantidadeAulas, tempoPorAula, responsavel } = await request.json();
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
        return response.status(201).json({ message: 'Reserva criada' });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Erro ao criar reserva', details: error.message });
    }
}