# Segurança - Guia de Credenciais

## ⚠️ IMPORTANTE: Credenciais Expostas Foram Removidas

Credenciais do banco de dados foram removidas do histórico Git usando `git filter-branch`.

## Setup Inicial

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

### 2. Editar .env com suas Credenciais

Abra `.env` e configure com valores seguros:
```
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=senha_muito_forte_aqui
POSTGRES_DB=seu_banco_dados
```

### 3. NUNCA comitar .env

O arquivo `.env` está no `.gitignore`. Nunca faça commit dele.

## Melhores Práticas

✅ **FAÇA:**
- Use variáveis de ambiente para credenciais
- Use `.env.example` como template
- Gere senhas fortes (openssl rand -base64 16)
- Mantenha `.env` no `.gitignore`

❌ **NÃO FAÇA:**
- Comitar credenciais reais no repositório
- Commitar arquivos `.env`
- Commitar senhas no código
- Compartilhar credenciais via Git

## Ferramentas de Verificação

Use ferramentas para evitar commits acidentais:
- [git-secrets](https://github.com/awslabs/git-secrets)
- [GitGuardian](https://www.gitguardian.com/)
- [detect-secrets](https://github.com/Yelp/detect-secrets)

## Se Credenciais Vazarem

1. Mude a senha imediatamente
2. Use `git filter-branch` ou `git filter-repo`
3. Force push para limpar histórico
4. Avise todos os colaboradores
