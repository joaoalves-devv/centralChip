import pg from 'pg';
const { Pool } = pg;

// Validação das variáveis
const required = ['DB_HOST', 'DB_PORT', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missing);
  // Fallback para desenvolvimento
  console.warn('⚠️ Usando valores padrão para desenvolvimento');
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log seguro (não mostra senha)
pool.on('connect', () => {
  console.log(`✅ Conectado ao PostgreSQL como ${process.env.POSTGRES_USER || 'postgres'}@${process.env.DB_HOST || 'db'}`);
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