import express from "express";
import cors from "cors";
import { pool } from "./services/db.js";

const app = express();
app.use(cors());
app.use(express.json());

// GET /health - verifica se API e banco estão funcionando
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", message: "API e banco estão funcionando" });
  } catch {
    res.status(500).json({ status: "error", message: "Erro no banco de dados" });
  }
});

// GET /linhas - busca todas as linhas
app.get("/linhas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM linhas ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar linhas:", err);
    res.status(500).json({ error: "Erro ao buscar linhas" });
  }
});

// POST /linhas - cria nova linha
app.post("/linhas", async (req, res) => {
  const { numero, operadora, status, data_ultima_recarga, data_vencimento_aproximada, fonte_status } = req.body;

  if (!numero || !operadora || !status) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO linhas (numero, operadora, status, data_ultima_recarga, data_vencimento_aproximada, fonte_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [numero, operadora, status, data_ultima_recarga || null, data_vencimento_aproximada || null, fonte_status || 'manual']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar linha:", err);
    res.status(500).json({ error: "Erro ao criar linha" });
  }
});

// PUT /linhas/:id - atualiza uma linha
app.put("/linhas/:id", async (req, res) => {
  const { id } = req.params;
  const { numero, operadora, status, data_ultima_recarga, data_vencimento_aproximada, fonte_status } = req.body;

  try {
    // Verifica se a linha existe
    const atual = await pool.query(
      "SELECT * FROM linhas WHERE id = $1",
      [id]
    );

    if (atual.rowCount === 0) {
      return res.status(404).json({ error: "Linha não encontrada" });
    }

    const linha = atual.rows[0];

    // Atualiza a linha
    const result = await pool.query(
      `
      UPDATE linhas
      SET numero = COALESCE($1, numero),
          operadora = COALESCE($2, operadora),
          status = COALESCE($3, status),
          data_ultima_recarga = COALESCE($4, data_ultima_recarga),
          data_vencimento_aproximada = COALESCE($5, data_vencimento_aproximada),
          fonte_status = COALESCE($6, fonte_status),
          ultimo_status_confirmado = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        numero,
        operadora,
        status,
        data_ultima_recarga,
        data_vencimento_aproximada,
        fonte_status,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar linha:", err);
    res.status(500).json({ error: "Erro ao atualizar linha" });
  }
});

// DELETE /linhas/:id - remove uma linha
app.delete("/linhas/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM linhas WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Linha não encontrada" });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao excluir linha:", err);
    res.status(500).json({ error: "Erro ao excluir linha" });
  }
});

// Inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});