import express from "express";
import cors from "cors";
import { pool } from "./services/db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check com banco
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: true });
  } catch (err) {
    res.status(500).json({ status: "error", db: false });
  }
}); 

// GET /linhas - busca todas as linhas
app.get("/linhas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM linhas ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
  console.error("ERRO AO BUSCAR LINHAS:", err.message);
  res.status(500).json({
    error: "Erro ao buscar linhas",
    detail: err.message
  });
}
});

// POST /linhas - cria nova linha
app.post("/linhas", async (req, res) => {
  const { numero, operadora, status } = req.body;

  if (!numero || !operadora || !status) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO linhas (numero, operadora, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [numero, operadora, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar linha" });
  }
});

// DELETE /linhas/:id - remove uma linha
app.delete("/linhas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM linhas WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Linha não encontrada" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar linha" });
  }
});

// Inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
