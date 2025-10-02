import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    if (request.method === 'GET') {
        const dataFiltro = request.nextUrl.searchParams.get('data');
        if (!dataFiltro) return response.status(400).json({ message: 'A data é obrigatória' });
        
        const { rows: reservas } = await sql`SELECT id, sala_id, responsavel, data, to_char(horario_inicio, 'HH24:MI') as horario_inicio, to_char(horario_fim, 'HH24:MI') as horario_fim FROM reservas WHERE data = ${dataFiltro};`;
        // Renomeia sala_id para salaId para compatibilidade com o frontend
        const resultado = reservas.map(r => ({ ...r, salaId: r.sala_id }));
        return response.status(200).json(resultado);
    }

    else if (request.method === 'DELETE') {
        const { id } = await request.json();
        if (!id) return response.status(400).json({ message: 'O ID da reserva é obrigatório' });
        await sql`DELETE FROM reservas WHERE id = ${id};`;
        return response.status(200).json({ message: 'Reserva cancelada' });
    }

    else {
      response.setHeader('Allow', ['GET', 'DELETE']);
      return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Erro no servidor' });
  }
}
