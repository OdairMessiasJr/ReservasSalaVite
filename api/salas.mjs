import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const { rows: salas } = await sql`SELECT * FROM salas ORDER BY nome;`;
      return response.status(200).json(salas);
    } 
    
    if (request.method === 'POST') {
      const { nome } = await request.json();
      if (!nome) return response.status(400).json({ message: 'O nome é obrigatório' });
      await sql`INSERT INTO salas (nome) VALUES (${nome});`;
      return response.status(201).json({ message: 'Sala criada com sucesso' });
    }

    if (request.method === 'DELETE') {
      const { id } = await request.json();
      if (!id) return response.status(400).json({ message: 'O ID da sala é obrigatório' });
      await sql`DELETE FROM salas WHERE id = ${id};`;
      return response.status(200).json({ message: 'Sala deletada com sucesso' });
    }

    return response.status(405).end(`Method ${request.method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
}