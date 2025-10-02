import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    const { rows } = await sql`
      SELECT r.id, r.sala_id, s.nome as sala_nome, r.responsavel, r.data, to_char(r.horario_inicio, 'HH24:MI') as horario_inicio, to_char(r.horario_fim, 'HH24:MI') as horario_fim
      FROM reservas r
      JOIN salas s ON r.sala_id = s.id;
    `;
    const reservas = rows.map(r => ({ ...r, salaId: r.sala_id, salaNome: r.sala_nome }));
    return response.status(200).json(reservas);
  } catch (error) { 
    console.error(error);
    return response.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
}