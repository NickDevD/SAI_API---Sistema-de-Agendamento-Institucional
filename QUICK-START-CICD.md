# 📖 Guia Rápido: CI/CD em 5 Minutos

## 🚀 Passo 1: Preparar Repositório

```bash
# Clonar (se não tiver)
git clone https://github.com/seu-usuario/SAI_API.git
cd SAI_API

# Criar estrutura de workflows
mkdir -p .github/workflows
```

## 📝 Passo 2: Criar Arquivo CI (Testes)

Crie `.github/workflows/ci.yml`:

```yaml
name: CI - Build e Testes

on:
  push:
    branches: [ main, develop ]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: sai_agendamento
        options: --health-cmd pg_isready --health-interval 10s
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        cache: maven
    - run: ./mvnw clean package -DskipTests
      working-directory: backend
    - run: ./mvnw test
      working-directory: backend
      env:
        SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/sai_agendamento
        SPRING_DATASOURCE_USERNAME: postgres
        SPRING_DATASOURCE_PASSWORD: postgres
        JWT_SECRET: test-key

  frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: front/package-lock.json
    - run: npm ci && npm run build
      working-directory: front
```

## 🚀 Passo 3: Configurar Secrets

No GitHub, vá para **Settings → Secrets → New repository secret**:

```
JWT_SECRET=sua_chave_super_secreta
DOCKER_USERNAME=seu_usuario_docker
DOCKER_PASSWORD=seu_token_docker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_db
```

## 🐳 Passo 4: Deploy com Docker (Render)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy Render

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: |
        curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_BACKEND_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"
        curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_FRONTEND_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"
```

## ✅ Passo 5: Commitar e Fazer Push

```bash
git add .github/
git commit -m "ci: adiciona workflows GitHub Actions"
git push origin main
```

## 🔍 Passo 6: Verificar Status

- Acesse seu repositório no GitHub
- Clique em **Actions**
- Veja seu workflow executando!

---

## 📱 Plataformas de Deploy Recomendadas

| Plataforma | Custo | Dificuldade | Ideal Para |
|-----------|-------|-----------|-----------|
| **Render** | Gratuito | Fácil | Novo projeto |
| **Railway** | $5/mês | Fácil | Pequenos apps |
| **Heroku** | ~$7/mês | Fácil | MVP |
| **AWS EC2** | ~$10/mês | Médio | Produção |
| **Azure** | Variável | Difícil | Empresa |
| **DigitalOcean** | $6/mês | Médio | Startups |

---

## 📚 Referências

- [CI-CD-PIPELINE.md](CI-CD-PIPELINE.md) ← Leia para guia completo!
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Render Deploy](https://render.com/docs)
- [AWS EC2](https://docs.aws.amazon.com/ec2/)

---

**💡 Dica:** Comece com Render (gratuito) para testar antes de escolher produção!

