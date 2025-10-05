import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

export function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyAuth(request, response) {
  try {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      return { error: 'Token não fornecido', status: 401 };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
    return { error: null };
  } catch (error) {
    return { error: 'Token inválido', status: 403 };
  }
}

export function rateLimiter() {
  const requests = new Map();
  const WINDOW_MS = 60000; // 1 minuto
  const MAX_REQUESTS = 60; // 60 requisições por minuto

  return function(ip) {
    const now = Date.now();
    const userRequests = requests.get(ip) || [];
    
    // Remove requisições antigas
    const recentRequests = userRequests.filter(time => now - time < WINDOW_MS);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      return false;
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);
    return true;
  };
}