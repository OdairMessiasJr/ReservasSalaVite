export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method Not Allowed' });
  try {
    const { username, password } = await request.json();
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      return response.status(200).json({ message: 'Login bem-sucedido' });
    } else {
      return response.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (error) { return response.status(400).json({ message: 'Requisição inválida' });}
}