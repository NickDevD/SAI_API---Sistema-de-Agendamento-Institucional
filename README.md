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

### 🔑 Acesso para testar

| | |
|---|---|
| **Usuário** | `demo` |
| **Senha** | `demo123` |

As credenciais também aparecem na própria tela de login, com um botão **Preencher**.

O usuário demo tem role `USER`: cria e movimenta atendimentos, mas **não** consegue fechar o
expediente (esse endpoint exige `ADMIN` e apaga os registros do dia). Os dados são fictícios,
gerados no boot pelo `DemoDataSetup` — CPFs de exemplo, sem relação com pessoas reais.

---

## 🧭 Onde eu parei — leia primeiro

> Seção de orientação para retomar o projeto depois de um tempo parado.
> Última verificação: **2026-09-15**.

### O que está funcionando

| Componente | Estado | Observação |
|------------|--------|------------|
| **Stack local (Docker)** | ✅ **Funciona ponta a ponta** | Testado: login, criar, mover status, validação de CPF |
| Código do backend | ✅ Compila (`./mvnw compile`) | Spring Boot 4 + Java 21 |
| Código do frontend | ✅ Build passa (`npm run build`) | Vite 7 + React 18 |
| Frontend em produção | ✅ No ar (HTTP 200) | Firebase Hosting |
| CI (GitHub Actions) | ✅ Verde | Mas só roda `contextLoads` — **não há cobertura real** |
| **Backend em produção** | ❌ **FORA DO AR (HTTP 503)** | O container não sobe — veja abaixo |

**O que foi validado rodando local em 2026-09-15:**

| Teste | Resultado |
|-------|-----------|
| `GET /actuator/health` | `{"status":"UP"}` |
| `POST /auth/login` com senha errada | **401** (o fix da v1.2.0 funciona) |
| `POST /auth/login` com senha certa | **200** + token JWT |
| `POST /agendamentos/agendar` | **201**, com `prioridade` persistida |
| CPF inválido (`11111111111`) | **400** — a validação `@CPF` pega |
| Requisição sem token | **403** |
| `POST /api/v1/auth/login` | **403** — prova que o prefixo não existe |
| Kanban no navegador | Renderiza as 4 colunas, chips de prioridade e empty state |

> O boot do backend levou **76 segundos** na máquina local. Some isso ao cold start do
> Cloud Run com `min-instances 0` e você entende por que o primeiro acesso parece travado.

### ⚠️ O bloqueador atual: backend 503

O Cloud Run responde **503 em todas as rotas**. Como o frontend está no ar mas a API não,
o site abre e **qualquer login falha**. Este é o primeiro problema a resolver.

#### Causa mais provável: colisão de versão no Flyway (V3 reaproveitado)

Este problema foi **reproduzido localmente** com Docker — o backend falhou exatamente com o
mesmo sintoma de produção:

```
Migration checksum mismatch for migration version 3
-> Applied to database : -367444648
-> Resolved locally    : 1039334485
```

O número **V3 foi usado para duas migrations diferentes** ao longo do tempo:

| Versão | No banco (aplicado) | No código hoje |
|--------|---------------------|----------------|
| V3 | `insert admin user` | `adicionar prioridade agendamentos` |

Houve um `V3__insert_admin_user.sql` que rodou; depois ele foi substituído pelo
`V3__adicionar_prioridade_agendamentos.sql` atual, quando a criação do admin passou para o
`AdminSetup.java`. O resultado é permanente: **qualquer banco que aplicou o V3 antigo não
sobe mais com o código novo.** O Flyway aborta no boot → cai o `entityManagerFactory` → o
Tomcat não inicia → 503 em tudo.

É por isso que o sintoma é **503 e não 500**: a aplicação nunca chega a subir.

Confirme em produção com:

```bash
gcloud run services logs read backend-api --region us-central1 --limit 200 | grep -i "checksum\|Validate failed"
```

