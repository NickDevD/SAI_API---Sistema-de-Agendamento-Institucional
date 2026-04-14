# 🚀 Guia Completo: Deploy SAI no RENDER

> Sistema de Agendamento Institucional - Deployment Render

## 📋 Sumário
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Projeto](#arquitetura-do-projeto)
3. [Pré-requisitos](#pré-requisitos)
4. [Passo a Passo para Deploy](#passo-a-passo-para-deploy)
5. [Configuração Avançada](#configuração-avançada)
6. [Monitoramento e Logs](#monitoramento-e-logs)
7. [Troubleshooting](#troubleshooting)

---

## 👀 Visão Geral

O **SAI** é uma aplicação full-stack com:
- **Backend**: Spring Boot 3.5.8 com Java 21
- **Frontend**: React 18 com TypeScript e Vite
- **Database**: PostgreSQL 16
- **Autenticação**: JWT (JSON Web Tokens)

O Render oferece uma forma simples e gratuita (com plano pago) de fazer deploy dessa arquitetura completa.

---

## 🏗️ Arquitetura do Projeto

```
SAI_API/
├── backend/                    # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/devtec/sai/
│   │   │   │       ├── controller/      # REST Endpoints
│   │   │   │       ├── service/         # Lógica de negócios
│   │   │   │       ├── repository/      # Camada de dados (JPA)
│   │   │   │       ├── model/           # Entidades @Entity
│   │   │   │       ├── dto/             # Data Transfer Objects
│   │   │   │       ├── config/          # Spring Security, Swagger
│   │   │   │       ├── exception/       # Exceções customizadas
│   │   │   │       └── util/            # Utilitários e helpers
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── application-dev.properties
│   │   │       └── db/migration/        # Flyway SQL migrations
│   │   └── test/
│   ├── pom.xml                 # Dependências Maven
│   ├── mvnw / mvnw.cmd        # Maven Wrapper
│   └── Dockerfile              # Build container para Backend
│
├── front/                      # React + TypeScript
│   ├── src/
│   │   ├── pages/              # LoginPage, AgendamentoPage
│   │   ├── services/           # api.ts (chamadas HTTP)
│   │   ├── theme/              # Estilos Material UI
│   │   └── assets/             # Imagens e recursos
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile              # Build container para Frontend
│
├── docker-compose.yml          # Local development
├── relatorios/                 # Pasta para relatórios gerados
└── README.md                   # Documentação principal
```

### **Dependências Principais**

**Backend (pom.xml):**
- Spring Boot 3.5.8
- Spring Security + JWT (com auth0/java-jwt)
- Spring Data JPA + Hibernate
- PostgreSQL Driver
- Flyway (migrações de banco)
- Swagger/Springdoc OpenAPI
- iText PDF (geração de relatórios)

**Frontend (package.json):**
- React 18.2 + React Router
- TypeScript 5.9
- Material UI 5.18
- Axios (HTTP Client)
- Vite (build tool)
- date-fns (manipulação de datas)

---

## ✅ Pré-requisitos

Antes de começar, você precisa ter:

### **1. Conta no GitHub**
- Repositório com o código (público ou privado)
- Token de acesso pessoal (PAT) para CI/CD

### **2. Conta no Render**
- Criar em: https://render.com
- Conectar sua conta GitHub

### **3. Ferramentas Locais** (opcional, para testar antes)
- Git
- Java 21 JDK
- Node.js 18+ LTS
- Docker (opcional)

### **4. Variáveis de Ambiente Necessárias**
Você precisará configurar:
```
JWT_SECRET              # Chave secreta para tokens JWT
POSTGRES_USER           # Usuário do banco de dados
POSTGRES_PASSWORD       # Senha do PostgreSQL
POSTGRES_DB_NAME        # Nome do banco (ex: sai_agendamento)
VITE_API_URL           # URL da API (para o frontend)
```

---

## 🚀 Passo a Passo para Deploy

### **FASE 1: Preparar o Repositório GitHub**

#### 1.1 Clone ou crie o repositório
```bash
# Se ainda não tem, crie um novo repositório
git init
git add .
git commit -m "Initial commit: SAI project"
git branch -M main
git remote add origin https://github.com/seu-usuario/SAI_API.git
git push -u origin main
```

#### 1.2 Criar arquivo `.env` (LOCAL APENAS - não fazer push!)
```env
# Adicione ao .gitignore
JWT_SECRET=sua_chave_super_secreta_muito_longa_42caracteres_minimo
POSTGRES_USER=saiuser
POSTGRES_PASSWORD=senha_super_secreta_123
POSTGRES_DB_NAME=sai_agendamento
VITE_API_URL=http://localhost:8080/api/v1
```

#### 1.3 Atualizar `.gitignore`
Certifique-se de que o arquivo `.gitignore` na raiz contém:
```
.env
.env.local
node_modules/
target/
.DS_Store
*.log
```

---

### **FASE 2: Configurar o Render**

#### 2.1 Criar Database (PostgreSQL) no Render

1. Faça login em https://render.com
2. No dashboard, clique em **"New +"** → **"PostgreSQL"**
3. Preencha os dados:
   - **Name**: `sai-postgres` (ou seu nome)
   - **Database**: `sai_agendamento`
   - **User**: `saiuser`
   - **Region**: Escolha a mais próxima de seus usuários (ex: `São Paulo`)
   - **PostgreSQL Version**: 16
4. Clique em **"Create Database"**
5. ⏳ Aguarde (~3-5 minutos) até que o banco esteja pronto
6. **Copie a Internal Database URL** (vai parecer com: `postgresql://saiuser:senha@host:5432/sai_agendamento`)

#### 2.2 Configurar Variáveis de Ambiente no Render

No dashboard do Render:
1. Vá para **"Environment"** na página do banco de dados
2. As variáveis já estarão definidas automaticamente. Você verá:
   ```
   DATABASE_URL=postgresql://saiuser:....
   ```

---

### **FASE 3: Deploy do Backend**

#### 3.1 Criar Web Service para Backend

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub:
   - Clique em **"Connect account"** se necessário
   - Selecione o repositório `SAI_API`
3. Preencha os dados:
   - **Name**: `sai-backend` (ou seu nome)
   - **Environment**: `Docker`
   - **Region**: Mesma região do banco de dados
   - **Build Command**: Deixe em branco (usa Dockerfile)
   - **Start Command**: Deixe em branco (usa Dockerfile)

#### 3.2 Configurar Variáveis de Ambiente (Backend)

Na página de configuração do Web Service, vá para **"Environment"** e adicione:

```
# Database Connection
DATABASE_URL=postgresql://saiuser:your_password@internal_db_host:5432/sai_agendamento
SPRING_DATASOURCE_URL=postgresql://saiuser:your_password@internal_db_host:5432/sai_agendamento
SPRING_DATASOURCE_USERNAME=saiuser
SPRING_DATASOURCE_PASSWORD=your_password

# JWT Secret
JWT_SECRET=sua_chave_super_secreta_minimo_32_caracteres

# Port (Render define automaticamente)
PORT=8080

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
```

> ⚠️ **IMPORTANTE**: Na variável `DATABASE_URL`, use o hostname **interno** do Render, não o externo!

#### 3.3 Configurar Dockerfile (Backend)

O arquivo `backend/Dockerfile` já está otimizado:

```dockerfile
# ===== BUILD STAGE =====
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package -DskipTests


# ===== RUNTIME STAGE =====
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN useradd -m appuser
RUN mkdir -p /app/relatorios && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

Este Dockerfile:
- ✅ Usa build multi-stage (reduz tamanho da imagem)
- ✅ Cria usuário não-root (segurança)
- ✅ Define permissões corretas
- ✅ Expõe porta 8080

#### 3.4 Atualizar `application.properties`

Edite `backend/src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=${SPRING_DATASOURCE_URL:${DATABASE_URL}}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

# Hibernate + Flyway
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# JWT Secret
api.security.token.secret=${JWT_SECRET}

# Server Port
server.port=${PORT:8080}

# Environment
spring.profiles.active=prod

# Logging
logging.level.root=INFO
logging.level.com.devtec.sai=DEBUG
```

#### 3.5 Deploy Backend

No Render:
1. Clique em **"Deploy"** (ou aguarde auto-deploy se GitHub Actions estiver configurado)
2. Monitore o progresso na aba **"Logs"**
3. Quando status for **"Live"**, seu backend está rodando!
4. Copie a URL (ex: `https://sai-backend.onrender.com`)

---

### **FASE 4: Deploy do Frontend**

#### 4.1 Criar Web Service para Frontend

1. Clique em **"New +"** → **"Web Service"**
2. Conecte o mesmo repositório GitHub
3. Preencha os dados:
   - **Name**: `sai-frontend` (ou seu nome)
   - **Root Directory**: `front` (importante!)
   - **Environment**: `Docker`
   - **Region**: Mesma região do backend

#### 4.2 Configurar Variáveis de Ambiente (Frontend)

Na página de configuração, vá para **"Environment"** e adicione:

```
VITE_API_URL=https://sai-backend.onrender.com/api/v1
```

> ⚠️ **IMPORTANTE**: Use a URL completa do seu backend no Render

#### 4.3 Modificar `front/Dockerfile` (Build Otimizado)

O dockerfile atual roda desenvolvimento. Para produção, crie uma versão otimizada:

```dockerfile
# ===== BUILD STAGE =====
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build


# ===== RUNTIME STAGE (Nginx) =====
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/v1/ { \
        proxy_pass $VITE_API_URL; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

> Ou simplesmente use o Dockerfile atual, mas o frontend será servido em desenvolvimento. Render detectará automaticamente que é um aplicativo Node.

#### 4.4 Deploy Frontend

No Render:
1. Clique em **"Deploy"**
2. Monitore os logs
3. Quando status for **"Live"**, seu frontend está rodando!
4. Copie a URL (ex: `https://sai-frontend.onrender.com`)

---

## ⚙️ Configuração Avançada

### **CORS Configuration** (Importante!)

Se o frontend tiver problemas ao chamar o backend, edite `backend/src/main/java/com/devtec/sai/config/SecurityConfigurations.java`:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(Arrays.asList(
                    "https://sai-frontend.onrender.com",  // Frontend Render
                    "http://localhost:5173"               // Local development
                ));
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(Arrays.asList("*"));
                config.setAllowCredentials(true);
                return config;
            }))
            // ... resto da configuração
        return http.build();
    }
}
```

### **Flyway Migrations**

O projeto usa Flyway para versionamento de banco de dados. Os scripts estão em:
```
backend/src/main/resources/db/migration/
├── V1__criar_tabela_agendamentos.sql
├── V2__criar_tabela_usuarios.sql
└── V3__insert_admin_user.sql
```

Esses scripts rodam **automaticamente** na primeira conexão ao banco de dados.

### **Variáveis de Ambiente Dinâmicas**

Se precisar de diferentes configs por ambiente, crie:

```
backend/src/main/resources/
├── application.properties      # Produção (Render)
├── application-dev.properties  # Local
└── application-prod.properties # Explícito Render
```

---

## 📊 Monitoramento e Logs

### **Acessar Logs no Render**

1. No dashboard, selecione o serviço (Backend ou Frontend)
2. Clique em **"Logs"** no menu superior
3. Você verá logs em tempo real

### **Logs Principais do Backend**

```
INFO [com.devtec.sai.SaiApplication] Started SaiApplication in X seconds
INFO [org.flywaydb.core.Flyway] Executing migration: V1__criar_tabela_agendamentos
INFO [org.springframework.security.web.DefaultSecurityFilterChain] Security Filter Chain
```

### **Acessar Endpoints de Monitoramento**

- **Backend**: `https://sai-backend.onrender.com/actuator/health`
- **Swagger UI**: `https://sai-backend.onrender.com/swagger-ui.html`

---

## 🔒 Segurança

### **Boas Práticas**

1. ✅ **Sempre use HTTPS** (Render fornece certificado SSL grátis)
2. ✅ **JWT_SECRET deve ter mínimo 32 caracteres**
3. ✅ **Nunca commite `.env` no Git**
4. ✅ **Configure CORS corretamente**
5. ✅ **Use variáveis de ambiente para secrets**

### **Rotação de Secrets**

Se precisar trocar o `JWT_SECRET`:

1. No Render, edite a variável
2. Clique em **"Deploy"** para redeploy
3. Tokens antigos se tornarão inválidos

---

## 🐛 Troubleshooting

### **Problema: "Connection refused" ao conectar banco de dados**

**Causa**: URL do banco incorreta ou banco não iniciado

**Solução**:
1. Verifique se o banco PostgreSQL está **"Live"** no Render
2. Use a **Internal Database URL** (não externa)
3. Confirme as credenciais em Environment

---

### **Problema: Frontend não consegue chamar Backend (CORS Error)**

**Causa**: URL do backend incorreta ou CORS não configurado

**Solução**:
1. Verifique `VITE_API_URL` nas Environment Variables
2. Confirme que é a URL correta do backend (ex: `https://sai-backend.onrender.com`)
3. Adicione o domínio do frontend na configuração CORS do backend

---

### **Problema: Dados não persistem após redeploy**

**Causa**: Banco de dados foi recriado ou volume perdeu dados

**Solução**:
- Render fornece suporte para backup automático (plano pago)
- Para plano gratuito, exporte dados regularmente

---

### **Problema: Backend tarda muito para iniciar (> 5 minutos)**

**Causa**: Render free tier tem recursos limitados

**Solução**:
1. Considere upgrade para plano pago
2. Otimize build do Maven (já está multi-stage)
3. Monitore logs em **"Logs"** → ver tempo de startup

---

## 📱 URLs Finais

Após deploy bem-sucedido:

| Serviço | URL | 
|---------|-----|
| Frontend | `https://sai-frontend.onrender.com` |
| Backend API | `https://sai-backend.onrender.com/api/v1` |
| Swagger API Docs | `https://sai-backend.onrender.com/swagger-ui.html` |
| Database Health | `https://sai-backend.onrender.com/actuator/health` |

---

## 🔄 Atualizar Aplicação Após Deploy

1. Faça alterações localmente
2. Commit e push para GitHub:
   ```bash
   git add .
   git commit -m "Update: descrição das mudanças"
   git push origin main
   ```
3. Render fará **redeploy automático** (se webhooks estiverem configurados)
4. Verifique status em **"Deployments"** no Render

---

## 📚 Referências Úteis

- [Documentação Render](https://render.com/docs)
- [Spring Boot em Docker](https://spring.io/guides/topicals/spring-boot-docker/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [PostgreSQL no Render](https://render.com/docs/databases)

---

## ✅ Checklist Final

- [ ] Repositório GitHub criado e código commitado
- [ ] Conta Render criada e conectada ao GitHub
- [ ] PostgreSQL Database criado no Render
- [ ] Backend Web Service criado com Environment Variables
- [ ] Frontend Web Service criado com VITE_API_URL configurado
- [ ] `.env` adicionado ao `.gitignore`
- [ ] CORS configurado no backend
- [ ] Deploy concluído e aplicação acessível
- [ ] Testes login funcionando
- [ ] Criação de agendamentos funcionando
- [ ] Logs sendo monitorados

---

**🎉 Parabéns! Sua aplicação SAI está no Render!**

Para suporte, consulte os logs e a documentação oficial do Render.


