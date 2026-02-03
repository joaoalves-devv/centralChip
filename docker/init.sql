CREATE TABLE IF NOT EXISTS linhas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  operadora VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  data_ultima_recarga TIMESTAMP,
  data_vencimento_aproximada TIMESTAMP,
  ultimo_status_confirmado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fonte_status VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cria usuário se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'teste-user') THEN
    CREATE USER "teste-user" WITH PASSWORD 'teste-user';
  END IF;
END $$;

-- Cria banco de dados se não existir
SELECT 'CREATE DATABASE gestor_linhas'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gestor_linhas')\gexec

-- Concede privilégios
GRANT ALL PRIVILEGES ON DATABASE gestor_linhas TO "teste-user";

-- Conecta ao banco e concede mais privilégios
\c gestor_linhas;
GRANT ALL ON SCHEMA public TO "teste-user";
ALTER USER "teste-user" WITH SUPERUSER;