**Correção: veja o [`docs/RUNBOOK-FIX-PRODUCAO.md`](docs/RUNBOOK-FIX-PRODUCAO.md)** — passo a
passo testado localmente.

> ⚠️ **`flyway repair` sozinho não resolve.** Ele corrige o histórico mas não executa a
> migration, então a coluna `prioridade` continua faltando e o boot passa a falhar com
> `Schema validation: missing column [prioridade]` — 503 do mesmo jeito. São **dois passos**:
> `repair` **e** o `ALTER TABLE`. Isso foi verificado na prática, não deduzido.

> ⛔ **Regra:** migration já aplicada é imutável. Nunca reaproveite um número de versão nem
> edite um arquivo que já rodou — crie sempre a próxima versão.

Depois de subir, o teste que confirma que está tudo certo (deve retornar **401**, não 503):

```bash
curl -i -X POST https://backend-api-301612765087.us-central1.run.app/auth/login -H "Content-Type: application/json" -d "{\"login\":\"x\",\"senha\":\"x\"}"
```

### 🚨 A pegadinha que já quebrou o projeto duas vezes: `/api/v1`

**O backend NÃO usa o prefixo `/api/v1`.** As rotas são `/auth/...` e `/agendamentos/...`
direto na raiz. Não existe `server.servlet.context-path`.

O prefixo **existiu** numa versão antiga (quando o deploy era no Render:
`sai-backend.onrender.com/api/v1/...`) e foi removido do backend — mas a memória dele
sobreviveu na documentação e voltou pelo frontend em julho/2026, quebrando o login.

> **Se o login falhar com "credenciais inválidas", NÃO adicione `/api/v1`.**
> Verifique primeiro se o backend está no ar. Foi isso nas duas vezes.

O `VITE_API_URL` deve apontar para a **raiz** do Cloud Run, sem sufixo nenhum.

### Onde as coisas estão

| Preciso mexer em... | Arquivo |
|---------------------|---------|
| URL da API / interceptors JWT | `front/src/services/api.ts` |
| Tela de login | `front/src/pages/LoginPage.tsx` |
| Kanban + formulário (tela principal) | `front/src/pages/AgendamentoPage.tsx` |
| Rotas liberadas / CORS | `backend/.../config/SecurityConfigurations.java` |
| Regra do fechamento de expediente | `backend/.../service/AgendamentoService.java` |
| Próximos passos e melhorias mapeadas | [`docs/ROTEIRO-PORTFOLIO.md`](docs/ROTEIRO-PORTFOLIO.md) |
| **Subir o backend de produção** | [`docs/RUNBOOK-FIX-PRODUCAO.md`](docs/RUNBOOK-FIX-PRODUCAO.md) |
| Copy pronta para o LinkedIn | [`docs/COPY-LINKEDIN.md`](docs/COPY-LINKEDIN.md) |

### Dívida técnica conhecida

Levantamento completo, priorizado e com estimativas em
[`docs/ROTEIRO-PORTFOLIO.md`](docs/ROTEIRO-PORTFOLIO.md). Os três itens mais sérios:

1. **`fecharExpediente` apaga os dados** (`repository.deleteAll`) — o histórico de
   atendimento é destruído; se o PDF se perder, não há como reconstruir.
2. **Os PDFs somem** — `RELATORIO_PATH` grava no disco efêmero do Cloud Run, que é
   perdido a cada nova revisão. Combinado com o item 1, o dado desaparece por completo.
3. **Há 2 PDFs com CPF real versionados** em `relatorios/` — remover antes de divulgar
   o repositório.

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
| `DEMO_SEED_ENABLED` | Não | `false` | Popula a base com dados fictícios e cria o usuário demo |
| `DEMO_LOGIN` | Não | `demo` | Login do usuário de demonstração |
| `DEMO_PASSWORD` | Não | *(vazio)* | Senha do demo — sem ela o usuário não é criado |

