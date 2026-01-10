import { useEffect, useState } from "react";
import { getLinhas, deleteLinha } from "../services/api";

function Dashboard() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarLinhas() {
    setLoading(true);
    const data = await getLinhas();
    setLinhas(data);
    setLoading(false);
  }

  useEffect(() => {
    carregarLinhas();
  }, []);

  async function handleDelete(id) {
    const confirmacao = window.confirm("Deseja excluir esta linha?");
    if (!confirmacao) return;

    await deleteLinha(id);
    carregarLinhas();
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {linhas.length === 0 ? (
        <p>Nenhuma linha cadastrada</p>
      ) : (
        <ul>
          {linhas.map(linha => (
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

export default Dashboard;
