import { sql } from '@vercel/postgres';
import { verifyAuth, rateLimiter } from './middleware/auth.mjs';

const limiter = rateLimiter();

function logarOperacao(tipo, dados, resultado) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${tipo}:`, {
    dados,
    resultado,
  });
}

export default async function handler(request, response) {
  // Rate Limiting
  const clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
  if (!limiter(clientIp)) {
    return response.status(429).json({ message: 'Muitas requisições. Por favor, tente novamente mais tarde.' });
  }

  // Autenticação (exceto para GET)
  if (request.method !== 'GET') {
    const authResult = verifyAuth(request, response);
    if (authResult.error) {
      return response.status(authResult.status).json({ message: authResult.error });
    }
  }

  try {
    if (request.method === 'GET') {
      const { rows: salas } = await sql`SELECT * FROM salas ORDER BY nome;`;
      return response.status(200).json(salas);
    } 
    
    if (request.method === 'POST') {
      const { nome } = await request.json();
      if (!nome) return response.status(400).json({ message: 'O nome é obrigatório' });
      
      // Verifica se já existe uma sala com o mesmo nome
      const { rows: existingSalas } = await sql`SELECT * FROM salas WHERE nome = ${nome};`;
      if (existingSalas.length > 0) {
        return response.status(409).json({ message: 'Já existe uma sala com este nome' });
      }

      await sql`INSERT INTO salas (nome) VALUES (${nome});`;
      return response.status(201).json({ message: 'Sala criada com sucesso' });
    }

    if (request.method === 'DELETE') {
      const { id } = await request.json();
      if (!id) return response.status(400).json({ message: 'O ID da sala é obrigatório' });
      
      // Verifica se existem reservas para esta sala
      const { rows: existingReservas } = await sql`SELECT COUNT(*) FROM reservas WHERE sala_id = ${id};`;
      if (existingReservas[0].count > 0) {
        return response.status(409).json({ message: 'Não é possível deletar uma sala com reservas existentes' });
      }

      await sql`DELETE FROM salas WHERE id = ${id};`;
      return response.status(200).json({ message: 'Sala deletada com sucesso' });
    }

    return response.status(405).end(`Method ${request.method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
}