# Guia: Deploy rápido do projeto SAI na Google Cloud Platform (GCP)

Este documento reúne, em um único lugar, as instruções passo-a-passo que te passei para subir o projeto (backend Java + frontend Vite + banco PostgreSQL) no GCP com custo mínimo, sem modificar código. Copie/cole os comandos no PowerShell e substitua os placeholders com seus valores.

> Observação importante: para usar Cloud Run você precisa de um projeto no GCP com billing habilitado (pode usar o crédito de avaliação). Apague recursos quando terminar para evitar cobranças.

---

## Sumário rápido
- Checklist prévio
- Opção recomendada (rápida): Cloud Run (backend) + Firebase Hosting (frontend) + Supabase (Postgres free)
- Comandos PowerShell prontos (substitua placeholders)
- Teste e limpeza
- Próximos passos que posso executar por você

---

## Checklist prévio
- Conta Google ativa
- Billing habilitado no GCP (necessário para Cloud Run)
- gcloud (Google Cloud SDK) instalado e autenticado
- Docker instalado (opcional)
- Node.js + npm instalados (para build do frontend)
- Firebase CLI (se for usar Firebase Hosting)
- Conta Supabase (ou outro Postgres gratuito) criada para evitar custos com Cloud SQL
- Estar na raiz do repositório (onde está `docker-compose.yml`)

---

## Visão escolhida (recomendada)
- Backend: Cloud Run (container)
- Frontend: Firebase Hosting (static + SSL, grátis para portfolio)
- Banco: Supabase (Postgres free)

Motivo: minimiza custo e complexidade de rede (evita Cloud SQL e VPC connector), rápido para mostrar no portfólio.

---

## Variáveis e segredos (exemplo)
Nunca comite segredos em repositórios. Use Secret Manager em produção. Exemplo de variáveis necessárias:

- SPRING_DATASOURCE_URL (jdbc:postgresql://host:port/dbname)
- SPRING_DATASOURCE_USERNAME
- SPRING_DATASOURCE_PASSWORD
- JWT_SECRET
- SPRING_PROFILES_ACTIVE (prod|dev)
- VITE_API_URL (para o build do frontend)

---

## Comandos PowerShell prontos
Substitua os valores `seu-project-id`, `db.xxx.supabase.co`, `SUA_SENHA_SUPABASE`, `SEU_CLOUD_RUN_URL` etc.

1) Autenticar e criar projeto GCP (se quiser criar novo projeto)

```powershell
# login gcloud (abrirá o navegador)
gcloud auth login

# definir variáveis
$PROJECT_ID="seu-project-id-unico"    # ex: sai-portfolio-20260417
$REGION="us-central1"                 # escolha próxima de você

# criar projeto (opcional) e selecionar
gcloud projects create $PROJECT_ID --set-as-default

gcloud config set project $PROJECT_ID

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

2) Build e push da imagem do backend usando Cloud Build (usa o Dockerfile em `backend/`)

```powershell
Set-Location -Path "C:\Users\NICHOLAS\Desktop\PROJETOS-GITHUB\SAI_API---Sistema-de-Agendamento-Institucional"

gcloud builds submit --tag gcr.io/$PROJECT_ID/sai-backend ./backend
```

3) Deploy no Cloud Run (substitua pelas credenciais do Supabase)

```powershell
$DB_HOST="db.xxx.supabase.co"
$DB_PORT="5432"
$DB_NAME="sai_agendamento"
$DB_USER="saiuser"
$DB_PASS="SUA_SENHA_SUPABASE"
$JWT_SECRET="coloque_uma_senha_jwt_forte_32_chars"
$SPRING_PROFILE="prod"

$SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME"

gcloud run deploy sai-backend `
  --image gcr.io/$PROJECT_ID/sai-backend `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --memory 512Mi `
  --set-env-vars "SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL,SPRING_DATASOURCE_USERNAME=$DB_USER,SPRING_DATASOURCE_PASSWORD=$DB_PASS,JWT_SECRET=$JWT_SECRET,SPRING_PROFILES_ACTIVE=$SPRING_PROFILE"
```

- Ao final, o Cloud Run retornará a URL pública do serviço (ex.: `https://sai-backend-xxxxx-uc.a.run.app`). Copie essa URL.

4) Build do frontend (Vite) e deploy no Firebase Hosting

Instale e faça login no Firebase CLI (se ainda não tiver):

```powershell
npm install -g firebase-tools
firebase login
```

Dentro da pasta `front/`, defina a variável de ambiente de build e rode o build:

```powershell
Set-Location -Path ".\front"
# Defina a URL da API apontando para o Cloud Run (adicione /api/v1 se necessário)
$env:VITE_API_URL="https://SEU_CLOUD_RUN_URL/api/v1"

npm install
npm run build
```

Inicialize (uma vez) e envie para o Firebase Hosting:

```powershell
# Uma vez apenas por projeto
firebase init hosting
# - selecione o projeto GCP existente
# - pasta pública: dist
# - configure como SPA (rewrites -> index.html)

# Deploy final
firebase deploy --only hosting
```

- O Firebase retornará a URL pública do frontend (ex.: `https://project-id.web.app`).

---

## Teste e verificação
- Abra a URL do frontend e verifique login, criação de agendamentos etc.
- Verifique logs do backend (Cloud Run):

```powershell
# listar serviços Cloud Run
gcloud run services list --platform managed --region $REGION

# ler logs (exemplo simples)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sai-backend" --limit 50 --project $PROJECT_ID --format="value(timestamp, textPayload)"
```

- Verifique se o Flyway criou as tabelas no Supabase (entre no painel do Supabase ou conecte via psql).

---

## Limpeza (evitar cobranças)
- Deletar serviço Cloud Run:

```powershell
gcloud run services delete sai-backend --region $REGION --quiet
```

- Excluir projeto GCP (apaga tudo e evita cobranças):

```powershell
gcloud projects delete $PROJECT_ID
```

- Remover projeto Supabase via dashboard do Supabase.

---

## Dicas finais e notas técnicas
- SPRING_PROFILES_ACTIVE=prod evita que o seeder `@Profile("dev")` crie usuários automaticamente. Se quiser criar admin automaticamente, setar `dev` e `DEFAULT_USER_PASSWORD`.
- Vite embute `VITE_API_URL` durante o build; para alterar a URL do frontend depois do deploy você precisa rebuild+redeploy.
- Para produção real, use Secret Manager (GCP) e configure secrets em vez de variáveis simples.
- Se o build de backend falhar no Cloud Build por falta de recursos, construa o jar localmente com `./mvnw.cmd clean package -DskipTests` e depois `docker build` local e `gcloud builds submit` ou envie para Artifact Registry manualmente.

---

## Como posso ajudar agora
- Gerar um script PowerShell `deploy-to-gcp.ps1` com os comandos configuráveis (eu crio no repositório para você executar localmente).
- Gerar um `.env.example` com as variáveis necessárias (na raiz do repo).
- Acompanhar você passo-a-passo enquanto executa (você me copia as saídas e eu te oriento).

Diga qual opção prefere e eu gero o arquivo/script correspondente.

