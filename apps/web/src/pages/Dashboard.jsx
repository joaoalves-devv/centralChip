import { useEffect, useState } from "react";
import {
  getLinhas,
  createLinha,
  deleteLinha,
  updateLinha,
} from "../services/api";

/**
 * Dashboard principal do sistema
 * Responsável por:
 * - Listar linhas
 * - Criar novas linhas
 * - Atualizar linhas existentes
 * - Excluir linhas
 */
export default function Dashboard() {
  /**
   * Lista de linhas retornadas da API
   */
  const [linhas, setLinhas] = useState([]);

  /**
   * Controla estado global de loading (requisições)
   */
  const [loading, setLoading] = useState(false);

  /**
   * Estado do formulário (usado tanto para criar quanto para editar)
   */
  const [form, setForm] = useState({
    numero: "",
    operadora: "",
    status: "ativa",
  });

  /**
   * ID da linha em edição
   * null → modo criação
   * id → modo edição
   */
  const [editId, setEditId] = useState(null);

    /**
   * Filtro de status aplicado à lista
   * "todos" exibe todas as linhas
   */
  const [statusFiltro, setStatusFiltro] = useState("todos");

    /**
   * Lista de linhas já filtrada por status
   */
  const linhasFiltradas =
    statusFiltro === "todos"
      ? linhas
      : linhas.filter((linha) => linha.status === statusFiltro);


  /**
   * Busca todas as linhas no backend
   * Mantém o estado sempre sincronizado
   */
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

  /**
   * Carrega as linhas ao montar o componente
   */
  useEffect(() => {
    carregarLinhas();
  }, []);

  /**
   * Submissão do formulário
   * - Cria nova linha quando editId === null
   * - Atualiza linha existente quando editId !== null
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Validação básica
    if (!form.numero || !form.operadora || !form.status) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        // Atualização
        await updateLinha(editId, form);
      } else {
        // Criação
        await createLinha(form);
      }

      // Reset do formulário
      setForm({ numero: "", operadora: "", status: "ativa" });
      setEditId(null);

      // Recarrega lista após alteração
      await carregarLinhas();
    } catch (err) {
      alert("Erro ao salvar linha");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Remove uma linha pelo ID
   */
  async function handleDelete(id) {
    if (!confirm("Deseja excluir esta linha?")) return;
    await deleteLinha(id);
    carregarLinhas();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
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

        {/* Botão de cancelamento visível apenas em modo edição */}
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
      {/* FILTRO POR STATUS */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Filtrar por status:</label>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="ativa">Ativa</option>
          <option value="suspensa">Suspensa</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {loading && <p>Carregando...</p>}

      {!loading && linhas.length === 0 && (
        <p>Nenhuma linha cadastrada</p>
      )}

      {/* TABELA DE LINHAS */}
      {!loading && linhas.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Número</th>
              <th>Operadora</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((linha) => (
              <tr key={linha.id}>
                <td>{linha.numero}</td>
                <td>{linha.operadora}</td>
                <td>{linha.status}</td>
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
                  >
                    Editar
                  </button>

                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => handleDelete(linha.id)}
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
