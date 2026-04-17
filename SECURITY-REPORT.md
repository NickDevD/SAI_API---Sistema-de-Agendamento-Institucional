# Relatório de Vulnerabilidades — Projeto SAI

Data: 2026-04-17
Escopo: backend (Spring Boot + JWT + JPA + Flyway), frontend (React + Vite), Docker/Docker Compose.

> Observação: este relatório foi feito para um projeto pequeno/iniciante. Não fiz alterações no código; abaixo há evidências encontradas no repositório, descrição do risco, impacto e recomendações práticas e aplicáveis.

## Sumário executivo (breve)
- Principais riscos identificados: segredos fracos/defaults (JWT secret), seeders que criam admin automaticamente, armazenamento de token no frontend (localStorage), exposição/uso do Actuator sem proteção e dependências que merecem verificação de CVE/licença.
- Recomendações prioritárias (rápidas): garantir `JWT_SECRET` em ambiente seguro; remover/alterar seeder administrativo para não criar conta em produção; rodar scanner de dependências; revisar armazenamento do token no frontend.

---

## Metodologia
- Revisão estática dos arquivos principais: `backend/pom.xml`, `backend/src/main/resources/application.properties`, `backend/Dockerfile`, `docker-compose.yml`, `backend/src/main/java/**/SecurityConfigurations.java`, `TokenService.java`, `DefaultUserSeeder.java`, `src/main/resources/db/migration/*` e frontend `front/package.json`, `front/src/services/api.ts`.
- Identificação de configurações inseguras comuns: gestão de segredos, CORS/CSRF, armazenamento de tokens, exposição de endpoints, dependências.
- Classificação dos achados por severidade: Crítico / Alto / Médio / Baixo.

---

## Achados (com evidência, impacto e recomendações)

### Crítico

1) JWT secret com default inseguro / possibilidade de chave ausente
- Evidência:
  - `backend/src/main/resources/application.properties`
    - `api.security.token.secret=${JWT_SECRET:JWT_SECRET}`
  - `backend/src/main/java/com/devtec/sai/service/TokenService.java` usa `@Value("${api.security.token.secret}")` e `Algorithm.HMAC256(tokenKey)`.
- Impacto: assinaturas JWT fracas ou forjáveis, comprometimento de sessões e acesso indevido à API.
- Recomendações:
  - Nunca usar valor padrão fraco. Exigir `JWT_SECRET` através de variável de ambiente/secret manager no deploy (fail-fast se ausente).
  - Use secret forte (ex.: 32 bytes) ou um secret gerenciado (Vault / Azure Key Vault / AWS Secrets Manager).
  - Não commitar valores secretos nem colocá-los em arquivos versionados.

2) Seeder/migração que pode inserir admin com credenciais fornecidas de forma insegura
- Evidência:
  - `backend/src/main/java/com/devtec/sai/config/DefaultUserSeeder.java` (profile `dev`) obtém `DEFAULT_USER_PASSWORD` via `System.getenv` e cria `admin`.
  - `backend/src/main/resources/db/migration/V3__insert_admin_user.sql` tem placeholders `${ADMIN_LOGIN}`, `${ADMIN_PASSWORD_HASH}`.
- Impacto: criação automática de conta administrativa com senha fraca/no controle pode permitir acesso não autorizado.
- Recomendações:
  - Em ambientes de produção, não criar usuário admin automaticamente. Exigir processo manual de bootstrap ou criação via painel admin seguro.
  - Se seeder for mantido, validar que `DEFAULT_USER_PASSWORD` está setada e atende requisitos mínimos; não gravar senhas em repositório.
  - Armazenar apenas o hash (bcrypt) gerado fora do repositório e injete o hash via secrets se for necessário.

### Alto

3) Armazenamento do JWT em `localStorage` (risco de XSS)
- Evidência:
  - `front/src/services/api.ts`: `const token = localStorage.getItem('auth_token');` e depois adiciona `Authorization` header.
- Impacto: scripts maliciosos (XSS) no frontend podem ler o token e sequestrar sessões.
- Recomendações:
  - Preferir HttpOnly Secure cookies para tokens (evita acesso por JS). Se usar cookies, proteger com SameSite, Secure e usar HTTPS.
  - Se manter `localStorage` por simplicidade, mitigar XSS: aplicar Content Security Policy (CSP), revisar pontos onde `innerHTML`/dangerouslySetInnerHTML é usado, usar bibliotecas seguras e sanitização de inputs.

4) `spring-boot-starter-actuator` presente sem configuração explícita de proteção
- Evidência: `pom.xml` contém `spring-boot-starter-actuator`.
- Impacto: endpoints do actuator podem expor informações sensíveis (env, beans, metrics) se não forem protegidos.
- Recomendações:
  - Configurar exposição: `management.endpoints.web.exposure.include` apenas para endpoints necessários (ex.: health, prometheus).
  - Proteger endpoints com autenticação/roles em produção.

### Médio

5) CSRF desabilitado (contexto JWT) e sessão stateless
- Evidência: `SecurityConfigurations.java` faz `csrf(csrf -> csrf.disable())` e `sessionCreationPolicy(STATELESS)`.
- Impacto: desabilitar CSRF é aceitável para APIs stateless que não usam cookies, mas pode ser perigoso se for futuramente utilizada autenticação baseada em cookies.
- Recomendações:
  - Documentar a razão de desabilitar CSRF. Reabilitar se migrar para cookies. Se for usar cookies, habilitar proteção CSRF e tokens adequados.

