export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { username, password } = await request.json();

    // Lê o usuário e a senha das variáveis de ambiente que configuramos na Vercel
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Compara os dados recebidos com os valores seguros do ambiente
    if (username === adminUsername && password === adminPassword) {
      return response.status(200).json({ message: 'Login bem-sucedido' });
    } else {
      return response.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (error) {
    return response.status(400).json({ message: 'Corpo da requisição inválido' });
  }
}
