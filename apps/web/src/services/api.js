const API_URL = "http://localhost:3000";

// Buscar todas as linhas
export async function getLinhas() {
  try {
    const res = await fetch(`${API_URL}/linhas`);
    if (!res.ok) throw new Error('Erro ao buscar linhas');
    return await res.json();
  } catch (error) {
    console.error('Erro no getLinhas:', error);
    throw error;
  }
}

// Criar nova linha
export async function createLinha(data) {
  try {
    const res = await fetch(`${API_URL}/linhas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Erro ao criar linha');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Erro no createLinha:', error);
    throw error;
  }
}

// Atualizar linha existente
export async function updateLinha(id, data) {
  try {
    const res = await fetch(`${API_URL}/linhas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Erro ao atualizar linha');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Erro no updateLinha:', error);
    throw error;
  }
}

// Excluir linha
export async function deleteLinha(id) {
  try {
    const res = await fetch(`${API_URL}/linhas/${id}`, {
      method: "DELETE",
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Erro ao excluir linha');
    }
  } catch (error) {
    console.error('Erro no deleteLinha:', error);
    throw error;
  }
}

// Verificar saúde da API
export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    return await res.json();
  } catch (error) {
    console.error('API não está respondendo:', error);
    return { status: 'error', message: 'API não disponível' };
  }
}