6) CORS com allowCredentials(true) e origens específicas
- Evidência: `SecurityConfigurations.java` define `allowedOrigins` para `http://localhost:5173` e `https://sai-api-sistema-de-agendamento-inst.vercel.app` e `setAllowCredentials(true)`.
- Impacto: `allowCredentials(true)` combinado com origens largamente confiáveis pode expor cookies; no estado atual origens são explícitas (bom), mas manter controle é importante.
- Recomendações:
  - Se não usar cookies, setar `allowCredentials(false)` para clareza.
  - Gerenciar lista de origens por variável de ambiente por profile e evitar `*`.

7) TokenService: falta de validação do secret e tratamento silencioso de erros
- Evidência: `TokenService` chama `Algorithm.HMAC256(tokenKey)` sem checar `tokenKey` e em `getSubject` captura `JWTVerificationException` e retorna `""`.
- Impacto: problemas com chave vazia ou fraca não são detectados claramente; logs silenciosos dificultam detecção de ataque ou configuração errada.
- Recomendações:
  - Validar `tokenKey` no startup (tamanho mínimo) e falhar se estiver ausente.
  - Não logar tokens; logar tentativas de verificação inválida em nível apropriado.
  - Considerar adicionar `jti` e um mecanismo de revogação se for necessário invalidar tokens.

8) Dependências com potencial de CVE e preocupações de licença (iText)
- Evidência: `pom.xml` com `com.auth0:java-jwt:4.4.0`, `com.itextpdf:kernel/layout/io` (7.x/8.x), `org.flywaydb:10.16.0`, `org.springdoc:2.7.0`.
- Impacto: bibliotecas com vulnerabilidades conhecidas podem comprometer a aplicação; iText tem implicações de licença (AGPL/comercial).
- Recomendações:
  - Rodar ferramenta de verificação de dependências (OWASP Dependency-Check, Snyk, Dependabot) e aplicar upgrades para versões sem CVE.
  - Verificar compatibilidade de licença do iText; se AGPL é incompatível com o uso pretendido, considerar alternativas (ex.: OpenPDF, Apache PDFBox).

### Baixo / Observações

9) Docker Compose expõe porta do banco ao host
- Evidência: `docker-compose.yml` mapeia `${POSTGRES_PORT}:5432`.
- Recomendações: em produção, não exponha Postgres ao host; mantenha a rede do compose e revise firewall/segurança.

10) Frontend com URL `http://localhost:8080` como fallback
- Evidência: `front/src/services/api.ts` e `docker-compose.yml` usam `http://localhost:8080/api/v1`.
- Recomendações: usar HTTPS em produção e definir `VITE_API_BASE_URL` por environment no deploy.

11) Logs/prints de stacktrace no seeder
- Evidência: `DefaultUserSeeder` usa `System.err.println` e `e.printStackTrace()`.
- Recomendações: usar logger com níveis e não imprimir stacktraces contendo informações sensíveis em produção.

---

## Checklist prático (ordem sugerida)
1. (Crítico) Configurar `JWT_SECRET` forte e garantir que a aplicação falhe se não for setado corretamente no ambiente de produção.
2. (Crítico) Revisar `DefaultUserSeeder`/migrations para evitar criação automática de admin em produção; documentar fluxo de bootstrap manual.
3. (Alto) Revisar armazenamento de tokens no frontend; planejar migração para HttpOnly cookies ou endurecer proteção contra XSS.
4. (Médio) Executar scanner de dependências (OWASP Dependency-Check / Snyk / npm audit) e corrigir CVEs.
5. (Médio) Configurar proteção dos endpoints do Actuator e revisão de exposições em `application-prod.properties`.
6. (Baixo) Ajustes no Docker Compose para não expor Postgres ao host em produção, e garantir HTTPS.

---

## Comandos e ferramentas sugeridas (PowerShell / Windows)
- Dependency-Check para Java (maven plugin):
```powershell
cd backend
mvn org.owasp:dependency-check-maven:check
```
- Ver árvore de dependências Maven:
```powershell
cd backend
mvn dependency:tree
```
- Rodar testes (Windows):
```powershell
cd backend
mvnw.cmd test
```
- Frontend: audit npm:
```powershell
cd front
npm install
npm audit --audit-level=moderate
```
- Procurar possíveis segredos no repositório:
```powershell
Select-String -Path * -Pattern "JWT_SECRET|PASSWORD|SECRET|API_KEY|PRIVATE_KEY" -SimpleMatch -List
```

---

## Recursos úteis
- OWASP Dependency-Check: https://owasp.org/www-project-dependency-check/
- OWASP Top Ten / Cheat Sheets: https://cheatsheetseries.owasp.org/
- Spring Security: https://spring.io/projects/spring-security
- CSP guide (MDN): https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP

---

## Observações finais
- Pontos positivos já presentes: uso de BCrypt (`PasswordEncoder`), tentativa de rodar seeder apenas em `@Profile("dev")`, uso de usuário não-root na imagem Docker (`USER appuser`).
- Priorize segredos, seeders e escaneamento de dependências. Para um projeto de iniciante essas mudanças trazem enorme melhoria de segurança com esforço moderado.

---

Se quiser, eu posso:
- Gerar um `application-prod.properties.example` com sugestões seguras (arquivo de exemplo, sem alterar código). 
- Executar os scanners (`mvn dependency-check` e `npm audit`) no workspace e anexar os relatórios.
- Criar um checklist de CI (GitHub Actions) que falhe quando `JWT_SECRET` não estiver configurado e rode dependency-check.

Diga qual opção prefere e eu executo o próximo passo.

