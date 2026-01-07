const API_URL = "http://localhost:3000";

export async function listarLinhas() {
  const response = await fetch(`${API_URL}/linhas`);
  return response.json();
}

export async function criarLinha(dados) {
  const response = await fetch(`${API_URL}/linhas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dados)
  });

  return response.json();
}
