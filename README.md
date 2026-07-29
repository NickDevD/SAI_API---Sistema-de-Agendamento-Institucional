# SAI — Sistema de Agendamento Institucional

[![CI](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/actions/workflows/ci.yml/badge.svg)](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-6DB33F?style=flat&logo=spring-boot)
![React](https://img.shields.io/badge/React-18%20%2B%20TypeScript-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=flat)

**URLs de Deploy (GCP):**
- Backend: https://backend-api-301612765087.us-central1.run.app
- Frontend: https://sai-agendamento-institucional.web.app

---

## Visão Geral

O **SAI** é um sistema de gerenciamento de atendimentos para o CRAS (Centro de Referência de Assistência Social). Permite criar agendamentos, acompanhar o fluxo de atendimento em um kanban visual (Aguardando → Em Atendimento → Concluído/Cancelado) e gerar relatórios em PDF ao fechar o expediente.

### Arquitetura

```
SAI_API/
├── backend/          # API REST — Spring Boot 4 + Java 21 + PostgreSQL
├── front/            # SPA — React 18 + TypeScript + Material UI
├── relatorios/       # PDFs gerados pelo backend (montado via volume Docker)
├── docker-compose.yml
└── .env              # Variáveis de ambiente (não commitado)
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Linguagem backend | Java 21 |
| Framework backend | Spring Boot 4 |
| Segurança | Spring Security 7 + JWT (Auth0) |
| Banco de dados | PostgreSQL 16 |
| Migrations | Flyway 10 |
| Geração de PDF | iText 7.2.5 |
| Frontend | React 18 + TypeScript + Vite 7 |
| UI | Material UI 5 |
| HTTP client | Axios |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | GCP Cloud Run (backend) + Firebase Hosting (frontend) |

---

## Pré-requisitos

- **Java 21+** e **Maven**
- **Node.js 20 LTS** e **npm**
- **Docker e Docker Compose** (recomendado) ou PostgreSQL 16 local
- **Git**

---

## Setup Local

### 1. Clone o repositório

```bash
git clone https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional.git
cd SAI_API---Sistema-de-Agendamento-Institucional
```

### 2. Configure as variáveis de ambiente

Crie o arquivo `.env` na raiz:

```env
# Banco de dados PostgreSQL
POSTGRES_DB_NAME=agendamento_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_aqui
POSTGRES_PORT=5432

# Segurança JWT (use uma string longa e aleatória)
JWT_SECRET=sua_chave_jwt_longa_e_aleatoria_aqui

# Usuário admin criado automaticamente no primeiro boot
ADMIN_LOGIN_LINE=admin
ADMIN_PASSWORD_LINE=senha_admin_aqui

# URL da API lida pelo NAVEGADOR (não pelo container)
VITE_API_URL=http://localhost:8080
```

### 3. Subir com Docker Compose (recomendado)

```bash
docker-compose up --build -d
```

Isso inicia PostgreSQL, Backend e Frontend juntos. Acesse:
- Frontend: http://localhost:5173
- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

> **Atenção:** Se precisar recriar o container do frontend após mudar variáveis de ambiente, use
> `docker-compose up -d --force-recreate frontend-app` (o `restart` simples não aplica novas env vars).

### 4. Rodar separadamente (desenvolvimento)

**Backend:**

```bash
cd backend
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```

**Frontend:**

```bash
cd front
npm install
npm run dev
```

Crie `front/.env` com:
```
VITE_API_URL=http://localhost:8080
```

---

## Variáveis de Ambiente

### Backend

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `SPRING_DATASOURCE_URL` | Sim | `jdbc:postgresql://localhost:5432/agendamento_db` | URL JDBC do banco |
| `SPRING_DATASOURCE_USERNAME` | Sim | — | Usuário do PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Sim | — | Senha do PostgreSQL |
| `JWT_SECRET` | Sim | `JWT_SECRET` (inseguro) | Chave para assinar tokens JWT |
| `ADMIN_LOGIN_LINE` | Não | *(vazio)* | Login do admin criado no boot |
| `ADMIN_PASSWORD_LINE` | Não | *(vazio)* | Senha do admin criado no boot |
| `RELATORIO_PATH` | Não | `/app/relatorios` | Diretório para salvar PDFs |
| `PORT` | Não | `8080` | Porta do servidor |

### Frontend

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API acessível pelo navegador (ex: `http://localhost:8080`) |

> **Importante:** `VITE_API_URL` é lida pelo **navegador**, não pelo servidor. Em produção, deve ser a URL pública do backend (ex: `https://backend-api-xxx.run.app`), não um endereço interno Docker.

---

## Rotas da API

### Autenticação (`/auth`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/auth/login` | Login — retorna token JWT | Pública |
| `POST` | `/auth/register` | Cadastrar usuário | **ADMIN** |

**Payload login:**
```json
{ "login": "admin", "senha": "senha123" }
```

**Resposta:**
```json
{ "token": "eyJ..." }
```

### Agendamentos (`/agendamentos`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/agendamentos/agendar` | Criar agendamento | JWT |
| `GET` | `/agendamentos/consultar_agendamentos` | Listar todos | JWT |
| `POST` | `/agendamentos/{id}/status` | Atualizar status | JWT |
| `POST` | `/agendamentos/fechar-expediente` | Gerar PDF e limpar registros do dia | **ADMIN** |

**Payload criar agendamento:**
```json
{
  "nomeSolicitante": "João da Silva",
  "cpf": "12345678901",
  "rg": "1234567",
  "tipoServico": "BENEFICIO_PREVIDENCIARIO",
  "prioridade": "IDOSO",
  "dataHoraChegada": "2025-07-01T09:30"
}
```

**Valores válidos — `tipoServico`:** `EMISSAO_DOCUMENTOS`, `BENEFICIO_PREVIDENCIARIO`, `CONSULTORIA_FINANCEIRA`, `SUPORTE_TECNICO`, `OUTROS`

**Valores válidos — `prioridade`:** `NORMAL`, `IDOSO`, `PREFERENCIAL`, `PCD`

**Valores válidos — `status`:** `AGUARDANDO`, `EM_ATENDIMENTO`, `CONCLUIDO`, `CANCELADO`

---

## Autenticação

Todas as rotas (exceto `/auth/login`) exigem token JWT no header:

```
Authorization: Bearer <token>
```

O token é obtido via `POST /auth/login` e expira em **2 horas**. O frontend armazena o token em `localStorage` e o interceptor do Axios o inclui automaticamente. Ao expirar (resposta 401), o usuário é redirecionado para o login.

---

## Banco de Dados — Migrations Flyway

| Versão | Arquivo | Descrição |
|--------|---------|-----------|
| V1 | `V1__criar_tabela_agendamentos.sql` | Tabela `tb_agendamentos` |
| V2 | `V2__criar_tabela_usuarios.sql` | Tabela `tb_usuarios` |
| V3 | `V3__adicionar_prioridade_agendamentos.sql` | Coluna `prioridade` em `tb_agendamentos` |

> O Flyway é configurado manualmente via `FlywayConfig.java` (necessário no Spring Boot 4 para garantir que as migrations rodem antes da validação do Hibernate).

---

## Deploy — GCP Cloud Run + Firebase Hosting

### Visão geral

| Componente | Serviço GCP | URL |
|------------|-------------|-----|
| Backend (API) | Cloud Run | `https://backend-api-xxx.us-central1.run.app` |
| Frontend (SPA) | Firebase Hosting | `https://seu-projeto.web.app` |
| Banco de dados | Cloud SQL (PostgreSQL 16) | Conexão via socket Unix ou URL JDBC |

---

### Backend — GCP Cloud Run

O backend é empacotado como imagem Docker e publicado no Cloud Run.

**1. Build e push da imagem para o Artifact Registry:**

```bash
# Substitua PROJECT_ID pelo ID do seu projeto GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

docker build -t us-central1-docker.pkg.dev/PROJECT_ID/sai/backend:latest ./backend
docker push us-central1-docker.pkg.dev/PROJECT_ID/sai/backend:latest
```

**2. Deploy no Cloud Run:**

```bash
gcloud run deploy backend-api \
  --image us-central1-docker.pkg.dev/PROJECT_ID/sai/backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/agendamento_db" \
  --set-env-vars "SPRING_DATASOURCE_USERNAME=postgres" \
  --set-env-vars "SPRING_DATASOURCE_PASSWORD=SENHA" \
  --set-env-vars "JWT_SECRET=SUA_CHAVE_SECRETA" \
  --set-env-vars "ADMIN_LOGIN_LINE=admin" \
  --set-env-vars "ADMIN_PASSWORD_LINE=SENHA_ADMIN" \
  --set-env-vars "RELATORIO_PATH=/app/relatorios"
```

> O Flyway roda automaticamente ao iniciar o container e aplica as migrations pendentes.

**Variáveis de ambiente obrigatórias no Cloud Run:**

| Variável | Valor em produção |
|----------|-------------------|
| `SPRING_DATASOURCE_URL` | URL do Cloud SQL ou banco externo |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco |
| `JWT_SECRET` | Chave longa e aleatória (mínimo 32 chars) |
| `ADMIN_LOGIN_LINE` | Login do admin inicial |
| `ADMIN_PASSWORD_LINE` | Senha do admin inicial |

---

### Frontend — Firebase Hosting

O frontend é um build estático servido pelo Firebase Hosting. A `VITE_API_URL` é injetada em **tempo de build** e deve apontar para a URL pública do Cloud Run.

**1. Instale o Firebase CLI e faça login:**

```bash
npm install -g firebase-tools
firebase login
```

**2. Inicialize o projeto (só na primeira vez):**

```bash
cd front
firebase init hosting
# Escolha: existing project → seu projeto GCP
# Public directory: dist
# Single-page app: yes
# Overwrite index.html: no
```

**3. Build com a URL de produção e deploy:**

```bash
cd front
VITE_API_URL=https://backend-api-xxx.us-central1.run.app npm run build
firebase deploy --only hosting
```

> A `VITE_API_URL` **deve ser definida antes do build** para que o Vite a incorpore no bundle estático. Ela não pode ser alterada depois sem um novo build.

---

### Banco de dados em produção

**Opção A — Cloud SQL (recomendado para produção):**
1. Crie uma instância PostgreSQL 16 no Cloud SQL
2. Crie o banco `agendamento_db`
3. Configure o Cloud Run para se conectar via Cloud SQL Auth Proxy ou IP público
4. Use a variável `SPRING_DATASOURCE_URL` com a URL de conexão

**Opção B — Supabase / Neon (mais simples para protótipos):**
- Crie um banco gratuito no [supabase.com](https://supabase.com) ou [neon.tech](https://neon.tech)
- Copie a connection string PostgreSQL e use em `SPRING_DATASOURCE_URL`

---

### O processo mudou do deploy anterior?

**Não.** O fluxo é idêntico ao da versão anterior. As únicas diferenças a considerar:

1. **Flyway**: agora usa `FlywayConfig.java` em vez da auto-configuração do Spring Boot. Isso é transparente — o Flyway ainda roda na inicialização e aplica as migrations automaticamente.
2. **Sem `/api/v1`**: os endpoints não têm prefixo. Certifique-se de que `VITE_API_URL` aponta para a raiz (ex: `https://backend-api-xxx.run.app`), sem `/api/v1` no final.
3. **Jackson 3**: `LocalDateTime` agora é serializado com `@JsonFormat` no DTO, sem configuração global. Nenhuma ação necessária no deploy.

---

## CI/CD — GitHub Actions

O arquivo `.github/workflows/ci.yml` executa em todo push para `main` e `develop`:

1. **Backend job**: sobe PostgreSQL como service, compila com Maven, roda testes.
2. **Frontend job**: instala dependências npm, roda linter, executa build Vite.
3. Artefatos (JAR e `dist/`) são salvos por 5 dias.

Para adicionar deploy automático ao GCP, configure os secrets no repositório GitHub:
- `GCP_PROJECT_ID`
- `GCP_SA_KEY` (chave JSON da Service Account com permissão Cloud Run Admin + Storage Admin)
- `FIREBASE_SERVICE_ACCOUNT` (para deploy do frontend)

---

## Estrutura do Projeto

```
backend/src/main/java/com/devtec/sai/
├── config/
│   ├── AdminSetup.java              # Cria usuário admin no boot se configurado
│   ├── FlywayConfig.java            # Configuração manual do Flyway (Spring Boot 4)
│   ├── SecurityConfigurations.java  # Spring Security + CORS
│   ├── SecurityFilter.java          # Filtro JWT por requisição
│   └── SwaggerConfig.java
├── controller/
│   ├── AgendamentoController.java
│   └── AuthenticationController.java
├── dto/
│   ├── AgendamentosRequestDTO.java
│   ├── AgendamentoResponseDTO.java
│   ├── AtualizarStatusDTO.java
│   ├── AuthenticationDTO.java
│   ├── LoginResponseDTO.java
│   ├── RegisterDTO.java
│   ├── ErrorResponseDTO.java
│   └── FieldErrorDTO.java
├── model/
│   ├── Agendamento.java
│   ├── StatusAgendamento.java
│   ├── UserRole.java
│   └── Usuario.java
├── repository/
│   ├── AgendamentosRepository.java
│   └── UsuarioRepository.java
└── service/
    ├── AgendamentoService.java
    ├── AuthorizationService.java
    ├── RelatorioService.java
    └── TokenService.java

front/src/
├── components/
│   └── ProtectedRoute.tsx       # Redireciona para login se não autenticado
├── pages/
│   ├── LoginPage.tsx
│   └── AgendamentoPage.tsx
├── services/
│   └── api.ts                   # Instância Axios com interceptors JWT e 401
└── App.tsx
```

---

## Solução de Problemas

**Login retorna 500 em vez de 401**
→ Versões antigas do controller não capturavam `BadCredentialsException`. Atualize para a versão atual que retorna 401 explicitamente.

**Frontend continua chamando `/api/v1/...` depois de mudar a env var**
→ `docker-compose restart` não aplica novas variáveis de ambiente. Use `docker-compose up -d --force-recreate frontend-app`.

**Erro de schema na inicialização (`missing table/column`)**
→ O Flyway não rodou antes do Hibernate. Confirme que `FlywayConfig.java` existe no projeto e que `spring.flyway.enabled=false` está no `application.properties`.

**Erro ao conectar no banco de dados**
→ Verifique se o PostgreSQL está rodando e as variáveis em `.env` estão corretas.

**Erro 401 (Não autorizado)**
→ Token JWT expirou (2h) — faça login novamente.

**Erro 403 (Proibido) ao tentar gerar relatório**
→ O endpoint `fechar-expediente` exige role `ADMIN`.

**Relatório PDF não é gerado**
→ Defina `RELATORIO_PATH` para um diretório com permissão de escrita.

**CORS bloqueando o frontend**
→ A URL do frontend deve estar em `allowedOrigins` no `SecurityConfigurations.java`. Adicione a URL de produção se necessário.

---

## Changelog

### v1.2.0 (2026-06-30)

#### Backend
- **[FIX]** Spring Boot 4: criado `FlywayConfig.java` com `BeanFactoryPostProcessor` para garantir que o Flyway roda antes da validação do Hibernate — resolve `missing table/column` na inicialização
- **[FIX]** Spring Boot 4 / Jackson 3: removida property `spring.jackson.serialization.write-dates-as-timestamps` (enum removido no Jackson 3) — substituída por `@JsonFormat` em `AgendamentoResponseDTO`
- **[FIX]** `AuthenticationController.login()` agora captura `AuthenticationException` e retorna 401 — antes propagava como 500

#### Frontend
- **[FIX]** `VITE_API_URL` corrigida para `http://localhost:8080` (sem `/api/v1` que não existe no backend)
- **[FIX]** Interceptor 401 agora ignora o endpoint `/auth/login` — evita redirect em loop ao errar a senha

#### Docker
- **[FIX]** `docker-compose.yml`: `VITE_API_URL` corrigida para `http://localhost:8080`

---

### v1.1.0 (2025-06-30)

#### Backend
- **[FIX]** Alinhada versão do módulo `io` do iText de `8.0.2` para `7.2.5`
- **[FIX]** Defaults adicionados para `ADMIN_LOGIN_LINE` e `ADMIN_PASSWORD_LINE`
- **[FEAT]** Campo `prioridade` adicionado ao modelo, DTOs e migration V3
- **[FIX]** `AgendamentoResponseDTO` corrigido com campos `rg` e `prioridade`
- **[FIX]** `fecharExpediente` agora filtra apenas agendamentos do dia atual
- **[FIX]** Tabela PDF corrigida (6 colunas declaradas, 6 preenchidas)
- **[FEAT]** `RELATORIO_PATH` configurável via variável de ambiente
- **[SECURITY]** `POST /auth/register` protegido — exige role ADMIN
- **[FIX]** `@CrossOrigin` duplicado removido do `AuthenticationController`

#### Frontend
- **[FEAT]** `ProtectedRoute` criado
- **[FEAT]** Interceptor 401 e logout automático
- **[FIX]** `AgendamentoPage` unificada com instância central do Axios
- **[FIX]** Interface `Agendamento` sincronizada com o backend

#### CI/CD
- **[FIX]** Variáveis `ADMIN_LOGIN_LINE`, `ADMIN_PASSWORD_LINE` e `RELATORIO_PATH` adicionadas ao CI

---

## Licença

[MIT](LICENSE)

## Autor

**Nicholas** — Desenvolvedor Full Stack
