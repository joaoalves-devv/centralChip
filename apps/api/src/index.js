import express from "express";
import cors from "cors";
import { pool } from "./services/db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check com banco
app.get("/health", async (req, res) => {
  const result = await pool.query("SELECT 1");
  res.json({ status: "ok", db: true });
});

// Cria tabela automaticamente
await pool.query(`
  CREATE TABLE IF NOT EXISTS linhas (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20),
    operadora VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

app.post("/linhas", async (req, res) => {
  const { numero, operadora, status } = req.body;

  const result = await pool.query(
    `INSERT INTO linhas (numero, operadora, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [numero, operadora, status]
  );

  res.status(201).json(result.rows[0]);
});

app.get("/linhas", async (req, res) => {
  const result = await pool.query("SELECT * FROM linhas");
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log("API rodando na porta 3000");
});
