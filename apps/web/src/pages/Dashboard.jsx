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
  const [filtroDDI, setFiltroDDI] = useState("todos");
  const [filtroCodigoPais, setFiltroCodigoPais] = useState("");
  const [showDropdownPais, setShowDropdownPais] = useState(false);
  const [showFiltrosModal, setShowFiltrosModal] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [formOriginal, setFormOriginal] = useState(null);
  const [filtrosOriginais, setFiltrosOriginais] = useState(null);

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

  // Função para calcular data de vencimento (90 dias após a criação) com ajuste de timezone
  const calcularDataVencimento = (dataUltimaRecarga) => {
    if (!dataUltimaRecarga) return '';
    
    // Cria data em UTC para evitar problemas de timezone
    const data = new Date(dataUltimaRecarga);
    data.setUTCDate(data.getUTCDate() + 90);
    
    // Formata para o formato datetime-local
    return data.toISOString().slice(0, 16);
  };

  // Função para calcular dias sem recarga
  const calcularDiasSemRecarga = (dataUltimaRecarga) => {
    if (!dataUltimaRecarga) return 0;
    
    const data = new Date(dataUltimaRecarga);
    const hoje = new Date();
    const diferenca = hoje - data;
    return Math.floor(diferenca / (1000 * 60 * 60 * 24));
  };

  // Função para determinar status automático baseado em dias sem recarga
  const calcularStatusAutomatico = (dataUltimaRecarga, statusAtual) => {
    const diasSemRecarga = calcularDiasSemRecarga(dataUltimaRecarga);
    
    if (diasSemRecarga > 150) {
      return 'cancelado';
    } else if (diasSemRecarga > 90) {
      return 'bloqueado';
    }
    
    // Se os dias estão dentro do limite, é ativa
    return 'ativa';
  };

  const linhasFiltradas =
    linhas.filter((linha) => {
      const matchesStatus = statusFiltro === "todos" || linha.status === statusFiltro;
      const matchesDDI = filtroDDI === "todos" || (linha.codigoTelefone || "+55") === filtroDDI;
      const matchesSearch = searchTerm === "" ||
        linha.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        linha.operadora.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesDDI && matchesSearch;
    });

  // Paginação
  const totalPaginas = Math.ceil(linhasFiltradas.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const linhasPaginadas = linhasFiltradas.slice(indiceInicial, indiceFinal);

  async function carregarLinhas() {
    setLoading(true);
    try {
      const data = await getLinhas();
      if (Array.isArray(data)) {
        // Aplica status automático apenas para bloqueado e cancelado
        const linhasComStatusAtualizado = data.map(linha => {
          const statusAutomatico = calcularStatusAutomatico(linha.data_ultima_recarga, linha.status);
          // Permite que status bloqueado/cancelado sejam ativados automaticamente
          // mas respeita o status atual se for diferente
          return {
            ...linha,
            status: statusAutomatico
          };
        });
        setLinhas(linhasComStatusAtualizado);
      } else {
        setLinhas([]);
      }
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

  // DDDs válidos brasileiros
  const dddsValidos = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // São Paulo
    21, 22, 24, // Rio de Janeiro
    27, 28, // Espírito Santo
    31, 32, 33, 34, 35, 37, 38, // Minas Gerais
    41, 42, 43, 44, 45, 46, // Paraná
    47, 48, 49, // Santa Catarina
    51, 53, 54, 55, // Rio Grande do Sul
    61, 62, 64, // Distrito Federal e Goiás
    63, 64, 65, 66, 67, 68, 69, // Mato Grosso, Mato Grosso do Sul, Rondônia, Roraima, Amazonas, Amapá, Tocantins
    71, 73, 74, 75, 77, // Bahia
    79, // Sergipe
    81, 82, 83, 84, 85, 86, 87, 88, 89, // Ceará, Pernambuco, Alagoas, Paraíba, Rio Grande do Norte
    91, 92, 93, 94, 95, 97, 98, 99, // Pará, Amazonas, Amapá
  ];

  // Função para validar se é um padrão óbvio (sequência ou repetição)
  const ehPadraoObvio = (numero) => {
    const digitos = numero.replace(/\D/g, '');
    
    // Números com muitas repetições (tipo 11111111 ou 22222222)
    if (/^(\d)\1{6,}$/.test(digitos)) return true;
    
    // Sequências óbvias (tipo 12345678 ou 87654321)
    if (/^(0123456789|1234567890|123456789|987654321|12345678|23456789|34567890|45678901|56789012|67890123|78901234|89012345|90123456)/.test(digitos)) return true;
    
    // Padrões alternados óbvios (tipo 12121212, 01010101)
    if (/^([0-9])\d?(?:\1\d?)+$/.test(digitos) && /^(.{2})\1+$/.test(digitos)) return true;
    
    return false;
  };

  // Função para validar número brasileiro com regras mais rigorosas
  const validarNumeroCompleto = (numero) => {
    const apenasDigitos = numero.replace(/\D/g, '');
    
    // Para Brasil (+55), aceita 10 ou 11 dígitos
    if (form.codigoTelefone === "+55") {
      // Verifica tamanho
      if (apenasDigitos.length !== 10 && apenasDigitos.length !== 11) {
        return false;
      }

      // Verifica se é um padrão óbvio
      if (ehPadraoObvio(apenasDigitos)) {
        return false;
      }

      // Extrai DDD (primeiros 2 dígitos)
      const ddd = parseInt(apenasDigitos.substring(0, 2));
      
      // Valida se DDD existe
      if (!dddsValidos.includes(ddd)) {
        return false;
      }

      // Extrai o primeiro dígito do número (após DDD)
      const primeiroDigitoNumero = parseInt(apenasDigitos[2]);

      // Validações específicas para Brasil
      if (apenasDigitos.length === 10) {
        // Número com 8 dígitos (fixo)
        // Deve começar com 2-5 (fixo) ou 6-9 (celular antigo) - mas 6-8 são raros
        if (primeiroDigitoNumero === 0 || primeiroDigitoNumero === 1) {
          return false; // 0 e 1 são inválidos para fixos
        }
      } else if (apenasDigitos.length === 11) {
        // Número com 9 dígitos (celular)
        // Deve começar com 9
        if (primeiroDigitoNumero !== 9) {
          return false;
        }
      }

      return true;
    }
    
    // Para outros países, valida mínimo de 7 dígitos
    return apenasDigitos.length >= 7;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.numero || !form.operadora || !form.status) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar se o número é completo e tem tamanho adequado
    if (!validarNumeroCompleto(form.numero)) {
      const codigoAtual = form.codigoTelefone || "+55";
      const apenasDigitos = form.numero.replace(/\D/g, '');
      const ddd = parseInt(apenasDigitos.substring(0, 2));
      
      if (codigoAtual === "+55") {
        let mensagemErro = "❌ Número inválido!\n\n";

        // Verifica qual foi o erro
        if (apenasDigitos.length !== 10 && apenasDigitos.length !== 11) {
          mensagemErro += "Formato incorreto. Para números brasileiros (+55):\n" +
            "• (XX) XXXX-XXXX (10 dígitos - Fixo/Celular antigo)\n" +
            "• (XX) NNNNN-XXXX (11 dígitos - Celular moderno)\n\n";
        } else if (!dddsValidos.includes(ddd)) {
          mensagemErro += `O DDD (${ddd}) não é válido!\n\n` +
            "Verifique se digitou corretamente o código de área.\n\n";
        } else if (ehPadraoObvio(apenasDigitos)) {
          mensagemErro += "O número parece ser um padrão óbvio ou sequência.\n" +
            "Por favor, insira um número real e válido.\n\n";
        } else {
          const primeiroDigito = apenasDigitos[2];
          if (apenasDigitos.length === 11 && primeiroDigito !== '9') {
            mensagemErro += "Celular deve começar com 9!\n" +
              `Você digitou: (${apenasDigitos.substring(0, 2)}) ${primeiroDigito}...\n\n`;
          } else if (apenasDigitos.length === 10 && (primeiroDigito === '0' || primeiroDigito === '1')) {
            mensagemErro += "Número de fixo inválido!\n" +
              "Fixos devem começar com 2-5 ou raramente 6-8.\n\n";
          }
        }

        mensagemErro += "Exemplos válidos:\n" +
          "• (85) 3333-4444 (Fixo em Fortaleza)\n" +
          "• (85) 98500-3930 (Celular em Fortaleza)";

        alert(mensagemErro);
      } else {
        alert(`❌ Número inválido!\n\nO número deve ter pelo menos 7 dígitos.`);
      }
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

      // Sempre recalcula o status baseado na data de recarga
      const statusFinal = form.data_ultima_recarga 
        ? calcularStatusAutomatico(form.data_ultima_recarga, form.status)
        : form.status;

      const formComStatusAtualizado = {
        ...form,
        status: statusFinal
      };

      if (editId) {
        await updateLinha(editId, formComStatusAtualizado);
      } else {
        await createLinha(formComStatusAtualizado);
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
      const novoForm = {
        numero: linha.numero,
        operadora: linha.operadora,
        status: linha.status,
        data_ultima_recarga: dataRecarga,
        data_vencimento_aproximada: dataRecarga ? calcularDataVencimento(dataRecarga) : "",
        fonte_status: linha.fonte_status || "Manual",
        codigoTelefone: linha.codigoTelefone || "+55",
      };
      setForm(novoForm);
      setFormOriginal(novoForm);
    } else {
      setEditId(null);
      const formVazio = { numero: "", operadora: "", status: "ativa", data_ultima_recarga: "", data_vencimento_aproximada: "", fonte_status: "Manual", codigoTelefone: "+55" };
      setForm(formVazio);
      setFormOriginal(formVazio);
    }
    setShowModal(true);
  }

  const handleCloseModalCadastro = () => {
    // Verifica se houve alterações
    if (form !== formOriginal && (
      form.numero !== formOriginal.numero ||
      form.operadora !== formOriginal.operadora ||
      form.status !== formOriginal.status ||
      form.data_ultima_recarga !== formOriginal.data_ultima_recarga ||
      form.fonte_status !== formOriginal.fonte_status ||
      form.codigoTelefone !== formOriginal.codigoTelefone
    )) {
      if (window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?")) {
        setShowModal(false);
      }
    } else {
      setShowModal(false);
    }
  };

  const handleCloseFiltrosModal = () => {
    // Verifica se houve alterações nos filtros
    if (filtrosOriginais && (
      statusFiltro !== filtrosOriginais.statusFiltro ||
      filtroDDI !== filtrosOriginais.filtroDDI ||
      searchTerm !== filtrosOriginais.searchTerm
    )) {
      if (window.confirm("Você alterou os filtros. Deseja descartar as alterações?")) {
        setStatusFiltro(filtrosOriginais.statusFiltro);
        setFiltroDDI(filtrosOriginais.filtroDDI);
        setSearchTerm(filtrosOriginais.searchTerm);
        setShowFiltrosModal(false);
      }
    } else {
      setShowFiltrosModal(false);
    }
  };

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
            gap: 12
          }} className="filter-section">
            <button
              onClick={() => {
                setFiltrosOriginais({ statusFiltro, filtroDDI, searchTerm });
                setShowFiltrosModal(true);
              }}
              title="Abrir filtros"
              style={{
                padding: '11px 14px',
                background: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                height: '44px',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e0e0e0';
                e.target.style.borderColor = '#999';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
                e.target.style.borderColor = '#ddd';
              }}
            >
              🔎
            </button>

            <input
              type="text"
              placeholder="Buscar por número ou operadora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                flex: 1,
                fontSize: '14px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2196F3'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />

            <button
              onClick={() => openModal()}
              className="btn-cadastrar"
              style={{
                padding: '12px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.3s',
                flexShrink: 0
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              + Cadastrar
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
            <>
              {/* Paginação no topo */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', minWidth: 'fit-content' }}>
                  Exibindo {indiceInicial + 1}-{Math.min(indiceFinal, linhasFiltradas.length)} de {linhasFiltradas.length}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: 3,
                      cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      backgroundColor: paginaAtual === 1 ? '#f0f0f0' : 'white',
                      color: paginaAtual === 1 ? '#999' : '#333',
                      transition: 'all 0.2s'
                    }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let numeroPagina;
                    if (totalPaginas <= 5) {
                      numeroPagina = i + 1;
                    } else if (paginaAtual <= 3) {
                      numeroPagina = i + 1;
                    } else if (paginaAtual >= totalPaginas - 2) {
                      numeroPagina = totalPaginas - 4 + i;
                    } else {
                      numeroPagina = paginaAtual - 2 + i;
                    }

                    return (
                      <button
                        key={numeroPagina}
                        onClick={() => setPaginaAtual(numeroPagina)}
                        style={{
                          padding: '4px 8px',
                          border: paginaAtual === numeroPagina ? 'none' : '1px solid #ddd',
                          borderRadius: 3,
                          cursor: 'pointer',
                          fontSize: '11px',
                          backgroundColor: paginaAtual === numeroPagina ? '#2196F3' : 'white',
                          color: paginaAtual === numeroPagina ? 'white' : '#333',
                          fontWeight: paginaAtual === numeroPagina ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {numeroPagina}
                      </button>
                    );
                  })}

                  {totalPaginas > 5 && paginaAtual < totalPaginas - 2 && (
                    <span style={{ padding: '0 2px', color: '#666', fontSize: '11px' }}>...</span>
                  )}

                  <button
                    onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                    disabled={paginaAtual === totalPaginas}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: 3,
                      cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      backgroundColor: paginaAtual === totalPaginas ? '#f0f0f0' : 'white',
                      color: paginaAtual === totalPaginas ? '#999' : '#333',
                      transition: 'all 0.2s'
                    }}
                  >
                    ›
                  </button>
                </div>

                <select
                  value={itensPorPagina}
                  onChange={(e) => {
                    setItensPorPagina(parseInt(e.target.value));
                    setPaginaAtual(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: 3,
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Tabela */}
            </>
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
                  {linhasPaginadas.map((linha, index) => (
                    <tr key={linha.id} style={{
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                      transition: 'background-color 0.2s'
                    }}>
                      <td className="table-cell" style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{linha.id}</td>
                      <td className="table-cell" style={{ padding: '12px', borderBottom: '1px solid #eee', fontFamily: 'monospace', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}>
                          {linha.codigoTelefone || "+55"} {linha.numero}
                        </span>
                      </td>
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
                    onClick={handleCloseModalCadastro}
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0' }}>
                        <button
                          type="button"
                          onClick={() => setShowDropdownPais(!showDropdownPais)}
                          style={{
                            position: 'relative',
                            minWidth: '80px',
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

                          {showDropdownPais && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              right: '0',
                              backgroundColor: 'white',
                              border: '1px solid #ddd',
                              borderTop: 'none',
                              borderRadius: '0 0 6px 6px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              zIndex: 10,
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                              marginTop: '2px'
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
                        </button>

                        <input
                          type="text"
                          placeholder="9 99999-9999"
                          value={form.numero}
                          onChange={(e) => setForm({ ...form, numero: formatarNumeroTelefone(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '0 6px 6px 0',
                            border: '2px solid #ddd',
                            borderLeft: 'none',
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        Status *
                        <span
                          title="Regras de negócio:\n• ATIVA: até 90 dias sem recarga\n• BLOQUEADO: entre 91 e 150 dias\n• CANCELADO: mais de 150 dias"
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
                            cursor: 'help',
                            marginLeft: '4px'
                          }}
                        >
                          ℹ
                        </span>
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>(Automático)</span>
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          fontSize: '14px',
                          backgroundColor: '#e8f5e9',
                          cursor: 'not-allowed',
                          opacity: 0.8,
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        required
                      >
                        <option value="ativa">✅ Ativa</option>
                        <option value="bloqueado">🚫 Bloqueado</option>
                        <option value="cancelado">❌ Cancelado</option>
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        <span>📅 Última Recarga</span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'normal',
                          color: form.data_ultima_recarga ? '#666' : '#ccc',
                          backgroundColor: form.data_ultima_recarga ? '#f0f0f0' : '#f9f9f9',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}>
                          {form.data_ultima_recarga ? `${calcularDiasSemRecarga(form.data_ultima_recarga)} dias` : '-'}
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        value={form.data_ultima_recarga}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          // Recalcula automaticamente o status baseado na nova data
                          const novoStatus = calcularStatusAutomatico(newDate, form.status);
                          setForm({ 
                            ...form, 
                            data_ultima_recarga: newDate,
                            data_vencimento_aproximada: calcularDataVencimento(newDate),
                            status: novoStatus
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
                      onClick={handleCloseModalCadastro}
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

          {/* Modal de Filtros */}
          {showFiltrosModal && (
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
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease-out'
              }}>
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
                    🔎 Filtros
                  </h3>
                  <button
                    onClick={handleCloseFiltrosModal}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'bold',
                      color: '#333',
                      fontSize: '14px'
                    }}>
                      Filtrar por status:
                    </label>
                    <select
                      value={statusFiltro}
                      onChange={(e) => setStatusFiltro(e.target.value)}
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
                      <option value="todos">Todos</option>
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
                      Filtrar por DDI:
                    </label>
                    <select
                      value={filtroDDI}
                      onChange={(e) => setFiltroDDI(e.target.value)}
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
                      <option value="todos">Todos</option>
                      {paisesDisponiveis.map((pais) => (
                        <option key={pais.codigo} value={pais.codigo}>
                          {pais.bandeira} {pais.codigo} - {pais.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    paddingTop: '20px',
                    borderTop: '1px solid #eee'
                  }}>
                    <button
                      onClick={() => {
                        setStatusFiltro('todos');
                        setFiltroDDI('todos');
                        setSearchTerm('');
                      }}
                      style={{
                        padding: '12px 20px',
                        background: '#f5f5f5',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#e0e0e0';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#f5f5f5';
                      }}
                    >
                      🔄 Limpar
                    </button>

                    <button
                      onClick={handleCloseFiltrosModal}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
                      ✅ Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}