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
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const linhasFiltradas =
    statusFiltro === "todos"
      ? linhas
      : linhas.filter((linha) => linha.status === statusFiltro);

  async function carregarLinhas() {
    setLoading(true);
    try {
      const data = await getLinhas();
      setLinhas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar linhas", err);
      alert("Erro ao carregar linhas. Verifique se a API está rodando.");
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
      alert(err.message || "Erro ao salvar linha");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir esta linha?")) return;
    
    try {
      await deleteLinha(id);
      carregarLinhas();
    } catch (err) {
      alert(err.message || "Erro ao excluir linha");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>CentralChip - Gestor de Linhas Telefônicas</h2>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 20 
      }}>
        <h3>{editId ? "Editar Linha" : "Cadastrar Nova Linha"}</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            placeholder="Número (ex: 11999999999)"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />

          <input
            placeholder="Operadora (ex: Vivo)"
            value={form.operadora}
            onChange={(e) => setForm({ ...form, operadora: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          />

          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
          >
            <option value="ativa">Ativa</option>
            <option value="suspensa">Suspensa</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: editId ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
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
              style={{
                padding: '8px 16px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8, fontWeight: 'bold' }}>Filtrar por status:</label>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
        >
          <option value="todos">Todos</option>
          <option value="ativa">Ativa</option>
          <option value="suspensa">Suspensa</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {loading && <p>Carregando...</p>}

      {!loading && linhas.length === 0 && (
        <p>Nenhuma linha cadastrada. Cadastre a primeira linha acima.</p>
      )}

      {!loading && linhas.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ 
            borderCollapse: "collapse", 
            width: "100%",
            background: 'white'
          }}
        >
          <thead>
            <tr style={{ background: '#f2f2f2' }}>
              <th>ID</th>
              <th>Número</th>
              <th>Operadora</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((linha) => (
              <tr key={linha.id}>
                <td style={{ textAlign: 'center' }}>{linha.id}</td>
                <td>{linha.numero}</td>
                <td>{linha.operadora}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 
                      linha.status === 'ativa' ? '#d4edda' :
                      linha.status === 'suspensa' ? '#fff3cd' :
                      '#f8d7da',
                    color: 
                      linha.status === 'ativa' ? '#155724' :
                      linha.status === 'suspensa' ? '#856404' :
                      '#721c24'
                  }}>
                    {linha.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setEditId(linha.id);
                      setForm({
                        numero: linha.numero,
                        operadora: linha.operadora,
                        status: linha.status,
                      });
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginRight: 8
                    }}
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(linha.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}