### Frontend

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API acessível pelo navegador (ex: `http://localhost:8080`) |
| `VITE_DEMO_LOGIN` | Login exibido no aviso da tela de login. Deixe vazio em instalação real |
| `VITE_DEMO_PASSWORD` | Senha exibida no aviso. O aviso só aparece se **as duas** estiverem definidas |

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
VITE_API_URL=https://backend-api-xxx.us-central1.run.app VITE_DEMO_LOGIN=demo VITE_DEMO_PASSWORD=demo123 npm run build
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

### Antes de publicar o frontend — checagem obrigatória

A `VITE_API_URL` é embutida no bundle em **tempo de build**. Um build errado só se corrige
com outro build. Depois de `npm run build`, confirme que o prefixo fantasma não voltou:

```bash
grep -o "/api/v1" dist/assets/*.js
```

Não deve retornar **nada**. Se retornar, o login vai falhar em produção.

### Recomendações para o próximo deploy

- **`--min-instances 1`** — sem isso o Cloud Run escala a zero e o primeiro acesso paga
  um cold start de JVM de 20–30 s. Se preferir custo zero, mantenha `0` e assuma a demora.
- **Secret Manager em vez de `--set-env-vars`** para `JWT_SECRET` e a senha do banco —
  com `--set-env-vars` os valores ficam legíveis para qualquer um com acesso de leitura
  ao projeto, e no seu próprio histórico de shell:

```bash
echo -n "CHAVE_LONGA_ALEATORIA" | gcloud secrets create jwt-secret --data-file=-
```

```bash
gcloud run services update backend-api --region us-central1 --set-secrets "JWT_SECRET=jwt-secret:latest"
```

- **`TZ=America/Sao_Paulo`** — o Cloud Run roda em UTC, então os horários no relatório PDF
  saem com 3 h de diferença.

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

**Login diz "credenciais inválidas" mesmo com a senha certa** ⭐ *já aconteceu duas vezes*
→ Quase sempre é o **backend fora do ar**, não a senha. Teste antes de mexer no código:
`curl -i -X POST <URL_BACKEND>/auth/login -H "Content-Type: application/json" -d "{\"login\":\"x\",\"senha\":\"x\"}"`.
**401** = backend OK, senha errada mesmo. **503** = container não sobe (veja os logs do Cloud Run). **404** = URL errada.
→ **Não adicione `/api/v1`** para tentar resolver. O backend não usa esse prefixo nesta versão; adicionar quebra todas as chamadas.

**Tudo virou 404 depois de publicar o frontend**
→ O bundle foi buildado com um `VITE_API_URL` errado, ou com o prefixo `/api/v1`. Confirme com
`grep -o "/api/v1" dist/assets/*.js` (não pode retornar nada) e refaça o build — a variável é
embutida em tempo de compilação e não muda sem um novo build.

**Toda rota responde 503**
→ O container não está subindo. Com `ddl-auto=validate` + Flyway no boot, a causa mais comum é
banco inacessível (instância gratuita pausada, senha trocada, IP não liberado).
`gcloud run services logs read backend-api --region us-central1 --limit 100`

**Frontend continua chamando a URL antiga depois de mudar a env var (Docker)**
→ `docker-compose restart` não aplica novas variáveis de ambiente. Use `docker-compose up -d --force-recreate frontend-app`.

**Login retorna 500 em vez de 401**
→ Versões antigas do controller não capturavam `BadCredentialsException`. Atualize para a versão atual que retorna 401 explicitamente.

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

### v1.3.0 (2026-09-15)

Sessão de auditoria após período parado. Foco: destravar o deploy e preparar o
projeto para divulgação. Levantamento completo em [`docs/ROTEIRO-PORTFOLIO.md`](docs/ROTEIRO-PORTFOLIO.md).

