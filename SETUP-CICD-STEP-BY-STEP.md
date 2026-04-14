# 🎯 Passo a Passo: Implementar CI/CD (Completo)

## 📋 O que você vai aprender:

✅ Como configurar GitHub Actions  
✅ Como fazer testes automáticos  
✅ Como fazer deploy automático  
✅ Como monitorar pipelines  

---

## PARTE 1: Configuração Inicial

### 1.1 Criar arquivo `.gitignore`

```
# Java
target/
*.class
*.jar
*.war

# Node
node_modules/
dist/
.env.local

# IDE
.idea/
.vscode/

# BD
postgres_data/

# Env
.env
```

### 1.2 Fazer push inicial

```bash
git add .
git commit -m "chore: adiciona gitignore"
git push origin main
```

---

## PARTE 2: GitHub Actions - CI (Testes)

### 2.1 Criar estrutura de pastas

```bash
mkdir -p .github/workflows
cd .github/workflows
```

### 2.2 Criar arquivo `ci.yml`

Crie `.github/workflows/ci.yml`:

```yaml
name: 🔄 CI - Build e Testes

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  backend:
    name: 📦 Backend
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres123
          POSTGRES_DB: sai_agendamento
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      
      - name: Build with Maven
        working-directory: backend
        run: ./mvnw clean package -DskipTests
      
      - name: Run tests
        working-directory: backend
        run: ./mvnw test
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/sai_agendamento
          SPRING_DATASOURCE_USERNAME: postgres
          SPRING_DATASOURCE_PASSWORD: postgres123
          JWT_SECRET: test-secret-key-for-ci-pipeline
      
      - name: Upload JAR
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: backend-jar
          path: backend/target/sai-*.jar
          retention-days: 5

  frontend:
    name: ⚛️ Frontend
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: front/package-lock.json
      
      - name: Install dependencies
        working-directory: front
        run: npm ci
      
      - name: Run linter
        working-directory: front
        run: npm run lint
        continue-on-error: true
      
      - name: Build
        working-directory: front
        run: npm run build
      
      - name: Upload build
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: front/dist
          retention-days: 5
```

### 2.3 Fazer commit

```bash
git add .github/workflows/ci.yml
git commit -m "ci: adiciona workflow de CI"
git push origin main
```

### 2.4 Verificar execução

1. Vá para seu repositório no GitHub
2. Clique em **Actions**
3. Você verá o workflow executando

---

## PARTE 3: Configurar Secrets

### 3.1 Adicionar secrets

No GitHub, acesse: **Settings → Secrets and variables → Actions**

Clique em **New repository secret** e adicione:

**Secrets obrigatórios:**
- `JWT_SECRET` = uma_chave_muito_longa_e_complexa_aqui
- `POSTGRES_USER` = postgres
- `POSTGRES_PASSWORD` = sua_senha_super_secreta

**Para Docker Hub (opcional):**
- `DOCKER_USERNAME` = seu_usuario_docker
- `DOCKER_PASSWORD` = seu_token_docker

**Para Render (optional):**
- `RENDER_DEPLOY_KEY` = seu_deploy_key
- `RENDER_BACKEND_SERVICE_ID` = srv-xxxxx
- `RENDER_FRONTEND_SERVICE_ID` = srv-xxxxx

**Para AWS (optional):**
- `AWS_EC2_HOST` = seu-ip-ou-dominio
- `AWS_EC2_USER` = ubuntu
- `AWS_EC2_PRIVATE_KEY` = conteúdo da chave .pem

---

## PARTE 4: GitHub Actions - CD (Deploy)

### 4.1 Opção A: Deploy com Render (Recomendado)

Crie `.github/workflows/deploy-render.yml`:

```yaml
name: 🚀 Deploy para Render

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    name: 🚀 Deploy
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Backend
        run: |
          echo "🚀 Iniciando deploy do backend..."
          curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_BACKEND_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"
          echo "✅ Backend em deploy"
      
      - name: Wait and Deploy Frontend
        run: |
          sleep 30
          echo "🚀 Iniciando deploy do frontend..."
          curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_FRONTEND_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"
          echo "✅ Frontend em deploy"
```

### 4.2 Opção B: Deploy em AWS EC2

Crie `.github/workflows/deploy-aws.yml`:

