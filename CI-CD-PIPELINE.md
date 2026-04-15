# 🔄 Guia Completo: Montando uma Pipeline CI/CD para SAI API

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [GitHub Actions - Integração Contínua (CI)](#github-actions---integração-contínua-ci)
4. [GitHub Actions - Deploy Automático (CD)](#github-actions---deploy-automático-cd)
5. [Variáveis de Ambiente e Secrets](#variáveis-de-ambiente-e-secrets)
6. [Deployment em Diferentes Plataformas](#deployment-em-diferentes-plataformas)
7. [Monitoramento e Logs](#monitoramento-e-logs)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Uma pipeline **CI/CD** automatiza os processos de:
- **CI (Continuous Integration)**: Testes e validações automáticas a cada código enviado
- **CD (Continuous Deployment)**: Deploy automático para produção

Para o projeto **SAI API**, que possui:
- ✅ Backend Java/Spring Boot 3.x
- ✅ Frontend React/TypeScript
- ✅ PostgreSQL em container
- ✅ Docker Compose

Recomendamos usar **GitHub Actions** (gratuito, integrado) ou **GitLab CI/CD** (se usar GitLab).

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

### 1. **Repositório no GitHub**
```bash
git init
git remote add origin https://github.com/seu-usuario/SAI_API.git
git branch -M main
git push -u origin main
```

### 2. **Arquivo `.gitignore` configurado**
```
# Java
target/
*.class
.classpath
.project
*.jar
*.war

# Node
node_modules/
dist/
build/
.env.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# Banco de Dados
postgres_data/

# Variáveis de Ambiente
.env
.env.local
```

### 3. **Arquivo `.env` (LOCAL apenas, não commitar)**
```env
JWT_SECRET=sua_chave_secreta_muito_longa_e_complexa
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_segura
POSTGRES_DB_NAME=sai_agendamento
POSTGRES_PORT=5432
```

---

## GitHub Actions - Integração Contínua (CI)

### O que será feito:
✅ Build do backend (Maven)  
✅ Testes automáticos (JUnit)  
✅ Build do frontend (Vite)  
✅ Linting do código  
✅ Verificação de segurança  

### 1. Criar arquivo de workflow CI

Crie o arquivo: `.github/workflows/ci.yml`

```yaml
name: 🔄 Integração Contínua (CI)

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-ci:
    name: Backend - Build & Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: sai_agendamento
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4

    - name: 🔧 Setup Java
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        cache: maven

    - name: 🏗️ Build Backend com Maven
      working-directory: backend
      run: ./mvnw clean package -DskipTests

    - name: 🧪 Executar Testes Unitários
      working-directory: backend
      run: ./mvnw test
      env:
        SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/sai_agendamento
        SPRING_DATASOURCE_USERNAME: postgres
        SPRING_DATASOURCE_PASSWORD: postgres
        JWT_SECRET: test_secret_key_for_ci

    - name: 📊 Gerar Relatório de Cobertura
      working-directory: backend
      run: ./mvnw jacoco:report
      continue-on-error: true

    - name: 📤 Upload Artefato JAR
      uses: actions/upload-artifact@v4
      with:
        name: backend-jar
        path: backend/target/sai-*.jar

  frontend-ci:
    name: Frontend - Build & Lint
    runs-on: ubuntu-latest

    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4

    - name: 🔧 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: front/package-lock.json

    - name: 📦 Instalar dependências
      working-directory: front
      run: npm ci

    - name: 🧹 Executar Lint
      working-directory: front
      run: npm run lint
      continue-on-error: true

    - name: 🏗️ Build Frontend
      working-directory: front
      run: npm run build
      env:
        VITE_API_BASE_URL: http://localhost:8080/api/v1

    - name: 📤 Upload Artefato Build
      uses: actions/upload-artifact@v4
      with:
        name: frontend-dist
        path: front/dist

  security-scan:
    name: 🔒 Verificação de Segurança
    runs-on: ubuntu-latest

    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4

    - name: 🔍 Dependabot/OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        path: '.'
        format: 'JSON'
        args: >-
          --enable-retired
      continue-on-error: true
```

### 2. Commitar o arquivo de workflow

```bash
git add .github/workflows/ci.yml
git commit -m "chore: adiciona workflow de CI com GitHub Actions"
git push origin main
```

---

## GitHub Actions - Deploy Automático (CD)

### O que será feito:
✅ Build de imagens Docker  
✅ Push para Docker Registry  
✅ Deploy em produção (Render, AWS, Azure)  
✅ Notificações de sucesso/falha  

### 1. Escolher Plataforma de Deploy

**Opções recomendadas:**
- **Render** (gratuito, fácil) ⭐ Recomendado para este projeto
- **AWS EC2/App Runner** (mais escalável)
- **Azure App Service** (integração Microsoft)
- **DigitalOcean App Platform** (bom custo-benefício)

### 2. Configurar Docker Registry (Docker Hub)

1. Crie conta em [Docker Hub](https://hub.docker.com)
2. Crie um repositório: `seu-usuario/sai-api-backend` e `seu-usuario/sai-api-frontend`
3. Gere um **Personal Access Token** em Settings → Security

### 3. Arquivo de Deploy para Render

Crie: `.github/workflows/deploy-render.yml`

```yaml
name: 🚀 Deploy para Render

on:
  push:
    branches: [ main ]
  workflow_run:
    workflows: ["🔄 Integração Contínua (CI)"]
    types:
      - completed

jobs:
  deploy:
    name: Deploy Backend & Frontend
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event.workflow_run.conclusion == 'success'

    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4

    - name: 🔧 Setup Ruby (para deploy script)
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.2'

    - name: 📨 Trigger Deploy Backend no Render
      run: |
        curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_BACKEND_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"
      env:
        RENDER_DEPLOY_KEY: ${{ secrets.RENDER_DEPLOY_KEY }}
      continue-on-error: true

    - name: 📨 Trigger Deploy Frontend no Render
      run: |
        curl -X POST "https://api.render.com/deploy/srv-${{ secrets.RENDER_FRONTEND_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_KEY }}"
      env:
        RENDER_DEPLOY_KEY: ${{ secrets.RENDER_DEPLOY_KEY }}
      continue-on-error: true

    - name: 📧 Notificar sucesso (Opcional)
      if: success()
      run: echo "✅ Deploy realizado com sucesso!"

    - name: 📧 Notificar erro
      if: failure()
      run: echo "❌ Deploy falhou. Verifique os logs."
```

### 4. Arquivo de Deploy para AWS EC2

Crie: `.github/workflows/deploy-aws.yml`

```yaml
name: 🚀 Deploy para AWS EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    name: Deploy em AWS EC2
    runs-on: ubuntu-latest

    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4

    - name: 🔧 Deploy via SSH
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.AWS_EC2_HOST }}
        username: ${{ secrets.AWS_EC2_USER }}
        key: ${{ secrets.AWS_EC2_PRIVATE_KEY }}
        script: |
          cd /home/ubuntu/SAI_API
          git pull origin main
          
          # Build e start com Docker Compose
          docker-compose down
          docker-compose up -d --build
          
          echo "✅ Deploy concluído!"
```

---

## Variáveis de Ambiente e Secrets

### 1. Configurar Secrets no GitHub

Acesse: **Settings → Secrets and variables → Actions → New repository secret**

Adicione os seguintes secrets:

```
DOCKER_USERNAME=seu_usuario_docker_hub
DOCKER_PASSWORD=seu_token_docker_hub
JWT_SECRET=sua_chave_super_secreta_aqui
POSTGRES_PASSWORD=sua_senha_postgres_segura
RENDER_DEPLOY_KEY=sua_chave_render
RENDER_BACKEND_SERVICE_ID=srv-xxxxx
RENDER_FRONTEND_SERVICE_ID=srv-xxxxx
AWS_EC2_HOST=seu_ip_ou_dominio
AWS_EC2_USER=ubuntu
AWS_EC2_PRIVATE_KEY=sua_chave_privada_pem
```

### 2. Usar Secrets no Workflow

No arquivo YAML do workflow:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
```

---

## Deployment em Diferentes Plataformas

### 📍 Opção 1: Render (Recomendado)

#### Passo 1: Criar Conta
1. Acesse [render.com](https://render.com)
2. Crie uma conta com GitHub
3. Conecte seu repositório

#### Passo 2: Criar Serviço Backend
1. Dashboard → Create New → Web Service
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `sai-api-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/sai-*.jar`
   - **Environment Variables**:
     ```
     SPRING_DATASOURCE_URL=postgresql://...
     SPRING_DATASOURCE_USERNAME=...
     JWT_SECRET=...
     ```

#### Passo 3: Criar Banco de Dados PostgreSQL
1. Dashboard → Create New → PostgreSQL
2. Configure e aguarde a criação
3. Copie a URL de conexão
4. Adicione a URL no serviço Backend

#### Passo 4: Criar Serviço Frontend
1. Dashboard → Create New → Static Site
2. Conecte seu repositório
3. Configure:
   - **Name**: `sai-api-frontend`
   - **Root Directory**: `front`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

#### Passo 5: Conectar Backend e Frontend
No serviço Frontend, adicione variável de ambiente:
```
VITE_API_BASE_URL=https://seu-backend.render.com/api/v1
```

### 📍 Opção 2: AWS EC2

#### Passo 1: Criar Instância EC2
1. Console AWS → EC2 → Instâncias
2. Crie instância `t3.medium` (ou maior) com Ubuntu 24.04 LTS
3. Configure security group com portas 80, 443, 8080, 5173

#### Passo 2: Configurar Servidor
```bash
# Conectar via SSH
ssh -i sua-chave.pem ubuntu@seu-ip

# Instalar dependências
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# Adicionar ubuntu ao grupo docker
sudo usermod -aG docker ubuntu

# Clonar repositório
git clone https://github.com/seu-usuario/SAI_API.git
cd SAI_API
```

#### Passo 3: Configurar Environment
```bash
# Criar arquivo .env
cat > .env << EOF
JWT_SECRET=sua_chave_secreta
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB_NAME=sai_agendamento
EOF
```

#### Passo 4: Deploy com Docker Compose
```bash
docker-compose up -d

# Verificar status
docker-compose ps
```

### 📍 Opção 3: Azure App Service

#### Passo 1: Criar Resource Group
```bash
az group create --name sai-rg --location eastus
```

#### Passo 2: Criar App Service Plans
```bash
# Backend
az appservice plan create --name sai-backend-plan --resource-group sai-rg --sku B2 --is-linux

# Frontend
az appservice plan create --name sai-frontend-plan --resource-group sai-rg --sku B1 --is-linux
```

#### Passo 3: Criar App Services
```bash
# Backend
az webapp create --resource-group sai-rg --plan sai-backend-plan --name sai-api-backend --runtime "JAVA|21"

# Frontend
az webapp create --resource-group sai-rg --plan sai-frontend-plan --name sai-api-frontend --runtime "NODE|20-lts"
```

#### Passo 4: Configurar Variáveis de Ambiente
```bash
az webapp config appsettings set --resource-group sai-rg --name sai-api-backend \
  --settings JWT_SECRET="sua_chave" \
  SPRING_DATASOURCE_URL="jdbc:postgresql://..." \
  POSTGRES_PASSWORD="..."
```

---

## Monitoramento e Logs

### 1. GitHub Actions - Visualizar Logs
1. Acesse seu repositório
2. Clique em **Actions**
3. Selecione um workflow
4. Clique em um job para ver detalhes

### 2. Render - Logs em Tempo Real
```bash
# Dashboard Render → Seu serviço → Logs
# Ou via CLI:
render logs --service=sai-api-backend
```

### 3. AWS CloudWatch
```bash
# Ver logs de um serviço
aws logs tail /aws/ec2/sai-api-backend --follow
```

### 4. Adicionar Monitoramento com APM

#### Alternativa 1: Spring Boot Actuator (já incluído)
```
http://localhost:8080/actuator/health
http://localhost:8080/actuator/metrics
```

#### Alternativa 2: Datadog
1. Crie conta em [datadog.com](https://www.datadog.com)
2. Adicione dependência Maven:
```xml
<dependency>
    <groupId>com.datadoghq</groupId>
    <artifactId>dd-java-agent</artifactId>
    <version>1.x.x</version>
</dependency>
```

#### Alternativa 3: New Relic
```bash
# Adicionar ao comando de inicialização:
java -javaagent:/path/to/newrelic.jar -jar app.jar
```

---

## Troubleshooting

### ❌ Problema: Build falha com erro de dependências
**Solução:**
```bash
# Limpar cache Maven
cd backend
./mvnw clean install -U

# Ou forçar download
./mvnw dependency:resolve-plugins
```

### ❌ Problema: Testes falham no CI
**Solução:**
1. Verifique se o PostgreSQL está configurado corretamente no workflow
2. Adicione variáveis de ambiente necessárias
3. Use `@Profile("test")` para testes específicos

### ❌ Problema: Docker build muito lento
**Solução:**
1. Use `docker buildx bake` para builds paralelos
2. Configure cache de camadas Docker
3. Use multi-stage Dockerfile

Exemplo `Dockerfile` otimizado para backend:
```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 as builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/sai-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ❌ Problema: Deploy falha por variáveis faltando
**Solução:**
1. Verifique se todos os secrets estão configurados
2. Use `${{ secrets.NOME }}` com grafia exata
3. Teste localmente com `.env`

### ❌ Problema: Frontend não conecta ao Backend em produção
**Solução:**
1. Verifique URL da API em `src/services/api.ts`
2. Configure CORS no Backend:
```java
@Configuration
@EnableWebMvc
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://seu-frontend.render.com")
            .allowedMethods("*")
            .allowCredentials(true);
    }
}
```

---

## Checklist Pré-Deploy

Antes de fazer deploy em produção:

- [ ] Código testado localmente
- [ ] Testes unitários passando (`mvnw test`)
- [ ] Linting aprovado (`npm run lint`)
- [ ] `.env` com valores de produção
- [ ] JWT_SECRET alterado
- [ ] Banco de dados configurado
- [ ] Variáveis de ambiente no secrets
- [ ] URLs de API corretas
- [ ] CORS configurado
- [ ] Firewall/Security Groups corretos
- [ ] SSL/HTTPS habilitado
- [ ] Backups configurados

---

## Arquivos de Exemplo Prontos para Usar

### 📄 `.github/workflows/ci.yml`
→ [Veja seção GitHub Actions - Integração Contínua](#github-actions---integração-contínua-ci)

### 📄 `.github/workflows/deploy-render.yml`
→ [Veja seção GitHub Actions - Deploy Automático](#github-actions---deploy-automático-cd)

### 📄 `docker-compose.yml` (produção)
```yaml
version: '3.8'

services:
  postgres-db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend-api:
    image: ${DOCKER_REGISTRY}/sai-api-backend:latest
    restart: always
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-db:5432/${POSTGRES_DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres-db

  frontend-app:
    image: ${DOCKER_REGISTRY}/sai-api-frontend:latest
    restart: always
    environment:
      VITE_API_BASE_URL: http://backend-api:8080/api/v1
    ports:
      - "80:80"
    depends_on:
      - backend-api

volumes:
  postgres_data:
```

---

## Próximas Etapas

1. ✅ Crie os workflows CI/CD
2. ✅ Configure secrets no GitHub
3. ✅ Escolha e configure plataforma de deploy
4. ✅ Teste o deployment
5. ✅ Configure monitoramento
6. ✅ Implemente backups automáticos
7. ✅ Configure alertas

---

## Referências Úteis

- 📖 [GitHub Actions Documentation](https://docs.github.com/en/actions)
- 📖 [Render Deployment Guide](https://render.com/docs)
- 📖 [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- 📖 [Spring Boot Deployment](https://spring.io/guides/gs/spring-boot/)

---

**💡 Dica:** Use branches como `develop` para testes antes de fazer merge em `main` para produção!

**📞 Precisa de ajuda?** Consulte a documentação de cada plataforma ou abra uma issue no repositório.

