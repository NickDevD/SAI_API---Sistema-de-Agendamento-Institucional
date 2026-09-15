# Runbook — subir o backend em produção (503 / Flyway V3)

> **Não consegui executar isto por você.** Esta máquina não tem `gcloud`, Firebase CLI nem
> Flyway CLI instalados, e não há credenciais do GCP configuradas (`credentials.db` ausente).
> Os comandos abaixo precisam ser rodados por você, numa máquina autenticada no projeto.

**O procedimento foi testado de ponta a ponta no ambiente local**, reproduzindo o estado que
a produção provavelmente tem. O resultado dos testes está na seção final.

---

## ⚠️ Leia antes: `flyway repair` sozinho NÃO resolve

Este é o ponto mais importante do documento.

O `repair` corrige o **histórico** do Flyway (checksum e descrição), mas **não executa**
nenhuma migration. Como o `V3` novo (`ALTER TABLE ... ADD COLUMN prioridade`) nunca chegou a
rodar naquele banco, depois do repair o Flyway passa a considerá-lo aplicado — e a coluna
continua não existindo.

Aí o Hibernate, que roda com `ddl-auto=validate`, falha no boot:

```
Schema validation: missing column [prioridade] in table [tb_agendamentos]
```

**Testei exatamente isso localmente: o backend continuou morrendo, só que com outro erro.**
O 503 permaneceria.

São necessários **dois passos**: `repair` **e** o `ALTER TABLE`.

---

## Passo 0 — Confirmar o diagnóstico (não pule)

Tudo aqui parte da hipótese de que a produção está no mesmo estado do ambiente local.
**Confirme antes de escrever no banco.**

```bash
gcloud config set project sai-agendamento-institucional
```

```bash
gcloud run services logs read backend-api --region us-central1 --limit 200 | grep -i "checksum\|Validate failed\|missing column"
```

| O que aparecer | Significado | O que fazer |
|----------------|-------------|-------------|
| `Migration checksum mismatch for migration version 3` | Diagnóstico confirmado | Siga o runbook |
| `missing column [prioridade]` | Alguém já rodou o repair | Pule para o **Passo 3** |
| `Connection refused` / `timeout` | O problema é o banco, não o Flyway | Reative a instância primeiro |
| Nada disso | **Pare.** A causa é outra | Leia o log inteiro antes de agir |

Confirme também o estado real do histórico, conectando no banco de produção:

```sql
SELECT version, description, checksum, installed_on, success
  FROM flyway_schema_history ORDER BY installed_rank;
```

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'tb_agendamentos' AND column_name = 'prioridade';
```

O cenário esperado é `V3 = insert admin user` no histórico e a segunda consulta **vazia**.

---

## Passo 1 — Backup

Não pule isto. Os passos seguintes escrevem no banco.

```bash
pg_dump "postgresql://USUARIO:SENHA@HOST:5432/agendamento_db" > backup-pre-fix-$(date +%F).sql
```

Se for Cloud SQL, prefira o backup nativo:

```bash
gcloud sql backups create --instance=NOME_DA_INSTANCIA
```

---

## Passo 2 — `flyway repair`

Sem instalar nada, pela imagem oficial. Rode a partir da **raiz do repositório**:

```bash
docker run --rm -v "$PWD/backend/src/main/resources/db/migration:/flyway/sql" flyway/flyway:10 -url="jdbc:postgresql://HOST:5432/agendamento_db" -user="USUARIO" -password="SENHA" repair
```

No **PowerShell**, troque `$PWD` por `${PWD}`:

```powershell
docker run --rm -v "${PWD}/backend/src/main/resources/db/migration:/flyway/sql" flyway/flyway:10 -url="jdbc:postgresql://HOST:5432/agendamento_db" -user="USUARIO" -password="SENHA" repair
```

**Confira a saída.** Ela precisa conter a linha de repair da versão 3:

```
Repairing Schema History table for version 3 (Description: adicionar prioridade agendamentos, ...)
```

> ⚠️ **Armadilha que eu caí no teste:** se o volume não for montado corretamente, o Flyway
> emite `WARNING: No locations configured and default location 'sql' not found`, diz
> **"Successfully repaired"** e **não faz nada**. A mensagem de sucesso não garante que
> funcionou — confirme a linha `Repairing Schema History table for version 3`.
> No Git Bash, prefixe com `MSYS_NO_PATHCONV=1` e use o caminho absoluto no estilo Windows.

Se o banco não for acessível pela internet (Cloud SQL com IP privado), rode antes o
[Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) e
aponte a URL para `127.0.0.1`.

---

## Passo 3 — Criar a coluna que a migration nunca aplicou

É o mesmo SQL do `V3__adicionar_prioridade_agendamentos.sql`, e é idempotente:

```sql
ALTER TABLE tb_agendamentos
    ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
```

> Os agendamentos que já existem ficam com `prioridade = 'NORMAL'`. Isso é o esperado —
> a coluna nunca existiu, então não há informação de prioridade a preservar.

---

## Passo 4 — Reiniciar o Cloud Run

O container só relê o schema no boot:

```bash
gcloud run services update backend-api --region us-central1 --no-traffic --tag=fix
```

Ou, mais simples, force uma nova revisão:

```bash
gcloud run deploy backend-api --region us-central1 --image us-central1-docker.pkg.dev/sai-agendamento-institucional/sai/backend:latest
```

---

## Passo 5 — Verificar

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://backend-api-301612765087.us-central1.run.app/actuator/health
```

Esperado: **200**. (Só funciona com a liberação do `/actuator/health` feita na v1.3.0 —
se o backend em produção ainda for uma imagem antiga, esta rota dá 403; use o teste abaixo.)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"login\":\"x\",\"senha\":\"x\"}" https://backend-api-301612765087.us-central1.run.app/auth/login
```

| Código | Significado |
|--------|-------------|
| **401** | ✅ Funcionou — a API está no ar e rejeitou a senha errada |
| 503 | Ainda não sobe — leia os logs de novo |
| 500 | Subiu, mas a imagem é antiga (controller sem tratamento de `BadCredentialsException`) |

---

## Evitar que aconteça de novo

O `V3` foi reaproveitado para duas migrations diferentes. Para não repetir:

1. **Migration aplicada é imutável.** Nunca edite um `.sql` que já rodou em qualquer
   ambiente, nem reaproveite um número de versão. Crie sempre a próxima.
2. **A próxima migration deve ser `V4`.** Confirme com
   `SELECT max(version) FROM flyway_schema_history` antes de criar.
3. Considere adicionar `spring.flyway.validate-on-migrate=true` de forma explícita e
   **testar o boot contra uma cópia do banco de produção** antes de cada deploy. Este
   incidente teria sido pego em 30 segundos assim.

---

## Resultado do teste local

Reproduzi o estado suspeito da produção (histórico com `V3 = insert admin user`, sem a coluna
`prioridade`) e executei o procedimento:

| Etapa | Resultado |
|-------|-----------|
| Estado inicial reproduzido | `Migration checksum mismatch for migration version 3` — backend morre |
| `flyway repair` isolado | Histórico corrigido, mas backend **continua morrendo**: `missing column [prioridade]` |
| `repair` + `ALTER TABLE` | ✅ Backend sobe em ~27 s, `/actuator/health` = `UP`, login = 401 |
| Dados após a correção | ✅ Os 5 agendamentos preservados |

É por isso que o runbook tem os dois passos.
