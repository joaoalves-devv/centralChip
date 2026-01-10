import { useEffect, useState } from "react";
import { getLinhas, createLinha, deleteLinha } from "../services/api";

export default function Dashboard() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [numero, setNumero] = useState("");
  const [operadora, setOperadora] = useState("");
  const [status, setStatus] = useState("");

  async function carregarLinhas() {
    setLoading(true);
    try {
      const data = await getLinhas();
      setLinhas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar linhas", err);
      setLinhas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarLinhas();
  }, []);

  // Criar linha
  async function handleCreate(e) {
    e.preventDefault();
    await createLinha({ numero, operadora, status });
    setNumero("");
    setOperadora("");
    setStatus("");
    carregarLinhas();
  }

  // Deletar linha
  async function handleDelete(id) {
    if (!confirm("Deseja excluir esta linha?")) return;
    await deleteLinha(id);
    carregarLinhas();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <input
          placeholder="Número"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        <input
          placeholder="Operadora"
          value={operadora}
          onChange={(e) => setOperadora(e.target.value)}
        />
        <input
          placeholder="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <button type="submit">Criar linha</button>
      </form>

      {loading && <p>Carregando...</p>}

      {!loading && linhas.length === 0 && <p>Nenhuma linha cadastrada</p>}

      {!loading && linhas.length > 0 && (
        <ul>
          {linhas.map((linha) => (
            <li key={linha.id}>
              {linha.numero} — {linha.operadora} — {linha.status}
              <button
                style={{ marginLeft: 10 }}
                onClick={() => handleDelete(linha.id)}
              >
                Excluir
              </button>
            </li>

          ))}
        </ul>
      )}
    </div>
  );
}
