import pg from 'pg';
const { Pool } = pg;
// ...existing code...

// Suporte a múltiplos nomes de variáveis para compatibilidade
function getEnv(key, fallback) {
  return process.env[key] || process.env[key.replace('POSTGRES_', 'DB_')] || fallback;
}

// ...existing code...

export const pool = new Pool({
  host: getEnv('DB_HOST', 'localhost'),
  port: parseInt(getEnv('DB_PORT', '5432')),
  user: getEnv('DB_USER', 'postgres'),
  password: getEnv('DB_PASSWORD', 'postgres'),
  database: getEnv('DB_NAME', 'gestor_linhas'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log seguro (não mostra senha)
pool.on('connect', () => {
  console.log(`✅ Conectado ao PostgreSQL como ${getEnv('DB_USER', 'postgres')}@${getEnv('DB_HOST', 'localhost')}`);
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool PostgreSQL:', err.message);
});

export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW(), current_user');
    console.log('✅ Conexão OK - Usuário:', res.rows[0].current_user);
    return true;
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message);
    return false;
  }
}