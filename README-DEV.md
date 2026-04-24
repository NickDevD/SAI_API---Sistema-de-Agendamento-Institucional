<!--- README-DEV.md: versão focada em desenvolvimento, CI/CD e Cloud para recrutadores e DX --->
# 💻 SAI — Sistema de Agendamento Institucional (DEV)

[![CI](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/actions/workflows/ci.yml/badge.svg)](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/branch/main/graph/badge.svg)](https://codecov.io/gh/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional)

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat&logo=spring-boot)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=flat&logo=postgresql)
![GCP](https://img.shields.io/badge/Cloud-GCP-blue?style=flat&logo=googlecloud)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=flat)

---

## 🎯 Objetivo deste documento

Versão técnica do README pensada para desenvolvedores, engenheiros de plataforma e recrutadores técnicos. Concentra as decisões de arquitetura, práticas de DevOps e instruções de desenvolvimento rápido.

---

## 🚀 Highlights técnicos

- Stack: Java 21, Spring Boot 3.x, PostgreSQL (Flyway), React + TypeScript, Material UI
- Infra & Deploy: GCP (Cloud Run), Secret Manager, GitHub Actions CI/CD. Suporte a Render como ambiente alternativo.
- Contêineres: Docker + Docker Compose para dev local

---

## 🏗 Arquitetura (resumo)

| Camada | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 3.x, Spring Security (JWT) |
| Frontend | React, TypeScript, Material UI, Vite |
| Persistência | PostgreSQL, Flyway (migrations) |
| CI/CD | GitHub Actions (build, test, publish image, deploy) |
| Cloud | GCP Cloud Run, Secret Manager; alternativa: Render |

---

## ☁️ Deploy & Infra (GCP — recomendado)

- Cloud Run para backend (serverless, autoscaling)
- Artifact Registry / Container Registry para imagens Docker
- Cloud SQL (PostgreSQL) gerenciado
- Secret Manager para JWT_SECRET, ADMIN_LOGIN, ADMIN_PASSWORD_PLAIN, DB credentials
- GitHub Actions para build/test/deploy

Fluxo de CI/CD (alto nível):
1. Push → GitHub Actions: build backend (Maven), tests, frontend build
2. Build/push Docker image → Artifact Registry
3. Deploy para Cloud Run (zero-downtime)

Badge de CI: o workflow `ci.yml` está incluso neste repositório em `.github/workflows/ci.yml`. Após push para GitHub o badge acima mostrará o status real.

---

## 🛠 Detalhes implementados (DevOps & Segurança)

- Secret Management: uso de Secret Manager (GCP) para segredos sensíveis.
- Idempotência de inicialização: `AdminSetup` (CommandLineRunner) garante criação segura e idempotente do usuário admin em ambientes distintos (Render vs GCP), evitando conflitos entre Flyway e runtime.
- Flyway controla schema e migrations; scripts ficam em `src/main/resources/db/migration`.

---

## 💡 Desafios técnicos superados

- Sincronização entre ambientes (Render / Cloud Run): resolvido com `AdminSetup` (veja `backend/src/main/java/com/devtec/sai/config/AdminSetup.java`). A estratégia:
  - Ler variáveis de ambiente/secret manager
  - Priorizar `ADMIN_PASSWORD_PLAIN` (hash gerado pela app) ou aceitar `ADMIN_PASSWORD_HASH`
  - Checar existência antes de criar usuário (idempotência)

- Migrations vs runtime se harmonizaram para evitar deploys falhos e duplicidade de inserts.

---

## ✨ Funcionalidades Principais

- Autenticação e autorização (JWT + RBAC: ADMIN / USER)
- Gestão de usuários (registro, roles, login)
- Agendamentos: CRUD completo
  - Criar agendamento — POST /api/agendamentos
  - Listar agendamentos — GET /api/agendamentos
  - Consultar por ID — GET /api/agendamentos/{id}
  - Atualizar — PUT /api/agendamentos/{id}
  - Remover — DELETE /api/agendamentos/{id}
- Endpoints de administração e health checks

---

## 🔧 Como rodar em desenvolvimento

Pré-requisitos: JDK 21, Maven, Node.js, Docker

1) Backend
```bash
cd backend
docker-compose up -d
./mvnw spring-boot:run
```

No Windows:
```powershell
mvnw.cmd spring-boot:run
```

2) Frontend
```bash
cd front
npm install
npm run dev
# http://localhost:5173
```

Variáveis de ambiente recomendadas (`backend/.env` local):
```env
JWT_SECRET=troque_por_um_segredo_longo
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB_NAME=sai_agendamento

# Bootstrap admin (dev only)
# NOTE: this project uses `ADMIN_PASSWORD_LINE` in GCP deploys; keep names consistent across environments
ADMIN_LOGIN=admin@example.com
ADMIN_PASSWORD_LINE=SenhaSegura123!
```

---

## ✅ CI (incluído) — `.github/workflows/ci.yml`

- Workflow simplificado incluído que compila backend e frontend, executa testes e publica status. Quando você fizer push para `main`, o badge de CI exibirá o status real.

---

## 📈 Cobertura de testes

- Badge Codecov incluída — para ativar cobertura real:
  1. Configure JaCoCo (ou plugin de cobertura) no `pom.xml` (opcional, podemos adicionar).
  2. Adicione `CODECOV_TOKEN` como secret no GitHub.
  3. Ative step de upload no workflow (podemos automatizar isso).

Se quiser, eu adiciono o plugin JaCoCo e integro o upload para que o badge mostre cobertura automaticamente.

---

## 📖 Documentação (Swagger / OpenAPI)

Documentação interativa disponível via Swagger UI quando o backend estiver rodando localmente:

```
http://localhost:8080/swagger-ui.html
```

---

## 🔒 Segurança

- Senhas são armazenadas criptografadas com BCrypt (BCryptPasswordEncoder).
- Autenticação stateless via JWT com filtros customizados no Spring Security (validação de token em cada request).
- Segredos sensíveis devem ser mantidos em Secret Manager (GCP) ou GitHub Secrets; nunca commitar segredos no repositório.

---

## 🐳 Docker (produção)

Build & run:
```bash
cd backend
./mvnw -DskipTests package
docker build -t sai-api:local .
docker run --env-file .env -p 8080:8080 sai-api:local
```

---

## 📬 Contato
Nicholas — Desenvolvedor Full Stack / Cloud & DevOps
- LinkedIn: https://www.linkedin.com/in/SEU_PERFIL_AQUI
- Portfólio: https://seu-portfolio.example.com

---

Se desejar, eu:
1. Converto este README para inglês pronto para GitHub/LinkedIn; 
2. Adiciono integração JaCoCo + Codecov e config no workflow (para cobertura real);
3. Atualizo o workflow para deploy automático ao Cloud Run (com exemplo de secrets e SA key).

