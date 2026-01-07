import { useEffect, useState } from "react";
import { getLinhas } from "../services/api";

function Dashboard() {
  const [linhas, setLinhas] = useState([]);

  useEffect(() => {
    getLinhas().then(data => setLinhas(data));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {linhas.length === 0 ? (
        <p>Nenhuma linha cadastrada</p>
      ) : (
        <ul>
          {linhas.map(linha => (
            <li key={linha.id}>
              {linha.numero} — {linha.operadora}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
