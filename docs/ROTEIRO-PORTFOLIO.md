# Roteiro — Publicar o SAI como portfólio no LinkedIn

Documento de trabalho. Verificado contra o código em `main` (`73eaf68`) e contra o deploy ao vivo em 2026-09-15.

---

## 0. Estado atual verificado

| Item | Estado | Evidência |
|------|--------|-----------|
| Frontend (Firebase Hosting) | **No ar** — HTTP 200 | `https://sai-agendamento-institucional.web.app` |
| Backend (Cloud Run) | **FORA DO AR** — HTTP 503 | `/v3/api-docs` e `/auth/login` retornam 503 |
| Bundle publicado do front | Aponta para a raiz da API (**sem** `/api/v1`) | `assets/index-CRTwuG3J.js` |
| Código local do front | ✅ **Corrigido** — voltou a apontar para a raiz | [api.ts:3](../front/src/services/api.ts#L3) |
| Stack local (Docker) | ✅ **Funciona ponta a ponta** | Login, kanban, criação, permissões por role |

> Hoje o site abre, mas **qualquer login falha** porque a API está 503. É exatamente o primeiro clique que um recrutador dá.
>
> **Atualização (2026-09-15):** os itens 1.1, 1.4 e 1.5 já foram implementados — veja o
> changelog v1.3.0 no README. Restam o **1.2** (subir o backend, veja o
> [runbook](RUNBOOK-FIX-PRODUCAO.md)) e o **1.3** (PDFs com CPF real).

---

## 1. Bloqueadores — resolver ANTES de postar

### 1.1 🔴 Regressão do `/api/v1` — quebra o front se você publicar agora

O commit [`4719c03`](https://github.com/NickDevD/SAI_API---Sistema-de-Agendamento-Institucional/commit/4719c03) adicionou o prefixo `/api/v1` ao `baseURL` do Axios, com a justificativa de que era "o prefixo usado pelo backend". **O backend não usa esse prefixo.**

Os controllers mapeiam a raiz:

- [`AgendamentoController.java:17`](../backend/src/main/java/com/devtec/sai/controller/AgendamentoController.java#L17) → `@RequestMapping("/agendamentos")`
- [`AuthenticationController.java:20`](../backend/src/main/java/com/devtec/sai/controller/AuthenticationController.java#L20) → `@RequestMapping("/auth")`

Não existe `server.servlet.context-path` em `application.properties`, e o bundle **que está em produção hoje** não contém `/api/v1` — ou seja, a versão publicada é a correta e o código local é que regrediu.

A causa real do "credenciais inválidas" era o backend fora do ar (503), não o prefixo.

**De onde veio a confusão:** o prefixo existiu de verdade. Um shelve do IntelliJ de 29/07/2026 07:12 (`.idea/shelf/Uncommitted_changes_before_Update.../shelved.patch`) guarda uma versão anterior do controller com `@RequestMapping("/api/v1/agendamentos")`, e referências a `https://sai-backend.onrender.com/api/v1/...` — de quando o deploy era no Render. O prefixo foi removido do backend em algum momento, mas a memória dele sobreviveu na documentação e voltou pelo front seis horas depois, no commit acima. Vale registrar isso no changelog para não reintroduzir pela terceira vez.

(O diretório `.idea/` está corretamente coberto pelo `.gitignore`, então esse resíduo não vai para o repositório.)

**Correção** — reverter a linha 3 de `front/src/services/api.ts`:

```ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```

Como confirmação secundária, o `SecurityConfigurations` libera **as duas** rotas de login (`/api/v1/auth/login` e `/auth/login`) — sintoma de tentativa e erro. Depois de reverter, remova a linha morta do `/api/v1`.

### 1.2 🔴 Backend 503 — o link do portfólio está quebrado

O container não sobe.

#### 🎯 Causa mais provável: colisão de versão no Flyway (V3 reaproveitado)

**Reproduzi o problema localmente.** Ao subir o stack com Docker contra o banco de
desenvolvimento existente, o backend falhou exatamente com o sintoma de produção — 503 em
todas as rotas, inclusive nas `permitAll`:

```
Migration checksum mismatch for migration version 3
-> Applied to database : -367444648
-> Resolved locally    : 1039334485
```

Consultando o histórico do Flyway no banco:

| Versão | Descrição **no banco** | Descrição **no código hoje** |
|--------|------------------------|------------------------------|
| V1 | criar tabela agendamentos | criar tabela agendamentos ✅ |
| V2 | criar tabela usuarios | criar tabela usuarios ✅ |
| V3 | **insert admin user** | **adicionar prioridade agendamentos** ❌ |

O número **V3 foi reaproveitado para uma migration completamente diferente**. Existiu um
`V3__insert_admin_user.sql` que foi aplicado; depois ele foi substituído pelo
`V3__adicionar_prioridade_agendamentos.sql` atual (commit `22cf1df`), provavelmente quando a
criação do admin migrou para o `AdminSetup.java`.

O efeito é permanente: **qualquer banco que aplicou o V3 antigo nunca mais sobe com o código
novo.** O Flyway valida no boot, encontra o checksum divergente, aborta a criação do bean
`flyway` → cai o `entityManagerFactory` → cai o `securityFilter` → o Tomcat não inicia. Sem
servlet no ar, o Cloud Run devolve 503 em tudo — que é precisamente o que a API de produção
faz hoje.

Isso também explica por que o sintoma é **503 e não 500**: a aplicação nunca chega a subir.

**Como confirmar em produção** (a mensagem aparece no log do boot):

```bash
gcloud run services logs read backend-api --region us-central1 --limit 200 | grep -i "checksum\|Validate failed"
```

**Como corrigir**, em ordem de preferência:

1. **`flyway repair`** — atualiza os checksums no `flyway_schema_history` sem tocar nos dados.
   É a correção certa se o banco de produção tem dados que importam.
2. **Renumerar** a migration atual para `V4__adicionar_prioridade_agendamentos.sql` e aplicar
   manualmente o `ALTER TABLE` em produção. Evita a colisão daqui pra frente.
3. **Recriar o banco** — só se não houver dado relevante. Foi o que fiz no ambiente local
   (o volume tinha 0 agendamentos e 1 usuário admin, recriado no boot pelo `AdminSetup`).

> **Regra que vale registrar:** migration já aplicada é imutável. Nunca reaproveite um número
> de versão nem edite um arquivo que já rodou em qualquer ambiente — sempre crie a próxima versão.

#### Outras causas possíveis

1. **Banco inacessível.** Se o Postgres não responder, o container também morre no startup. Se o banco era Supabase/Neon free tier, pode ter sido pausado por inatividade.
2. **Variáveis de ambiente perdidas** numa revisão posterior do serviço.
3. **Cold start estourando o timeout** — pouco provável (daria 504, não 503 consistente). Ainda assim, vale saber que **o boot local levou 76 segundos**.

Diagnóstico:

```bash
gcloud run services describe backend-api --region us-central1 --format="value(status.conditions)"
```

```bash
gcloud run services logs read backend-api --region us-central1 --limit 100
```

### 1.3 🔴 Relatórios com CPF real commitados em repositório público

```
relatorios/relatorio_2026-04-13.pdf
relatorios/relatorio_2026-07-29.pdf
```

Extraindo o texto do PDF de julho: nome completo e um CPF (`105.***.***-88`, redigido aqui de
propósito — o número integral está dentro do PDF). É o seu próprio dado, mas fica público e
indexável assim que o repo ganhar tráfego do LinkedIn — e contradiz o tema do projeto, que é
justamente lidar com dado sensível de cidadão.

**Correção:**

```bash
git rm --cached relatorios/*.pdf
printf 'relatorios/*.pdf\n' >> .gitignore
git commit -m "chore: remove relatorios com dado pessoal do versionamento"
```

Para apagar do histórico (o arquivo continua acessível por commit antigo mesmo depois do `git rm`), use `git filter-repo` ou o BFG. Se o repo ainda tem poucos clones, reescrever o histórico é tranquilo.

Substitua por `relatorios/.gitkeep` e um `relatorios/exemplo-anonimizado.pdf` com dados fictícios — serve melhor como demonstração.

### 1.4 ✅ Caminho de entrada para quem visita — **implementado**

Um recrutador abre o link, vê a tela de login e não tem credencial. Sem isso, o deploy não conta como portfólio.

**Resolvido na v1.3.0:** `DemoDataSetup.java` cria o usuário `demo` (role `USER`) e popula a
base com 6 atendimentos fictícios, ativado por `DEMO_SEED_ENABLED=true`. Testado localmente:
o demo faz login, cria e movimenta cards, e recebe **403** ao tentar fechar o expediente —
então não consegue esvaziar a demonstração.

Para ativar no Cloud Run:

```bash
gcloud run services update backend-api --region us-central1 --set-env-vars "DEMO_SEED_ENABLED=true,DEMO_LOGIN=demo,DEMO_PASSWORD=SENHA_DEMO"
```

**Credenciais visíveis — feito também.** A tela de login exibe usuário e senha num `Alert`,
com botão **Preencher** que preenche o formulário em um clique, e o README traz o bloco
"Acesso para testar" no topo. O aviso só renderiza quando `VITE_DEMO_LOGIN` e
`VITE_DEMO_PASSWORD` estão definidas no build — instalação real não mostra nada.

> ⚠️ **Essas variáveis entram no bundle em tempo de build.** Se esquecer delas no
> `npm run build` de produção, o aviso simplesmente não aparece e o visitante volta a travar
> na tela de login. Os comandos da seção 2.4 já incluem as duas.

### 1.5 🟡 `index.html` ainda é o template do Vite

[`front/index.html`](../front/index.html) nunca foi personalizado, e isso aparece **na aba do navegador** de quem abrir o link:

| Linha | Está | Deveria ser |
|-------|------|-------------|
| `<title>` | `front` | `SAI — Sistema de Agendamento Institucional` |
| `<html lang>` | `en` | `pt-BR` (a aplicação é toda em português) |
| `<link rel="icon">` | `/vite.svg` | favicon próprio |

Sem `<meta name="description">` e sem tags Open Graph — ou seja, ao colar o link no post do LinkedIn, o preview sai sem título e sem imagem. Para um post de portfólio, isso importa tanto quanto o código:

```html
<meta property="og:title" content="SAI — Sistema de Agendamento Institucional" />
<meta property="og:description" content="Gestão de fila de atendimento para o CRAS: kanban, prioridade legal e relatório de expediente." />
<meta property="og:image" content="https://sai-agendamento-institucional.web.app/preview.png" />
```

Correção de 10 minutos, alta visibilidade. O `lang="en"` também é um problema real de acessibilidade — leitores de tela pronunciam o português com fonética inglesa.

### 1.6 🟡 README desatualizado

A seção "O processo mudou do deploy anterior?" afirma **"Sem `/api/v1`"** — correto quanto ao backend, mas contradiz o código local atual. E o changelog v1.2.0 registra a mudança de `VITE_API_URL` sem mencionar a regressão posterior. Alinhe os dois após aplicar 1.1.

---

## 2. Redeploy — GCP Cloud Run + Firebase

Sim, os comandos são os mesmos de antes. O que muda é apenas o que precisa ser verificado antes.

### 2.1 Pré-requisitos

```bash
gcloud auth login
```

```bash
gcloud config set project sai-agendamento-institucional
```

Confirme que é o projeto certo (número `301612765087`, o mesmo da URL do Cloud Run):

```bash
gcloud projects describe sai-agendamento-institucional --format="value(projectNumber)"
```

### 2.2 Banco de dados

Antes de qualquer build, garanta que o Postgres responde. Se usava Supabase/Neon, reative a instância e teste:

```bash
psql "postgresql://USUARIO:SENHA@HOST:5432/agendamento_db" -c "select 1"
```

Se for migrar para Cloud SQL:

```bash
gcloud sql instances create sai-db --database-version=POSTGRES_16 --tier=db-f1-micro --region=us-central1
```

```bash
gcloud sql databases create agendamento_db --instance=sai-db
```

### 2.3 Backend — build, push e deploy

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

```bash
docker build -t us-central1-docker.pkg.dev/sai-agendamento-institucional/sai/backend:latest ./backend
```

```bash
docker push us-central1-docker.pkg.dev/sai-agendamento-institucional/sai/backend:latest
```

```bash
gcloud run deploy backend-api \
  --image us-central1-docker.pkg.dev/sai-agendamento-institucional/sai/backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --min-instances 1 \
  --set-env-vars "SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/agendamento_db" \
  --set-env-vars "SPRING_DATASOURCE_USERNAME=postgres" \
  --set-env-vars "SPRING_DATASOURCE_PASSWORD=SENHA" \
  --set-env-vars "JWT_SECRET=CHAVE_LONGA_ALEATORIA" \
  --set-env-vars "ADMIN_LOGIN_LINE=admin" \
  --set-env-vars "ADMIN_PASSWORD_LINE=SENHA_ADMIN" \
  --set-env-vars "RELATORIO_PATH=/app/relatorios"
```

Duas mudanças que valem a pena em relação ao deploy anterior:

- **`--min-instances 1`** — sem isso o Cloud Run escala a zero e o primeiro acesso paga um cold start de JVM de 20–30 s. Um recrutador interpreta isso como "não funciona". Custa alguns dólares por mês; se preferir zero custo, mantenha `0` e avise no README que o primeiro carregamento demora.
- **Secrets em vez de `--set-env-vars`** para `JWT_SECRET` e a senha do banco. Com `--set-env-vars`, os valores ficam visíveis em texto puro para qualquer um com leitura no projeto, e no seu próprio histórico de shell:

```bash
echo -n "CHAVE_LONGA_ALEATORIA" | gcloud secrets create jwt-secret --data-file=-
```

```bash
gcloud run services update backend-api --region us-central1 --set-secrets "JWT_SECRET=jwt-secret:latest"
```

Verifique que subiu antes de seguir:

```bash
curl -i https://backend-api-301612765087.us-central1.run.app/auth/login -X POST -H "Content-Type: application/json" -d '{"login":"x","senha":"x"}'
```

Esperado: **401**. Se vier 503, o container ainda não sobe — volte aos logs. Se vier 500, é o banco.

### 2.4 Frontend — build e deploy

**Aplique a correção 1.1 antes do build.** A `VITE_API_URL` entra no bundle em tempo de compilação; um build errado só se corrige com outro build.

```bash
cd front
```

```bash
npm ci
```

```bash
VITE_API_URL=https://backend-api-301612765087.us-central1.run.app VITE_DEMO_LOGIN=demo VITE_DEMO_PASSWORD=demo123 npm run build
```

No PowerShell, a variável não pode ser prefixada na mesma linha:

```powershell
$env:VITE_API_URL="https://backend-api-301612765087.us-central1.run.app"; $env:VITE_DEMO_LOGIN="demo"; $env:VITE_DEMO_PASSWORD="demo123"; npm run build
```

Confirme que o bundle ficou correto antes de publicar:

```bash
grep -o "/api/v1" dist/assets/*.js | head
```

Não deve retornar nada.

```bash
firebase deploy --only hosting
```

O `.firebaserc` já aponta para `sai-agendamento-institucional`, então não precisa de `--project`.

### 2.5 Checklist pós-deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://sai-agendamento-institucional.web.app
```

1. Login com a credencial demo funciona
2. Criar agendamento aparece na coluna Aguardando
3. Mover status entre colunas persiste após F5
4. Fechar expediente baixa o PDF (com usuário ADMIN)
5. Abrir em celular — o kanban de 4 colunas é o ponto fraco aqui

---

## 3. Melhorias — UI/UX

Ordenadas por impacto em quem vai avaliar o projeto.

### Alto impacto

**Nenhum feedback de carregamento no fetch inicial.** [`AgendamentoPage.tsx:170`](../front/src/pages/AgendamentoPage.tsx#L170) — `fetchAgendamentos` roda no mount sem estado de loading. Enquanto a API responde (ou falha), o kanban renderiza vazio e o sistema parece quebrado. Adicione um `loading` inicial com `Skeleton` do MUI nas colunas.

~~**Sem empty state.**~~ **Corrigido após testar a aplicação rodando:** o empty state existe
([AgendamentoPage.tsx:505](../front/src/pages/AgendamentoPage.tsx#L505), "Nenhum registro") e funciona.
Eu tinha levantado isso lendo só o início do arquivo. Nada a fazer aqui.

**Erro de rede vira só um toast vermelho.** Se o backend estiver fora (situação real hoje), o usuário vê "Erro ao carregar agendamentos" e uma tela vazia, sem botão de tentar novamente. Adicione um estado de erro com ação de retry.

**`window.confirm` nativo** em três lugares — cancelar agendamento ([:209](../front/src/pages/AgendamentoPage.tsx#L209)) e fechar expediente ([:224](../front/src/pages/AgendamentoPage.tsx#L224)). Destoa completamente do resto da interface, que é bem cuidada. Troque por `Dialog` do MUI. É a correção de melhor custo-benefício visual do projeto.

**Dois sistemas de notificação concorrentes.** `LoginPage` usa `react-toastify`; `AgendamentoPage` usa `Snackbar` + `Alert` do MUI, com posições e estilos diferentes. Escolha um.

**Dois temas divergentes.** `theme/theme.ts` (`borderRadius: 14`, Paper `20`) é aplicado no `App.tsx`, mas `AgendamentoPage` cria um `crasTema` próprio inline ([:45](../front/src/pages/AgendamentoPage.tsx#L45)) com `borderRadius: 8` e sobrescreve o global. As duas telas têm cantos visivelmente diferentes. Unifique num arquivo só.

### Médio impacto

**Kanban sem drag-and-drop.** `@hello-pangea/dnd` está no `package.json` mas não é importado em lugar nenhum — dependência morta. Um kanban arrastável é exatamente o tipo de coisa que rende um GIF bom no post do LinkedIn. Ou implemente, ou remova a dependência.

**CPF sem máscara.** Campo livre; o `.replace(/\D/g, '')` acontece só no submit ([:190](../front/src/pages/AgendamentoPage.tsx#L190)). O backend valida com `@CPF`, então o usuário digita errado e só descobre no erro genérico "Verifique os dados". Máscara no input + validação client-side.

**Erros de validação do backend não são exibidos.** O backend tem `FieldErrorDTO`/`ErrorResponseDTO` bem estruturados, mas o catch do front descarta tudo e mostra mensagem genérica. Mapear os erros por campo para `helperText` do `TextField` usa o que já foi construído.

**`@mui/x-date-pickers` e `date-fns` instalados e não usados** — o campo de data/hora é um input nativo. Mesma escolha: usar ou remover.

**Sem atualização automática.** O sistema é multiusuário por natureza (recepção + atendentes), mas cada aba só atualiza no próprio submit. Um `setInterval` de 15 s no `fetchAgendamentos` já melhora muito, e é honesto mencionar no README que a evolução natural seria SSE/WebSocket.

**Sem busca ou filtro.** Com 40+ atendimentos no dia, as colunas viram scroll infinito.

**Prioridade — já está boa, dá pra ir além.** Revendo com a aplicação rodando: idoso, PCD e
preferencial **já aparecem como chip colorido** no card ([:538](../front/src/pages/AgendamentoPage.tsx#L538)),
então o ponto que eu tinha levantado estava errado. O que ainda faria diferença é a fila
**ordenar** por prioridade, não só sinalizá-la — hoje `consultar()` devolve na ordem do
`findAll()` e o atendente precisa varrer a coluna com o olho para achar quem tem direito
legal de passar na frente.

### Menor impacto, mas notado

- Sem rota `*` — URL errada dá tela branca
- `ProtectedRoute` só checa existência do token, não expiração; token vencido deixa entrar e só quebra no primeiro request
- Logout sem confirmação, botão pequeno e sem label
- `height: 100vh` no container quebra com a barra de endereço do mobile — `100dvh` resolve
- Acessibilidade: os `IconButton` de status não têm `aria-label`; o chip laranja `#E65100` sobre `#FFF3E0` fica no limite do AA
- Fonte `Source Sans 3` declarada no tema ([AgendamentoPage.tsx:56](../front/src/pages/AgendamentoPage.tsx#L56)) mas nunca carregada — cai sempre no fallback `Segoe UI`/`Arial`

---

## 4. Melhorias — Backend

### Alto impacto

**`fecharExpediente` apaga os dados.** [`AgendamentoService.java:70`](../backend/src/main/java/com/devtec/sai/service/AgendamentoService.java#L70) — gera o PDF e roda `repository.deleteAll(hoje)`. O histórico de atendimento do CRAS desaparece; se o PDF se perder, não há como reconstruir. Num sistema público isso não passaria. Troque por arquivamento (coluna `arquivado_em` ou tabela de histórico) e filtre o kanban por `arquivado_em IS NULL`. **Esta é a melhoria que mais vale mencionar no post** — mostra que você pensa em ciclo de vida de dado, não só em CRUD.

**Os PDFs somem.** `RELATORIO_PATH=/app/relatorios` grava no disco do container, que é efêmero no Cloud Run. A cada nova revisão ou reciclagem de instância, todos os relatórios são perdidos — e como o `fecharExpediente` já apagou as linhas do banco, o dado some de vez. Mande para o Cloud Storage:

```bash
gcloud storage buckets create gs://sai-relatorios --location=us-central1
```

**`RuntimeException` genérica.** [`AgendamentoService.java:52`](../backend/src/main/java/com/devtec/sai/service/AgendamentoService.java#L52) — "Agendamento não encontrado" vira **500**, não 404. Crie uma exceção tipada e um `@RestControllerAdvice` que devolva o `ErrorResponseDTO` que já existe. Corrige o contrato da API inteira de uma vez.

**`/actuator/health` está bloqueado.** O `spring-boot-starter-actuator` está no `pom.xml`, mas o `SecurityConfigurations` não libera `/actuator/**` — cai em `anyRequest().authenticated()`. Resultado: nenhum health check externo funciona, e é parte do motivo de o 503 atual ser opaco. Libere só `/actuator/health` e configure o startup probe do Cloud Run nele.

**`JWT_SECRET` com default inseguro.** `application.properties` usa `${JWT_SECRET:JWT_SECRET}` — se a variável não for definida, a aplicação sobe com a chave literal `"JWT_SECRET"` e qualquer um forja token. Remova o default e deixe o boot falhar.

### Médio impacto

**CORS hardcoded com domínios mortos.** [`SecurityConfigurations.java:60`](../backend/src/main/java/com/devtec/sai/config/SecurityConfigurations.java#L60) inclui um domínio Vercel e `consulta-cep-api.web.app`, que não têm relação com este sistema. Mova para variável de ambiente (`CORS_ALLOWED_ORIGINS`) e limpe a lista.

**Sem paginação.** `consultar()` faz `findAll()` sem limite. Enquanto o expediente apagar tudo todo dia, não dói — mas o dia em que virar arquivamento (correção acima), vira. Resolva junto.

**Sem índice em `data_hora_chegada`.** `findByDataHoraChegadaBetween` faz seq scan. Uma migration `V4` com `CREATE INDEX` resolve.

**Testes praticamente ausentes.** Só existe `SaiApplicationTests` (`contextLoads`). O badge de CI verde no README sugere cobertura que não existe — um avaliador técnico checa isso. Alguns testes de `AgendamentoService` e um `@WebMvcTest` no login já mudam a impressão.

**Swagger público em produção.** Exposto sem autenticação. Ou restrinja por perfil, ou — já que é portfólio — **deixe aberto de propósito e linke no post**: um Swagger navegável é ótima vitrine. Só decida conscientemente.

**Sem rate limiting no login.** `/auth/login` aberto a força bruta.

**Sem auditoria.** Ninguém sabe qual atendente mudou qual status. Num sistema institucional é requisito.

### Contexto

- **Timezone**: o Cloud Run roda em UTC. O relatório mostra `18:17:59` — confira se bate com o horário local, senão o PDF sai com 3h de diferença. Defina `TZ=America/Sao_Paulo` no deploy.
- **Token de 2h sem refresh**: o atendente é deslogado no meio do expediente e perde o formulário aberto.
- **`prioridade` como `String`** no model, enquanto `status` é enum. Inconsistente; vale um enum.
- **Diretório `front;C`** vazio na raiz, criado por acidente de shell. Apague antes de alguém ver.
- **`SecurityFilter.shouldNotFilter()`** ainda lista `/api/v1/auth/login` e `/api/v1/auth/register` — mais um resíduo do prefixo antigo. Hoje é inofensivo (para `/auth/login` o filtro roda, mas sem token só repassa), porém é lógica morta que vai confundir a próxima pessoa que ler o arquivo, você inclusive.
- **Migrations são imutáveis.** Depois do episódio do V3, vale deixar isso explícito para o seu eu futuro: nunca reaproveite um número de versão nem edite um `.sql` que já rodou em qualquer ambiente.

---

## 5. Roteiro do post no LinkedIn

### Sequência

1. Corrigir os bloqueadores da seção 1 (especialmente 1.1, 1.2 e 1.3)
2. Redeploy conforme seção 2 e passar o checklist 2.5
3. Escolher 2–3 melhorias rápidas de UI (Dialog no lugar do `confirm`, tema unificado, empty states) — meio dia de trabalho, diferença grande no print
4. Atualizar o README: credenciais demo no topo, screenshot/GIF, corrigir a contradição do `/api/v1`
5. Gravar um GIF de 15–20 s: login → criar agendamento → mover no kanban → baixar PDF
6. Postar

### Estrutura do post

Abra pelo problema, não pela stack. "Fila de atendimento do CRAS controlada em papel e planilha" prende mais do que "Fiz uma API em Spring Boot".

Um parágrafo sobre o domínio: SUAS, prioridade legal para idoso e PCD, relatório de fechamento de expediente. Mostra que você entendeu o contexto antes de codar — é o que separa projeto de portfólio de exercício de curso.

Depois a stack, curta: Java 21 + Spring Boot 4, React + TypeScript, PostgreSQL com Flyway, Docker, CI no GitHub Actions, deploy em Cloud Run + Firebase Hosting.

Escolha **um** desafio técnico e conte de verdade. Duas boas opções neste projeto:

- O Flyway no Spring Boot 4 — a auto-configuração deixou de garantir a ordem contra a validação do Hibernate, e você resolveu com um `BeanFactoryPostProcessor` em `FlywayConfig.java`. É específico, recente, e mostra depuração de framework de verdade.
- A decisão de arquivar em vez de apagar no fechamento de expediente (se você implementar a correção da seção 4) — mostra raciocínio sobre dado sensível e retenção.

Feche com os links (app, repo, Swagger) e as credenciais demo. Sem hashtag demais — três ou quatro bastam.

### Antes de apertar publicar

- [ ] `https://sai-agendamento-institucional.web.app` abre e o login demo funciona
- [ ] O repositório está público e o README tem screenshot
- [ ] Nenhum PDF com CPF real no repo ou no histórico
- [ ] Nenhum secret no histórico do git
- [ ] O CI está verde
- [ ] Você testou o link no celular

---

## 6. Sugestão de ordem de execução

| Prioridade | Item | Esforço |
|-----------|------|---------|
| 1 | Reverter `/api/v1` (1.1) | minutos |
| 2 | Subir o backend (1.2) | depende do banco |
| 3 | Remover PDFs com CPF (1.3) | minutos |
| 4 | Usuário demo + README (1.4, 1.5) | 1 h |
| 5 | Liberar `/actuator/health` + `JWT_SECRET` sem default | 1 h |
| 6 | Dialog MUI + tema unificado + empty states | meio dia |
| 7 | `@RestControllerAdvice` + exceção tipada | meio dia |
| 8 | Arquivar em vez de deletar no expediente | 1 dia |
| 9 | Relatórios no Cloud Storage | 1 dia |
| 10 | Drag-and-drop no kanban | 1 dia |
| 11 | Testes de service e controller | 1–2 dias |

Itens 1 a 6 são suficientes para postar. De 7 em diante é o que transforma o projeto em argumento de entrevista.
