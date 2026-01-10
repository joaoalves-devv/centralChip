const API_URL = "http://localhost:3000";

export async function getLinhas() {
  const res = await fetch(`${API_URL}/linhas`);
  return res.json();
}

export async function createLinha(data) {
  const res = await fetch(`${API_URL}/linhas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteLinha(id) {
  await fetch(`${API_URL}/linhas/${id}`, {
    method: "DELETE",
  });
}