#### Frontend
- **[FIX]** `api.ts`: revertido o prefixo `/api/v1` do `baseURL`, reintroduzido por engano em `4719c03`. O backend nunca teve esse prefixo nesta versão — o bundle em produção comprovava isso. Com o prefixo, **todas** as chamadas dariam 404
- **[FEAT]** `index.html` deixou de ser o template padrão do Vite: `<title>` real (era `front`), `lang="pt-BR"` (era `en` — leitores de tela liam português com fonética inglesa), `<meta name="description">` e tags Open Graph para o preview ao compartilhar o link
- **[FEAT]** Favicon próprio em `public/favicon.svg` (era o logo do Vite)
- **[FIX]** Fonte `Source Sans 3`, declarada no tema mas nunca carregada, agora vem do Google Fonts — antes caía sempre no fallback

#### Backend
- **[FIX]** `SecurityConfigurations`: removido o `requestMatcher` morto de `/api/v1/auth/login`, resíduo da tentativa e erro com o prefixo
- **[FEAT]** `/actuator/health` liberado. O `spring-boot-starter-actuator` já estava no `pom.xml`, mas a rota caía em `anyRequest().authenticated()` — ou seja, **nenhum health check externo funcionava**, o que é parte do motivo de o 503 atual ser tão opaco. Use no startup probe do Cloud Run

#### Demonstração / portfólio
- **[FEAT]** `DemoDataSetup.java` — popula a base com 6 atendimentos fictícios e cria o usuário `demo`, ativado por `DEMO_SEED_ENABLED=true`. Segue o mesmo padrão `CommandLineRunner` do `AdminSetup`. Só insere se a tabela estiver vazia, e os horários são calculados a partir de `LocalDate.now()` para que a fila apareça sempre como "hoje"
- **[FEAT]** O usuário demo é criado com role `USER`, não `ADMIN`. Assim um visitante cria e movimenta atendimentos, mas **não** consegue chamar `fechar-expediente` (que apaga os registros do dia) — a demonstração não se esvazia sozinha, e o controle de acesso por role fica demonstrado na prática
- **[SECURITY]** CPF passou a ser mascarado na resposta da API (`***.456.789-**`). O kanban nunca exibiu o CPF, mas `AgendamentoResponseDTO` servia o número completo, visível no devtools de qualquer pessoa autenticada. O valor integral continua no banco e no PDF, que é o registro oficial

- **[FEAT]** Tela de login exibe as credenciais do demo num `Alert`, com botão **Preencher** que preenche o formulário em um clique. Renderiza só quando `VITE_DEMO_LOGIN` e `VITE_DEMO_PASSWORD` estão definidas no build — instalação real não mostra nada

#### Docker
- **[FIX]** `docker-compose.yml`: adicionados `stdin_open: true` e `tty: true` ao `frontend-app`. O Vite escuta o stdin para atalhos de teclado e **encerrava assim que o stdin fechava** — ou seja, o fluxo `docker-compose up -d` documentado no README nunca manteve o frontend de pé. O container subia e morria em segundos
- **[CHORE]** Removido o atributo `version: '3.8'`, obsoleto no Compose v2+ (gerava warning a cada comando)

#### Diagnóstico (sem alteração de código)
- **[DIAG]** Identificada a causa provável do 503 em produção: **colisão de versão no Flyway**. O número `V3` foi reaproveitado — o banco tem `V3 = insert admin user`, o código tem `V3 = adicionar prioridade agendamentos`. Reproduzido localmente. Detalhes na seção "Onde eu parei"
- **[DIAG]** `SecurityFilter.shouldNotFilter()` ainda referencia `/api/v1/auth/login` e `/api/v1/auth/register` — resíduo do prefixo antigo. Hoje é inofensivo (sem token o filtro só repassa), mas é lógica morta e confunde. **Não alterado nesta versão**

#### Documentação
- **[DOC]** Seção "Onde eu parei" no topo do README, com estado verificado de cada componente e os resultados dos testes locais
- **[DOC]** Corrigida a contradição sobre `/api/v1` entre o README e o código
- **[DOC]** `docs/ROTEIRO-PORTFOLIO.md` — auditoria completa, roteiro de redeploy e backlog priorizado

> **Não incluído nesta versão** (requer decisão): remoção dos PDFs com CPF real de
> `relatorios/`, que exige reescrita do histórico do git.

---

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
