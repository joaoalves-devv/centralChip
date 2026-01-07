# Gestor de Linhas Pré-Pagas

Monorepo com Web, Mobile e API.

# Estrutura
```
gestor-linhas/
│
├─ apps/
│   ├─ web/                 # React Dashboard (Web / PWA)
│   │   ├─ src/
│   │   │   ├─ components/
│   │   │   ├─ pages/
│   │   │   ├─ services/     # chamadas API
│   │   │   └─ App.jsx
│   │   └─ vite.config.js
│   │
│   ├─ mobile/              # React + Capacitor
│   │   ├─ src/             # mesmo código base do web
│   │   ├─ capacitor.config.ts
│   │   └─ android/         # projeto Android nativo
│   │
│   └─ api/                 # Backend Node
│       ├─ src/
│       │   ├─ controllers/
│       │   ├─ services/
│       │   ├─ routes/
│       │   ├─ middlewares/
│       │   └─ index.ts
│       └─ package.json
│
├─ packages/
│   ├─ shared/              # tipos, regras, parsers
│   │   ├─ statusRules.ts
│   │   └─ ussdParsers.ts
│
├─ docs/
│   ├─ arquitetura.md
│   └─ api.md
│
├─ docker/
│   ├─ api.Dockerfile
│   └─ docker-compose.yml
│
├─ .env.example
├─ package.json
└─ README.md
```