import { useEffect, useState } from "react";
import {
  getLinhas,
  createLinha,
  deleteLinha,
  updateLinha,
} from "../services/api";

export default function Dashboard() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    numero: "",
    operadora: "",
    status: "ativa",
  });

  const [editId, setEditId] = useState(null);

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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.numero || !form.operadora || !form.status) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        await updateLinha(editId, form);
      } else {
        await createLinha(form);
      }

      setForm({ numero: "", operadora: "", status: "ativa" });
      setEditId(null);
      await carregarLinhas();
    } catch (err) {
      alert("Erro ao salvar linha");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir esta linha?")) return;
    await deleteLinha(id);
    carregarLinhas();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      {/* FORMULÁRIO CREATE / UPDATE */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          placeholder="Número"
          value={form.numero}
          onChange={(e) =>
            setForm({ ...form, numero: e.target.value })
          }
        />

        <input
          placeholder="Operadora"
          value={form.operadora}
          onChange={(e) =>
            setForm({ ...form, operadora: e.target.value })
          }
        />

        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
          }
        >
          <option value="ativa">Ativa</option>
          <option value="suspensa">Suspensa</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <button type="submit" disabled={loading}>
          {editId ? "Atualizar" : "Criar"}
        </button>

        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setForm({
                numero: "",
                operadora: "",
                status: "ativa",
              });
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      {loading && <p>Carregando...</p>}

      {!loading && linhas.length === 0 && (
        <p>Nenhuma linha cadastrada</p>
      )}

      {!loading && linhas.length > 0 && (
        <ul>
          {linhas.map((linha) => (
            <li key={linha.id}>
              {linha.numero} — {linha.operadora} — {linha.status}

              <button
                onClick={() => {
                  setEditId(linha.id);
                  setForm({
                    numero: linha.numero,
                    operadora: linha.operadora,
                    status: linha.status,
                  });
                }}
              >
                Editar
              </button>

              <button onClick={() => handleDelete(linha.id)}>
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