```yaml
name: 🚀 Deploy para AWS EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    name: 🚀 Deploy AWS
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.AWS_EC2_HOST }}
          username: ${{ secrets.AWS_EC2_USER }}
          key: ${{ secrets.AWS_EC2_PRIVATE_KEY }}
          script: |
            cd ~/SAI_API
            git pull origin main
            
            # Criar arquivo .env
            cat > .env << EOF
            JWT_SECRET=${{ secrets.JWT_SECRET }}
            POSTGRES_USER=${{ secrets.POSTGRES_USER }}
            POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
            POSTGRES_DB_NAME=sai_agendamento
            POSTGRES_PORT=5432
            EOF
            
            # Deploy com Docker Compose
            docker-compose down || true
            docker-compose up -d --build
            
            echo "✅ Deploy concluído!"
```

### 4.3 Fazer commit

```bash
git add .github/workflows/deploy-*.yml
git commit -m "ci: adiciona workflows de deploy"
git push origin main
```

---

## PARTE 5: Testar Tudo Funcionando

### 5.1 Fazer uma mudança pequena

```bash
# Criar branch
git checkout -b test/ci-workflow

# Fazer mudança pequena em um arquivo
echo "# Teste CI/CD" >> README.md

# Fazer commit
git add README.md
git commit -m "test: verifica workflow CI/CD"

# Push
git push origin test/ci-workflow
```

### 5.2 Criar Pull Request

1. Vá ao repositório no GitHub
2. Clique em **Compare & pull request**
3. Verifique os testes rodando em **Actions**
4. Quando aprovado, faça merge

### 5.3 Monitorar Deploy

1. Acesse **Actions** no GitHub
2. Veja os workflows de CI rodando
3. Após CI passar, veja o de Deploy
4. Verifique na plataforma (Render/AWS) se tudo okay

---

## PARTE 6: Configurar Render (Se escolher)

### 6.1 Criar Conta

1. Acesse [render.com](https://render.com)
2. Clique em **Sign up with GitHub**
3. Autorize acesso ao seu repositório

### 6.2 Criar Banco de Dados

1. Dashboard → **New +** → **PostgreSQL**
2. Preencha:
   - Name: `sai-postgres`
   - Region: `Ohio` (mais barato)
3. Copie a URL de conexão

### 6.3 Criar Serviço Backend

1. Dashboard → **New +** → **Web Service**
2. Selecione seu repositório
3. Configure:
   ```
   Name: sai-api-backend
   Environment: Docker
   Region: Ohio
   Build Command: ./mvnw clean package -DskipTests
   Start Command: java -jar target/sai-*.jar
   ```
4. **Advanced** → Adicione variáveis:
   ```
   SPRING_DATASOURCE_URL=postgresql://...
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=...
   JWT_SECRET=...
   ```

### 6.4 Criar Serviço Frontend

1. Dashboard → **New +** → **Static Site**
2. Selecione seu repositório
3. Configure:
   ```
   Name: sai-api-frontend
   Build Command: npm install && npm run build
   Publish directory: dist
   ```

### 6.5 Conectar Backend e Frontend

No Frontend, adicione variável:
```
VITE_API_BASE_URL=https://sai-api-backend.onrender.com/api/v1
```

---

## PARTE 7: Monitoramento

### 7.1 Ver Logs de CI

GitHub → **Actions** → Clique no workflow

### 7.2 Ver Logs de Deploy

**Render:** Dashboard → Seu serviço → **Logs**

**AWS:** `aws logs tail /aws/ec2/sai --follow`

### 7.3 Verificar Saúde da Aplicação

```bash
# Health check backend
curl https://sai-api-backend.onrender.com/actuator/health

# Health check frontend
curl https://sai-api-frontend.onrender.com
```

---

## PARTE 8: Troubleshooting

### ❌ Maven build falha

```bash
# Solução local:
cd backend
./mvnw clean install -U
```

### ❌ Node install falha

```bash
# Solução local:
cd front
rm -rf node_modules package-lock.json
npm install
```

### ❌ Database connection error

- Verifique URL do banco
- Verifique credenciais
- Verifique firewall/security groups

### ❌ Secrets não carregam

- Verifique nome exato do secret
- Redeploy o serviço
- Limpe cache do navegador

---

## ✅ Checklist Final

- [ ] `.github/workflows/ci.yml` criado
- [ ] Secrets configurados no GitHub
- [ ] `.github/workflows/deploy-*.yml` criado
- [ ] Render conta criada (opcional)
- [ ] Banco de dados configurado
- [ ] Primeiro deploy executado com sucesso
- [ ] Logs verificados
- [ ] Aplicação respondendo corretamente

---

## 🎉 Pronto!

Seu CI/CD está funcionando! Agora:

1. Trabalhe em branches separadas
2. Faça commits e push
3. Crie Pull Requests
4. Veja testes rodarem automaticamente
5. Quando aprovado, deploy acontece automaticamente!

---

**Leia mais em:** [CI-CD-PIPELINE.md](CI-CD-PIPELINE.md)

