import { useEffect, useState } from "react";
import { listarLinhas, criarLinha } from "./services/api";

export default function App() {
  const [linhas, setLinhas] = useState([]);

  useEffect(() => {
    listarLinhas().then(setLinhas);
  }, []);

  async function adicionarLinha() {
    const nova = await criarLinha({
      numero: "11999999999",
      operadora: "Vivo",
      status: "ATIVO",
      saldo: 20
    });

    setLinhas((prev) => [...prev, nova]);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Gestor de Linhas</h1>

      <button onClick={adicionarLinha}>
        Adicionar linha teste
      </button>

      <ul>
        {linhas.map((linha) => (
          <li key={linha.id}>
            {linha.numero} — {linha.operadora} — {linha.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
