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