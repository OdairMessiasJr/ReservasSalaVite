export default async function handler(request, response) {
  // A função só aceita o método POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { username, password } = await request.json();

    // A mesma lógica de antes, apenas em um novo formato
    if (username === 'admin' && password === 'admin123') {
      return response.status(200).json({ message: 'Login bem-sucedido' });
    } else {
      return response.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (error) {
    // Caso a requisição venha sem um corpo JSON válido
    return response.status(400).json({ message: 'Corpo da requisição inválido' });
  }
}