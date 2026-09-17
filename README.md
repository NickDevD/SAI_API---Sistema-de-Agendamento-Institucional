# SAI — Sistema de Agendamento Institucional

Um sistema para organizar a fila de atendimento do CRAS: registro de chegada, acompanhamento em kanban, prioridade legal para idoso e PCD, e relatório de expediente em PDF.

[![CI](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/actions/workflows/ci.yml/badge.svg)](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-6DB33F?style=flat&logo=spring-boot)
![React](https://img.shields.io/badge/React-18%20%2B%20TypeScript-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-blue)

<p align="center">
  <img src=".github/demo.gif" alt="Demonstração do SAI: login no sistema, cadastro de um atendimento e movimentação do card entre as colunas do kanban, de Aguardando até Concluído" width="880">
</p>

---

## Experimentar

| | |
|---|---|
| **Sistema** | https://sai-agendamento-institucional.web.app |
| **API — Swagger** | https://backend-api-301612765087.us-central1.run.app/swagger-ui.html |
| **Usuário** | `demo` |
| **Senha** | `demo123` |

O usuário demo tem papel `USER`: cria e movimenta atendimentos, mas não fecha o expediente — essa operação exige `ADMIN` e apagaria os dados da demonstração. Se a base ficar vazia, o seed repõe os seis atendimentos fictícios sozinho.

No Swagger, autentique em `POST /auth/login`, copie o `token` da resposta e cole no botão **Authorize** para liberar as demais rotas.

> O backend roda sem instâncias ociosas para ficar na cota gratuita do Cloud Run, então o primeiro acesso depois de um período parado leva cerca de um minuto para responder.

---

## Por que eu construí isso

No CRAS, a fila de atendimento costuma ser controlada em papel e planilha. Quem chegou primeiro, quem tem prioridade, quem já foi atendido, quantas pessoas passaram no dia — tudo fica na memória do atendente e num caderno.

O SAI organiza esse fluxo. A recepção registra a chegada do cidadão, o atendimento avança por um kanban, e no fim do dia o fechamento do expediente gera o relatório em PDF.

Tem um detalhe que mudou bastante o desenho: prioridade no SUAS não é preferência, é lei. Idoso (Lei 10.741/03) e pessoa com deficiência têm direito ao atendimento prioritário. Então eu não podia tratar isso como só mais um campo do formulário — a prioridade fica destacada no card, visível na fila o tempo todo, porque é isso que o atendente precisa enxergar sem procurar.

## O que o sistema faz

- Cadastro de atendimento com validação de CPF e classificação de prioridade
- Kanban com quatro estados: Aguardando, Em Atendimento, Concluído e Cancelado
- Autenticação com JWT e dois papéis, `ADMIN` e `USER`
- Fechamento de expediente gerando o relatório do dia em PDF
- CPF mascarado nas respostas da API — o número completo só aparece no relatório oficial
- Ambiente de demonstração opcional, que se popula sozinho

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Java 21 · Spring Boot 4 |
| Segurança | Spring Security 7 · JWT (Auth0) |
| Persistência | PostgreSQL 16 · Flyway |
| Relatórios | iText 7 |
| Frontend | React 18 · TypeScript · Vite 7 · Material UI 5 |
| Infraestrutura | Docker · GitHub Actions |
| Deploy | Cloud Run · Firebase Hosting · Supabase |

## Como está organizado

```
├── backend/          API REST — Spring Boot 4 + PostgreSQL
├── front/            SPA — React 18 + TypeScript
├── relatorios/       PDFs gerados em runtime (volume Docker)
└── docker-compose.yml
```

```
backend/src/main/java/com/devtec/sai/
├── config/         Segurança, JWT, Flyway, seed de admin e demonstração
├── controller/     Endpoints REST
├── dto/            Contratos de entrada e saída
├── exception/      Tratamento global de erros
├── model/          Entidades JPA e enums
├── repository/     Spring Data JPA
└── service/        Regras de negócio, tokens e geração de PDF
```

## Rodando na sua máquina

Você vai precisar de Docker e Docker Compose. Se preferir rodar sem containers, precisa de Java 21, Maven e Node 20.

Comece copiando o modelo de variáveis:

```bash
cp .env.example .env
```

Preencha `POSTGRES_PASSWORD`, `JWT_SECRET` e as credenciais de administrador. Depois:

```bash
docker compose up --build -d
```

| Serviço | Endereço |
|---------|----------|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |

O usuário administrador é criado no primeiro boot, a partir do que você colocou no `.env`.

<details>
<summary>Rodar sem Docker</summary>

```bash
cd backend && ./mvnw spring-boot:run
```

```bash
cd front && npm install && npm run dev
```

Crie um `front/.env` com `VITE_API_URL=http://localhost:8080`.

</details>

### Ambiente de demonstração

Se você ligar `DEMO_SEED_ENABLED=true`, a aplicação cria o usuário `demo` e popula a base com seis atendimentos fictícios.

O demo tem papel `USER` de propósito. Ele movimenta atendimentos, mas não fecha o expediente — essa operação exige `ADMIN` e apaga os registros do dia. Sem isso, qualquer visitante esvaziaria a demonstração no primeiro clique. E se a base ficar vazia por algum motivo, o seed repõe os dados sozinho.

## Variáveis de ambiente

### Backend

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `SPRING_DATASOURCE_URL` | Sim | `jdbc:postgresql://localhost:5432/agendamento_db` | URL JDBC do banco |
| `SPRING_DATASOURCE_USERNAME` | Sim | — | Usuário do PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Sim | — | Senha do PostgreSQL |
| `JWT_SECRET` | Sim | — | Chave de assinatura dos tokens |
| `CORS_ALLOWED_ORIGINS` | Não | `localhost:5173` e o host de produção | Origens liberadas, separadas por vírgula |
| `ADMIN_LOGIN_LINE` | Não | — | Login do administrador criado no boot |
| `ADMIN_PASSWORD_LINE` | Não | — | Senha do administrador |
| `RELATORIO_PATH` | Não | `/app/relatorios` | Onde os PDFs são gravados |
| `DEMO_SEED_ENABLED` | Não | `false` | Liga o ambiente de demonstração |
| `PORT` | Não | `8080` | Porta do servidor |

### Frontend

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API, sem sufixo de caminho |
| `VITE_DEMO_LOGIN` | Login mostrado na tela de login, quando há demonstração |
| `VITE_DEMO_PASSWORD` | Senha mostrada na tela de login |

Vale lembrar que as variáveis `VITE_*` entram no bundle na hora do build. Mudar depois não adianta — precisa compilar de novo.

## API

Fora o login, toda rota exige o header `Authorization: Bearer <token>`. O token vale por duas horas.

### Autenticação

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| `POST` | `/auth/login` | Autentica e devolve o token | Público |
| `POST` | `/auth/register` | Cadastra usuário | Autenticado |

```json
POST /auth/login
{ "login": "admin", "senha": "senha123" }

200 OK
{ "token": "eyJ..." }
```

### Agendamentos

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| `POST` | `/agendamentos/agendar` | Cria atendimento | Autenticado |
| `GET` | `/agendamentos/consultar_agendamentos` | Lista atendimentos | Autenticado |
| `POST` | `/agendamentos/{id}/status` | Atualiza o status | Autenticado |
| `POST` | `/agendamentos/fechar-expediente` | Gera o PDF e encerra o dia | `ADMIN` |

```json
POST /agendamentos/agendar
{
  "nomeSolicitante": "Maria Aparecida de Souza",
  "cpf": "52998224725",
  "rg": "1234567",
  "tipoServico": "BENEFICIO_PREVIDENCIARIO",
  "prioridade": "IDOSO",
  "dataHoraChegada": "2026-09-15T09:30"
}
```

**Valores aceitos**

| Campo | Valores |
|-------|---------|
| `tipoServico` | `EMISSAO_DOCUMENTOS` · `BENEFICIO_PREVIDENCIARIO` · `CONSULTORIA_FINANCEIRA` · `SUPORTE_TECNICO` · `OUTROS` |
| `prioridade` | `NORMAL` · `IDOSO` · `PREFERENCIAL` · `PCD` |
| `status` | `AGUARDANDO` · `EM_ATENDIMENTO` · `CONCLUIDO` · `CANCELADO` |

O `/actuator/health` é público, para health check.

## Banco de dados

O schema é versionado com Flyway e aplicado na inicialização.

| Versão | Descrição |
|--------|-----------|
| V1 | Tabela `tb_agendamentos` |
| V2 | Tabela `tb_usuarios` |
| V3 | Coluna `prioridade` em `tb_agendamentos` |

Uma decisão que vale explicar: o Flyway é configurado à mão no `FlywayConfig.java`, em vez da auto-configuração. No Spring Boot 4 a ordem padrão não garante que as migrations rodem antes da validação de schema do Hibernate, e a aplicação quebrava no boot com `missing table/column`.

## Deploy

Rodo em três serviços independentes: **Cloud Run** para a API, **Firebase Hosting** para o frontend e **Supabase** para o banco. O estado fica todo fora do container, que pode ser descartado e recriado a qualquer momento — é o que permite escalar a zero e ficar na cota gratuita.

```
GitHub ──▶ Cloud Build ──▶ Artifact Registry ──▶ Cloud Run ──▶ Supabase
                                                      ▲
                          Firebase Hosting ───────────┘
                          (bundle estático)
```

### Backend

O Cloud Build compila o Java na nuvem a partir do `Dockerfile`, publica a imagem no Artifact Registry, e o Cloud Run passa a servi-la. As senhas ficam no Secret Manager e são entregues ao container em tempo de execução.

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJETO/sai-repo/sai-backend .

gcloud run deploy backend-api   --image us-central1-docker.pkg.dev/$PROJETO/sai-repo/sai-backend   --region us-central1   --allow-unauthenticated   --min-instances 0   --timeout 300   --memory 1Gi   --set-env-vars "SPRING_DATASOURCE_URL=jdbc:postgresql://$DB_HOST:5432/postgres?sslmode=require"   --set-env-vars "SPRING_DATASOURCE_USERNAME=$DB_USER,TZ=America/Sao_Paulo"   --set-env-vars "DEMO_SEED_ENABLED=true,DEMO_LOGIN=demo,DEMO_PASSWORD=demo123"   --set-secrets "SPRING_DATASOURCE_PASSWORD=sai-db-password:latest,JWT_SECRET=sai-jwt-secret:latest,ADMIN_PASSWORD_LINE=sai-admin-pass:latest"
```

Três escolhas que valem explicar:

`--memory 1Gi` porque os 512 MB padrão não comportam a JVM — o container morre por falta de memória, e o log não deixa claro. `--min-instances 0` mantém tudo na cota gratuita, ao custo de o primeiro acesso após ociosidade esperar o boot. E `TZ` porque o Cloud Run roda em UTC: sem isso os horários do relatório saem três horas deslocados.

### Banco

O Supabase entra pela **Session pooler**, na porta 5432. A conexão direta (`db.<ref>.supabase.co`) resolve apenas em IPv6, e o egress do Cloud Run é IPv4 — a conexão nunca completa e o container morre no boot sem mensagem clara. A porta 6543, do *transaction pooler*, também não serve: ela não mantém sessão entre comandos, o que quebra os locks das migrations do Flyway.

### Frontend

A URL da API é incorporada ao bundle **durante a compilação**, então o `.env` precisa existir antes do `npm run build`.

```bash
export API=$(gcloud run services describe backend-api --region us-central1 --format='value(status.url)')

printf 'VITE_API_URL=%s
VITE_DEMO_LOGIN=demo
VITE_DEMO_PASSWORD=demo123
' "$API" > .env

npm ci && rm -rf dist && npm run build

firebase deploy --only hosting
```

Confira o bundle antes de publicar — sem `.env`, o Vite usa o fallback `localhost:8080` e nenhuma chamada funciona em produção, sem nenhum erro no build:

```bash
grep -c "localhost:8080" dist/assets/*.js   # precisa ser 0
```

### Verificação

```bash
curl -s -o /dev/null -w "%{http_code}
" -X POST -H "Content-Type: application/json" -d '{"login":"x","senha":"x"}' $API/auth/login
```

**401 é o resultado certo**: significa que a API subiu e rejeitou a senha errada. 503 é container que não sobe; 500 é falha interna, normalmente banco.

O Cloud Run só exige que o container escute na porta que vem em `PORT`, em `0.0.0.0` — o `server.port=${PORT:8080}` já resolve isso.

## CI

O workflow em `.github/workflows/ci.yml` roda a cada push em `main` e `develop`: sobe um PostgreSQL de serviço, compila o backend com Maven, executa os testes e compila o frontend com lint.

## Licença

[MIT](LICENSE)

## Autor

**Nicholas Monteiro** — [GitHub](https://github.com/NickDevD)
