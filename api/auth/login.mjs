import { generateToken, rateLimiter } from '../middleware/auth.mjs';

const limiter = rateLimiter();

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method Not Allowed' });
  
  // Rate Limiting
  const clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
  if (!limiter(clientIp)) {
    return response.status(429).json({ message: 'Muitas requisições. Por favor, tente novamente mais tarde.' });
  }

  try {
    const { username, password } = await request.json();
    
    // Validação de campos obrigatórios
    if (!username || !password) {
      return response.status(400).json({ message: 'Username e password são obrigatórios' });
    }

    // Validação de tamanho mínimo
    if (username.length < 3 || password.length < 6) {
      return response.status(400).json({ message: 'Username deve ter no mínimo 3 caracteres e password deve ter no mínimo 6 caracteres' });
    }

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken(username);
      return response.status(200).json({ 
        message: 'Login bem-sucedido',
        token
      });
    } else {
      return response.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (error) { return response.status(400).json({ message: 'Requisição inválida' });}
}