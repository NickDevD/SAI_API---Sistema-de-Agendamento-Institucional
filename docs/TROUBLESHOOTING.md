# Solução de problemas

Erros já encontrados neste projeto, com o diagnóstico que os identifica.

---

## Login diz "credenciais inválidas" com a senha correta

Quase sempre o backend está fora do ar, não a senha errada. Teste antes de mexer no código:

```bash
curl -i -X POST <URL_DA_API>/auth/login -H "Content-Type: application/json" -d '{"login":"x","senha":"x"}'
```

| Resposta | Significado |
|----------|-------------|
| **401** | A API está no ar e recusou a senha — o comportamento correto |
| **503** | O container não sobe |
| **500** | A aplicação subiu mas falha internamente |
| **404** | URL base errada |

> **Não adicione `/api/v1` para tentar resolver.** O backend não usa esse prefixo: as rotas são `/auth/...` e `/agendamentos/...` na raiz, e não há `server.servlet.context-path`. O prefixo existiu numa versão antiga, hospedada no Render, e foi removido — mas sobreviveu na documentação e voltou pelo frontend em julho de 2026, quebrando todas as chamadas. Já aconteceu duas vezes.

---

## Tudo vira 404 depois de publicar o frontend

O bundle foi compilado com `VITE_API_URL` errada. A variável é incorporada em tempo de build e não muda sem recompilar. Confirme antes de publicar:

```bash
grep -o "/api/v1" dist/assets/*.js
```

Não pode retornar nada.

---

## Todas as rotas respondem 503

O container não está subindo. Causas, em ordem de frequência:

**Faturamento desativado.** Com a conta de faturamento fechada, o Google desativa os serviços do projeto e o Cloud Run devolve 503 em tudo, sem gerar log de aplicação.

```bash
gcloud beta billing projects describe <PROJETO>
```

Precisa responder `billingEnabled: true`.

**Banco inacessível.** Com `ddl-auto=validate` e Flyway no boot, se o PostgreSQL não responder a aplicação morre na inicialização. Projetos Supabase no plano gratuito pausam após cerca de sete dias sem uso.

**Conexão direta do Supabase.** O host `db.<ref>.supabase.co` resolve apenas em IPv6, e o Cloud Run sai por IPv4. Use a *Session pooler* na porta 5432.

**Colisão de versão no Flyway.** Veja [RUNBOOK-FIX-PRODUCAO.md](RUNBOOK-FIX-PRODUCAO.md).

```bash
gcloud run services logs read backend-api --region us-central1 --limit 200 \
  | grep -iE "checksum|Validate failed|missing column|Connection|timeout|refused"
```

---

## O site carrega, mas o botão de entrar não faz nada

CORS. O navegador bloqueia a chamada quando a origem do frontend não está autorizada na API, e **nenhuma mensagem aparece na tela** — o erro só existe no console do navegador.

```bash
gcloud run services update backend-api --region us-central1 \
  --update-env-vars "CORS_ALLOWED_ORIGINS=https://seu-site.web.app"
```

Aceita múltiplas origens separadas por vírgula. Não exige reconstruir a imagem.

---

## `permission denied` ao ler um segredo

O serviço do Cloud Run não tem acesso ao Secret Manager. O deploy conclui, mas o container não sobe.

```bash
NUM=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## `Schema validation: missing table/column` no boot

O Flyway não rodou antes da validação do Hibernate. Confirme que `FlywayConfig.java` existe e que `spring.flyway.enabled=false` está no `application.properties` — a configuração é manual de propósito, porque a auto-configuração do Spring Boot 4 não garante essa ordem.

Se a coluna faltante for `prioridade`, o caso é outro: alguém executou `flyway repair` sem aplicar a migration correspondente. Veja o [runbook](RUNBOOK-FIX-PRODUCAO.md).

---

## `OutOfMemory` ou container encerrado no Cloud Run

Os 512 MB padrão não comportam a JVM. Use `--memory 1Gi`.

---

## O frontend morre logo após `docker compose up -d`

O Vite escuta o stdin para atalhos de teclado e encerra quando ele fecha, o que acontece sempre em modo detached. O `docker-compose.yml` define `stdin_open` e `tty` para evitar isso.

Se alterar variáveis de ambiente, recrie o container — `restart` não as aplica:

```bash
docker compose up -d --force-recreate frontend-app
```

---

## Os relatórios em PDF desaparecem

`RELATORIO_PATH` grava no sistema de arquivos do container, que é efêmero no Cloud Run e é perdido a cada nova revisão. Combinado com o `fechar-expediente`, que remove os registros do dia após gerar o arquivo, o dado some por completo.

Correção definitiva: enviar os relatórios para o Cloud Storage e substituir a exclusão por arquivamento. Registrado no [backlog](ROTEIRO-PORTFOLIO.md).

---

## Erro 403 ao gerar o relatório

`fechar-expediente` exige papel `ADMIN`. O usuário `demo` é criado com `USER` justamente para não conseguir esvaziar a demonstração.
