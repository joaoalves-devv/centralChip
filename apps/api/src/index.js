import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// rota de saúde
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// dados em memória (temporário)
const linhas = [];

// criar linha
app.post("/linhas", (req, res) => {
  const linha = {
    id: Date.now(),
    ...req.body,
    created_at: new Date()
  };

  linhas.push(linha);
  res.status(201).json(linha);
});

// listar linhas
app.get("/linhas", (req, res) => {
  res.json(linhas);
});

app.listen(3000, () => {
  console.log("API rodando na porta 3000");
});
