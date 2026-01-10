-- Cria uma tabela para armazenar linhas no postgres
CREATE TABLE IF NOT EXISTS linhas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  operadora VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
