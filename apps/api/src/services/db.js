import pg from 'pg';
const { Pool } = pg;

// Configuração da conexão com o banco de dados
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'gestor_linhas',
  max: 20, // número máximo de clientes no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão ao iniciar
pool.on('connect', () => {
  console.log('Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro no pool do PostgreSQL:', err);
});

// Função para testar a conexão
export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexão com banco OK:', res.rows[0]);
    return true;
  } catch (err) {
    console.error('Erro na conexão com banco:', err);
    return false;
  }
}