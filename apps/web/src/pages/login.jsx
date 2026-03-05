import { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";


export default function Login({ onLogin }) {
    const navigator = useNavigate();

  const [form, setForm] = useState({
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Verificar se já existe um login salvo
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setForm(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validação básica
    if (!form.email || !form.senha) {
      setError("Preencha todos os campos!");
      return;
    }

    if (!form.email.includes('@')) {
      setError("Email inválido!");
      return;
    }

    setLoading(true);

    // Simular autenticação
    setTimeout(() => {
      // Credenciais fixas para exemplo
      if (form.email === "admin@centralchip.com" && form.senha === "123456") {
        
        // Salvar email se "lembrar-me" estiver marcado
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", form.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        
        // Salvar token de autenticação
        localStorage.setItem("authToken", "token_simulado_" + Date.now());
        localStorage.setItem("userEmail", form.email);
        
        // Chamar a função de callback passada por props
        if (onLogin) {
          onLogin(true);
        }
      } else {
        setError("Email ou senha incorretos!");
      }
        navigator("/dashboard");

      setLoading(false);
    }, 1500);
    };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 30px 20px !important;
          }
          
          .login-title {
            font-size: 24px !important;
          }
          
          .login-subtitle {
            font-size: 14px !important;
          }
          
          .input-group {
            margin-bottom: 15px !important;
          }
          
          .login-button {
            font-size: 16px !important;
            padding: 12px !important;
          }
        }
      `}</style>

      <div className="login-card" style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '450px',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        
        {/* Logo / Título */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#2196F3',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 20px rgba(33,150,243,0.3)'
          }}>
            <span style={{
              color: 'white',
              fontSize: '40px',
              fontWeight: 'bold'
            }}>C</span>
          </div>
          
          <h2 className="login-title" style={{
            margin: '0',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            CentralChip
          </h2>
          
          <p className="login-subtitle" style={{
            margin: '10px 0 0',
            color: '#666',
            fontSize: '16px'
          }}>
            Faça login para acessar o gestor de linhas
          </p>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {/* Campo Email */}
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#555',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Digite seu email"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '15px',
                transition: 'border-color 0.3s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2196F3'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Campo Senha */}
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#555',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder="Digite sua senha"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  paddingRight: '45px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Opções adicionais */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
          </div>

          {/* Botão de Login */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 5px 15px rgba(33,150,243,0.4)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#1976D2';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#2196F3';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Informações de teste */}
          <div style={{
            backgroundColor: '#f5f5f5',
            height: '0px',
            overflow: 'hidden',
            padding: '2px',
            borderRadius: '10px',
            textAlign: 'center',

          }}
          onClick={() => {
            setForm({ email: "admin@centralchip.com", senha: "123456" });
          }}
            >
          </div>
        </form>
      </div>
    </div>
  );
}