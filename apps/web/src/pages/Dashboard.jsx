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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    numero: "",
    operadora: "",
    status: "ativa",
    data_ultima_recarga: "",
    data_vencimento_aproximada: "",
    fonte_status: "Manual",
    codigoTelefone: "+55",
  });
  const [editId, setEditId] = useState(null);
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCodigoPais, setFiltroCodigoPais] = useState("");
  const [showDropdownPais, setShowDropdownPais] = useState(false);

  // Lista de países com códigos
  const paisesDisponiveis = [
    { codigo: "+55", bandeira: "🇧🇷", nome: "Brasil" },
    { codigo: "+1", bandeira: "🇺🇸", nome: "Estados Unidos" },
    { codigo: "+44", bandeira: "🇬🇧", nome: "Reino Unido" },
    { codigo: "+33", bandeira: "🇫🇷", nome: "França" },
    { codigo: "+39", bandeira: "🇮🇹", nome: "Itália" },
    { codigo: "+34", bandeira: "🇪🇸", nome: "Espanha" },
    { codigo: "+49", bandeira: "🇩🇪", nome: "Alemanha" },
    { codigo: "+81", bandeira: "🇯🇵", nome: "Japão" },
    { codigo: "+86", bandeira: "🇨🇳", nome: "China" },
    { codigo: "+91", bandeira: "🇮🇳", nome: "Índia" },
  ];

  // Filtra países baseado na busca
  const paisesFiltrados = paisesDisponiveis.filter(pais =>
    pais.codigo.includes(filtroCodigoPais) || pais.nome.toLowerCase().includes(filtroCodigoPais.toLowerCase())
  );

  // Função para formatar o número do telefone com suporte a números internacionais
  const formatarNumeroTelefone = (valor) => {
    // Remove espaços
    let input = valor.trim();
    
    // Se começa com +55, mantém o prefixo internacional
    if (input.startsWith('+55')) {
      const numeroLimpo = input.replace(/\D/g, '').slice(2); // Remove +55 e não-numéricos
      const numeroLimitado = numeroLimpo.slice(0, 11);
      
      if (numeroLimitado.length <= 2) {
        return '+55 ' + numeroLimitado;
      } else if (numeroLimitado.length <= 6) {
        return `+55 (${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2)}`;
      } else if (numeroLimitado.length <= 10) {
        // 10 dígitos (sem 9): +55 (AA) NNNN-NNNN
        return `+55 (${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 6)}-${numeroLimitado.slice(6)}`;
      } else {
        // 11 dígitos (com 9): +55 (AA) NNNNN-NNNN
        return `+55 (${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 7)}-${numeroLimitado.slice(7)}`;
      }
    }
    
    // Números domésticos
    const numeroLimpo = input.replace(/\D/g, '');
    const numeroLimitado = numeroLimpo.slice(0, 11);
    
    if (numeroLimitado.length <= 2) {
      return numeroLimitado;
    } else if (numeroLimitado.length <= 6) {
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2)}`;
    } else if (numeroLimitado.length <= 10) {
      // 10 dígitos (sem 9): (AA) NNNN-NNNN
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 6)}-${numeroLimitado.slice(6)}`;
    } else {
      // 11 dígitos (com 9): (AA) NNNNN-NNNN
      return `(${numeroLimitado.slice(0, 2)}) ${numeroLimitado.slice(2, 7)}-${numeroLimitado.slice(7)}`;
    }
  };

  // Função para normalizar números e comparar variações
  const normalizarNumero = (numero) => {
    // Remove todos os caracteres não numéricos
    return numero.replace(/\D/g, '');
  };

  // Função para verificar se número já existe (considerando variações com/sem 9)
  const verificarNumeroDuplicado = (numeroParaVerificar, idExcluir = null) => {
    const normalizadoVerificacao = normalizarNumero(numeroParaVerificar);
    
    return linhas.some((linha) => {
      // Exclui o próprio registro sendo editado
      if (idExcluir && linha.id === idExcluir) return false;
      
      const normalizadoExistente = normalizarNumero(linha.numero);
      
      // Verifica match exato
      if (normalizadoExistente === normalizadoVerificacao) return true;
      
      // Verifica variações com/sem o 9 (padrão brasileiro)
      // Exemplo: 11987654321 vs 1187654321
      const apenasDigitosVerif = normalizadoVerificacao.replace(/\D/g, '');
      const apenasDigitosExist = normalizadoExistente.replace(/\D/g, '');
      
      if (apenasDigitosVerif.length === 11 && apenasDigitosExist.length === 10) {
        // Verifica se o número sem 9 existe
        return apenasDigitosVerif.substring(0, 2) + apenasDigitosVerif.substring(3) === apenasDigitosExist;
      }
      
      if (apenasDigitosVerif.length === 10 && apenasDigitosExist.length === 11) {
        // Verifica se adicionando 9 fica igual
        return apenasDigitosVerif === apenasDigitosExist.substring(0, 2) + apenasDigitosExist.substring(3);
      }
      
      return false;
    });
  };

  // Função para calcular data de vencimento (90 dias após a criação)
  const calcularDataVencimento = (dataUltimaRecarga) => {
    if (!dataUltimaRecarga) return '';
    
    const data = new Date(dataUltimaRecarga);
    data.setDate(data.getDate() + 90);
    
    // Formata para o formato datetime-local
    return data.toISOString().slice(0, 16);
  };

  const linhasFiltradas =
    linhas.filter((linha) => {
      const matchesStatus = statusFiltro === "todos" || linha.status === statusFiltro;
      const matchesSearch = searchTerm === "" ||
        linha.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        linha.operadora.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

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
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar duplicata de número (apenas ao criar novo registro)
    if (!editId) {
      if (verificarNumeroDuplicado(form.numero)) {
        alert(
          "⚠️ Este número já está cadastrado no sistema!\n\n" +
          "Números com e sem o dígito 9 são considerados iguais:\n" +
          "• (11) 9 9999-9999 = (11) 99999-9999\n\n" +
          "Por favor, verifique a lista de linhas ou edite o registro existente."
        );
        return;
      }
    }

    // Ao editar, permite o mesmo número, mas avisa se houver outro com o mesmo número
    if (editId && verificarNumeroDuplicado(form.numero, editId)) {
      alert(
        "⚠️ Já existe outro registro com este número!\n\n" +
        "Números com e sem o dígito 9 são considerados iguais."
      );
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        await updateLinha(editId, form);
      } else {
        await createLinha(form);
      }

      setForm({ numero: "", operadora: "", status: "ativa", data_ultima_recarga: "", data_vencimento_aproximada: "", fonte_status: "Manual", codigoTelefone: "+55" });
      setEditId(null);
      setShowModal(false);
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

  function openModal(linha = null) {
    if (linha) {
      setEditId(linha.id);
      const dataRecarga = linha.data_ultima_recarga ? new Date(linha.data_ultima_recarga).toISOString().slice(0, 16) : "";
      setForm({
        numero: linha.numero,
        operadora: linha.operadora,
        status: linha.status,
        data_ultima_recarga: dataRecarga,
        data_vencimento_aproximada: dataRecarga ? calcularDataVencimento(dataRecarga) : "",
        fonte_status: linha.fonte_status || "Manual",
      });
    } else {
      setEditId(null);
      setForm({ numero: "", operadora: "", status: "ativa", data_ultima_recarga: "", data_vencimento_aproximada: "", fonte_status: "Manual", codigoTelefone: "+55" });
    }
    setShowModal(true);
  }

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 10px !important;
          }
          
          .filter-section {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .filter-item {
            width: 100% !important;
          }
          
          .filter-item select,
          .filter-item input {
            width: 100% !important;
          }
          
          .btn-cadastrar {
            width: 100% !important;
          }
          
          .form-grid {
            grid-template-columns: 1fr !important;
          }
          
          .table-container {
            overflow-x: auto !important;
          }
          
          .modal-content {
            width: 95% !important;
            max-width: 100% !important;
            padding: 20px !important;
          }
          
          .action-buttons {
            flex-direction: column !important;
          }
          
          .action-buttons button {
            width: 100% !important;
            margin-right: 0 !important;
            margin-bottom: 8px !important;
          }
          
          .table-header {
            font-size: 12px !important;
            padding: 10px 8px !important;
          }
          
          .table-cell {
            padding: 10px 8px !important;
            font-size: 13px !important;
          }
          
          [style*="gridColumn"] {
            grid-column: auto !important;
          }
        }
        
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 5px !important;
          }
          
          .dashboard-header {
            padding: 15px !important;
            font-size: 18px !important;
          }
          
          .modal-content {
            padding: 15px !important;
          }
          
          .table-cell {
            padding: 8px 5px !important;
            font-size: 12px !important;
          }
          
          .status-badge {
            font-size: 10px !important;
            padding: 3px 8px !important;
          }
          
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }} className="dashboard-container">
        <div style={{
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }} className="dashboard-header">
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            CentralChip - Gestor de Linhas Telefônicas
          </h2>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            gap: 16,
            flexWrap: 'wrap'
          }} className="filter-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
              <div className="filter-item">
                <label style={{ marginRight: 8, fontWeight: 'bold', color: '#333' }}>Filtrar por status:</label>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="ativa">Ativa</option>
                  <option value="suspensa">Suspensa</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="filter-item" style={{ flex: '1', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Buscar por número ou operadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    border: '1px solid #ddd',
                    width: '100%',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => openModal()}
              className="btn-cadastrar"
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              + Cadastrar Nova Linha
            </button>
          </div>

          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666'
            }}>
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #2196F3',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '10px'
              }}></div>
              Carregando...
            </div>
          )}

          {!loading && linhas.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              margin: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📱</div>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>Nenhuma linha cadastrada</p>
              <p>Clique em "Cadastrar Nova Linha" para começar a gerenciar suas linhas telefônicas.</p>
            </div>
          )}

          {!loading && linhas.length > 0 && (
            <div style={{ overflowX: 'auto' }} className="table-container">
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    color: 'white'
                  }}>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold' }}>ID</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold' }}>Número</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold' }}>Operadora</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold' }}>Última Recarga</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold' }}>Vencimento</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'left', fontWeight: 'bold' }}>Fonte</th>
                    <th className="table-header" style={{ padding: '15px 12px', textAlign: 'center', fontWeight: 'bold' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.map((linha, index) => (
                    <tr key={linha.id} style={{
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                      transition: 'background-color 0.2s'
                    }}>
                      <td className="table-cell" style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{linha.id}</td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee', fontFamily: 'monospace', fontSize: '14px' }}>{linha.numero}</td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{linha.operadora}</td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <span className="status-badge" style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          background:
                            linha.status === 'ativa' ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' :
                            linha.status === 'suspensa' ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' :
                            'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {linha.status}
                        </span>
                      </td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#666' }}>
                        {linha.data_ultima_recarga ? new Date(linha.data_ultima_recarga).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#666' }}>
                        {linha.data_vencimento_aproximada ? new Date(linha.data_vencimento_aproximada).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          fontWeight: 'bold'
                        }}>
                          {linha.fonte_status || 'Manual'}
                        </span>
                      </td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <button
                          onClick={() => openModal(linha)}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            marginRight: 8,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                          }}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          onClick={() => handleDelete(linha.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                          }}
                        >
                          🗑️ Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease-out'
              }} className="modal-content">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  borderBottom: '2px solid #2196F3',
                  paddingBottom: '10px'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: '#2196F3',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {editId ? '✏️ Editar Linha' : '➕ Cadastrar Nova Linha'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '0',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                      e.target.style.color = '#333';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#666';
                    }}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }} className="form-grid">
                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        Número * <span style={{ color: '#f44336' }}>(formato automático)</span>
                        <span
                          title="Números com/sem dígito 9 são tratados como iguais (ex: 11987654321 = 1187654321). O formato é ajustado automaticamente conforme você digita."
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'help'
                          }}
                        >
                          ℹ
                        </span>
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setShowDropdownPais(!showDropdownPais)}
                          style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            height: '46px',
                            minWidth: '60px',
                            padding: '0 12px',
                            backgroundColor: 'white',
                            border: '2px solid #ddd',
                            borderRadius: '6px 0 0 6px',
                            borderRight: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            zIndex: 2,
                            transition: 'all 0.3s',
                            fontSize: '14px'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <span style={{ fontSize: '20px' }}>
                            {paisesDisponiveis.find(p => p.codigo === form.codigoTelefone)?.bandeira}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {form.codigoTelefone}
                          </span>
                        </button>

                        {showDropdownPais && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '0 0 6px 0',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 10,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            minWidth: '60px',
                            marginTop: '-1px'
                          }}>
                            <div style={{
                              padding: '8px',
                              borderBottom: '1px solid #eee'
                            }}>
                              <input
                                type="text"
                                placeholder="Buscar..."
                                value={filtroCodigoPais}
                                onChange={(e) => setFiltroCodigoPais(e.target.value)}
                                autoFocus
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              />
                            </div>
                            {paisesFiltrados.map((pais) => (
                              <div
                                key={pais.codigo}
                                onClick={() => {
                                  setForm({ ...form, codigoTelefone: pais.codigo });
                                  setFiltroCodigoPais("");
                                  setShowDropdownPais(false);
                                }}
                                style={{
                                  padding: '10px 8px',
                                  cursor: 'pointer',
                                  backgroundColor: form.codigoTelefone === pais.codigo ? '#e3f2fd' : 'white',
                                  borderBottom: '1px solid #eee',
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                onMouseOut={(e) => e.target.style.backgroundColor = form.codigoTelefone === pais.codigo ? '#e3f2fd' : 'white'}
                              >
                                <span style={{ fontSize: '16px' }}>{pais.bandeira}</span>
                                <span>{pais.codigo}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder="9 99999-9999"
                          value={form.numero}
                          onChange={(e) => setForm({ ...form, numero: formatarNumeroTelefone(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 75px',
                            borderRadius: '6px',
                            border: '2px solid #ddd',
                            fontSize: '14px',
                            transition: 'border-color 0.3s',
                            backgroundColor: '#fafafa'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                          onBlur={(e) => e.target.style.borderColor = '#ddd'}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        Operadora *
                      </label>
                      <input
                        placeholder="Vivo, Claro, TIM, Oi..."
                        value={form.operadora}
                        onChange={(e) => setForm({ ...form, operadora: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          fontSize: '14px',
                          transition: 'border-color 0.3s',
                          backgroundColor: '#fafafa'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }} className="form-grid">
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        Status *
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          fontSize: '14px',
                          backgroundColor: '#fafafa',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        required
                      >
                        <option value="ativa">✅ Ativa</option>
                        <option value="suspensa">⚠️ Suspensa</option>
                        <option value="cancelada">❌ Cancelada</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        Fonte Status
                      </label>
                      <select
                        value={form.fonte_status}
                        onChange={(e) => setForm({ ...form, fonte_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          fontSize: '14px',
                          backgroundColor: '#fafafa',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      >
                        <option value="Manual">📝 Manual</option>
                        <option value="ussd">📱 USSD</option>
                        <option value="sistema">⚙️ Sistema</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }} className="form-grid">
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        📅 Última Recarga
                      </label>
                      <input
                        type="datetime-local"
                        value={form.data_ultima_recarga}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setForm({ 
                            ...form, 
                            data_ultima_recarga: newDate,
                            data_vencimento_aproximada: calcularDataVencimento(newDate)
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          fontSize: '14px',
                          backgroundColor: '#fafafa',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        ⏰ Vencimento Aproximado
                        <span
                          title="Calculado automaticamente com base na data de última recarga + 90 dias"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'help'
                          }}
                        >
                          ℹ
                        </span>
                      </label>
                      <div
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          fontSize: '14px',
                          backgroundColor: '#f0f8ff',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#2196F3',
                          fontWeight: 'bold',
                          minHeight: '46px'
                        }}
                      >
                        {form.data_vencimento_aproximada 
                          ? new Date(form.data_vencimento_aproximada).toLocaleString('pt-BR')
                          : 'Preencha a data de recarga'
                        }
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #eee' }} className="action-buttons">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: '12px 24px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#5a6268';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#6c757d';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      ❌ Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        background: editId ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        opacity: loading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        }
                      }}
                    >
                      {loading ? '⏳ Salvando...' : (editId ? '✅ Atualizar' : '➕ Criar')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}