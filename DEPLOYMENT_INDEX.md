# 📚 Índice Completo de Documentação de Deploy - SAI

> Sistema de Agendamento Institucional - Documentação Centralizada

---

## 📋 Sumário dos Documentos

Este repositório contém 4 documentos completos sobre deploy. Leia-os na seguinte ordem:

### **1. 🌐 DEPLOY_COMPARISON.md** (Começar aqui!)
   - **O quê**: Comparação entre RENDER e AWS
   - **Para quem**: Decisão de qual plataforma usar
   - **Tempo de leitura**: ~15 minutos
   - **Conteúdo**:
     - Tabela comparativa (preço, performance, segurança)
     - Recomendações por caso de uso
     - Matriz de decisão
     - Guia de migração RENDER → AWS
   - ⭐ **RECOMENDADO**: Leia primeiro para entender as diferenças

### **2. 🚀 DEPLOY_RENDER.md** (Se escolheu RENDER)
   - **O quê**: Guia passo a passo para Render
   - **Para quem**: Startups e MVPs com orçamento limitado
   - **Tempo de leitura**: ~45 minutos
   - **Conteúdo**:
     - Setup completo do Render
     - Configuração banco de dados PostgreSQL
     - Deploy Backend e Frontend
     - CORS, monitoramento, troubleshooting
   - ✅ **Mais fácil**: Ideal para quem quer setup rápido

### **3. ☁️ DEPLOY_AWS.md** (Se escolheu AWS)
   - **O quê**: Guia arquitetura e deploy na AWS
   - **Para quem**: Empresas com requisitos enterprise
   - **Tempo de leitura**: ~1 hora (complexo)
   - **Conteúdo**:
     - Arquitetura AWS (ECS, RDS, ALB, ECR)
     - Setup passo a passo de cada serviço
     - Build Docker e push para ECR
     - Auto scaling, monitoramento CloudWatch
   - ⚙️ **Mais complexo**: Oferece controle total

### **4. 🔐 CORS_CONFIGURATION.md** (Para ambos)
   - **O quê**: Configuração CORS (Cross-Origin Resource Sharing)
   - **Para quem**: Qualquer um que faça deploy
   - **Tempo de leitura**: ~20 minutos
   - **Conteúdo**:
     - Explicação do que é CORS
     - Configuração por ambiente (dev/staging/prod)
     - Como testar CORS
     - Erros comuns e soluções
     - Segurança e boas práticas

---

## 🗺️ Fluxo de Decisão Rápido

```
Você precisa fazer deploy da SAI?
│
├─ Nunca fiz deploy antes?
│  └─ SIM → Leia DEPLOY_COMPARISON.md primeiro
│
├─ Orçamento < $50/mês?
│  ├─ SIM → Use RENDER (leia DEPLOY_RENDER.md)
│  └─ NÃO → Continue abaixo
│
├─ Precisa de compliance/multinível?
│  ├─ SIM → Use AWS (leia DEPLOY_AWS.md)
│  └─ NÃO → Use RENDER (mais simples)
│
├─ Já começou em RENDER mas quer escalar?
│  └─ Leia DEPLOY_COMPARISON.md → Seção "Migração"
│
└─ Problemas com frontend não conseguindo chamar backend?
   └─ Leia CORS_CONFIGURATION.md
```

---

## 🎯 Estrutura de Arquivos do Projeto

```
SAI_API/
│
├── 📚 DOCUMENTAÇÃO (novos)
│   ├── DEPLOY_RENDER.md           ← Deploy em Render
│   ├── DEPLOY_AWS.md              ← Deploy em AWS
│   ├── DEPLOY_COMPARISON.md       ← Comparação Render vs AWS
│   └── CORS_CONFIGURATION.md      ← Configuração CORS
│
├── 📁 backend/                    (Spring Boot + Java 21)
│   ├── src/main/
│   │   ├── java/com/devtec/sai/
│   │   │   ├── controller/        ← REST Endpoints
│   │   │   ├── service/           ← Lógica de negócios
│   │   │   ├── repository/        ← Acesso DB (JPA)
│   │   │   ├── model/             ← @Entity classes
│   │   │   ├── dto/               ← Data Transfer Objects
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfigurations.java  ← CORS + Security
│   │   │   │   └── SwaggerConfig.java           ← Swagger UI
│   │   │   ├── exception/         ← Custom exceptions
│   │   │   └── util/              ← Helpers
│   │   └── resources/
│   │       ├── application.properties              ← Config base
│   │       ├── application-dev.properties          ← Dev local
│   │       └── db/migration/                       ← Flyway SQL scripts
│   ├── pom.xml                    ← Maven dependencies
│   ├── Dockerfile                 ← Multi-stage build
│   └── mvnw / mvnw.cmd           ← Maven wrapper
│
├── 📁 front/                      (React + TypeScript)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── AgendamentoPage.tsx
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.ts             ← Axios client
│   │   ├── theme/
│   │   │   └── theme.ts           ← Material UI
│   │   └── assets/
│   ├── package.json               ← NPM dependencies
│   ├── vite.config.ts             ← Vite build config
│   ├── Dockerfile                 ← Production build
│   └── Dockerfile.prod            ← Nginx + SPA routing
│
├── docker-compose.yml             ← Local development
├── README.md                      ← Documentação geral
└── .gitignore                     ← Deve incluir: .env, node_modules/, target/
```

---

## 🚀 Guia Rápido: Começar do Zero

### **Passo 1: Decisão (5 min)**

```bash
# Leia o sumário do DEPLOY_COMPARISON.md
# Use a matriz de decisão para escolher Render ou AWS
```

### **Passo 2: Preparação Local (10 min)**

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/SAI_API.git
cd SAI_API

# Crie arquivo .env (LOCAL ONLY - não commit!)
cat > .env << EOF
JWT_SECRET=sua_chave_super_secreta_minimo_32_caracteres_aleatorios_123456789
POSTGRES_USER=saiuser
POSTGRES_PASSWORD=sua_senha_secreta_123456
POSTGRES_DB_NAME=sai_agendamento
VITE_API_URL=http://localhost:8080/api/v1
EOF

# Teste localmente
docker-compose up
# Acesse: http://localhost:5173 (Frontend)
# Acesse: http://localhost:8080/swagger-ui.html (API)
```

### **Passo 3: Deploy (30-60 min)**

**Se escolheu RENDER:**
```bash
1. Leia DEPLOY_RENDER.md (seções 1-4)
2. Siga todos os passos da FASE 1 até FASE 4
3. ~30 minutos para estar online
```

**Se escolheu AWS:**
```bash
1. Leia DEPLOY_AWS.md (seções 1-8)
2. Siga todos os passos da FASE 1 até FASE 8
3. ~1-2 horas para estar online
```

### **Passo 4: Validação (5 min)**

```bash
# Teste os endpoints
curl https://seu-api.onrender.com/actuator/health
curl https://seu-api.amazonaws.com/actuator/health

# Abra no navegador o frontend e teste login/agendamento
```

---

## 📋 Checklist: O que Precisa Estar Configurado

### **Obrigatório para QUALQUER deploy:**

```bash
✅ Java 21 JDK instalado
✅ Node.js 18+ LTS instalado
✅ Git configurado
✅ Repositório GitHub com código
✅ .env criado LOCALMENTE (não commitado)
✅ docker-compose.yml funcional
✅ Migrations Flyway presentes em db/migration/
✅ SecurityConfigurations.java com CORS configurado
✅ Backend roda em http://localhost:8080
✅ Frontend roda em http://localhost:5173
✅ Testes locais passando
```

### **Para RENDER:**

```bash
✅ Conta Render criada
✅ GitHub conectado ao Render
✅ PostgreSQL Database criado
✅ 2 Web Services criados (backend + frontend)
✅ Variáveis de ambiente definidas
✅ Auto-deploy via webhook GitHub
```

### **Para AWS:**

```bash
✅ Conta AWS criada
✅ AWS CLI configurado
✅ Docker instalado localmente
✅ ECR repositories criados
✅ RDS PostgreSQL criado
✅ ECS Cluster criado
✅ Task Definitions criadas
✅ ALB criado e configurado
✅ Security Groups configurados
✅ CloudWatch Logs prontos
```

---

## 🔗 Arquivos que PRECISAM de Mudanças por Ambiente

### **Para RENDER**

| Arquivo | O quê mudar | Onde |
|---------|-----------|------|
| `backend/src/main/resources/application.properties` | Adicionar `spring.profiles.active=prod` | Nova linha |
| `backend/src/main/java/com/devtec/sai/config/SecurityConfigurations.java` | Adicionar domínio Render em `setAllowedOrigins()` | Linha ~59-61 |
| `.env` (LOCAL) | Definir `VITE_API_URL=https://sai-backend.onrender.com/api/v1` | Novo |
| `docker-compose.yml` | Verificar variáveis de ambiente | Linhas ~9-11 |
| `.gitignore` | Garantir que `.env` está listado | Adicione se falta |

### **Para AWS**

| Arquivo | O quê mudar | Onde |
|---------|-----------|------|
| `backend/src/main/resources/application.properties` | Adicionar variáveis de database | Linhas 2-4 |
| `backend/Dockerfile` | Já está otimizado (multi-stage) | Nenhuma mudança |
| `front/Dockerfile` | Criar versão de produção | Novo `Dockerfile.prod` |
| `backend/src/main/java/com/devtec/sai/config/SecurityConfigurations.java` | Adicionar domínios AWS em `setAllowedOrigins()` | Linha ~59-61 |
| `front/vite.config.ts` | Nenhuma mudança necessária | - |
| `.env` (LOCAL) | Adicionar `DATABASE_URL` com endpoint RDS | Novo |

---

## ⚠️ Erros Comuns & Soluções

### **"Connection refused" - Banco de dados**

**Causa**: String de conexão incorreta ou banco não rodando

**Verificar**:
```bash
# RENDER
- RDS Database status é "Available"?
- Credenciais corretas em Environment Variables?
- Usando URL INTERNA (não externa)?

# AWS
- RDS Instance está rodando?
- Security Group permite porta 5432?
- ECS Task consegue comunicar com RDS?
```

### **CORS Error - "No Access-Control-Allow-Origin"**

**Causa**: Domínio do frontend não autorizado no CORS

**Solução**:
```java
// Em SecurityConfigurations.java, adicione seu domínio
configuration.setAllowedOrigins(Arrays.asList(
    "https://seu-frontend-dominio.com"  // ← ADICIONAR
));
```

Depois faça redeploy (Render auto-redeploy, AWS exige rebuild Docker)

### **"Access Denied" - Credenciais AWS**

**Causa**: Credenciais AWS expiradas ou sem permissões

**Solução**:
```bash
# Regenerar credenciais
aws configure

# Ou gerar novo token
aws sts get-session-token
```

### **Frontend não consegue chamar Backend**

**Causas possíveis**:
1. VITE_API_URL incorreta
2. Backend não está respondendo
3. CORS não configurado
4. Network/Firewall bloqueando

**Debug**:
```bash
# 1. Abra DevTools (F12) do navegador
# 2. Vá para Network tab
# 3. Tente fazer login
# 4. Veja requisição falhada → Response → Erro específico
```

---

## 📊 Estimativa de Tempo

| Tarefa | RENDER | AWS |
|--------|--------|-----|
| Preparação inicial | 10 min | 20 min |
| Setup banco dados | 5 min | 15 min |
| Deploy backend | 10 min | 30 min |
| Deploy frontend | 5 min | 20 min |
| Configurar domínio | 5 min | 20 min |
| Testes & validação | 10 min | 20 min |
| **TOTAL** | **~45 min** | **~2 horas** |

---

## 🎯 Próximos Passos Após Deploy

### **1. Verificar Logs**

```bash
# RENDER
- Dashboard → Serviço → Logs tab

# AWS
- CloudWatch → Log Groups
- aws logs tail /ecs/sai-backend --follow
```

### **2. Monitorar Performance**

```bash
# RENDER
- Dashboard → Metrics

# AWS
- CloudWatch → Dashboards
- RDS Performance Insights
```

### **3. Configurar Alertas**

```bash
# RENDER
- Settings → Notifications

# AWS
- CloudWatch → Alarms
- SNS para email/SMS
```

### **4. Backup & Disaster Recovery**

```bash
# RENDER
- Database → Backups (automático)

# AWS
- RDS → Snapshots
- Configurar retenção 30 dias
```

### **5. Scaling (quando necessário)**

```bash
# RENDER
- Upgrade plano (manual)

# AWS
- Configure Auto Scaling policies
- Ajuste min/max tasks
```

---

## 📞 Referências Rápidas

### **Documentação Oficial**
- [Render Docs](https://render.com/docs)
- [AWS ECS Docs](https://docs.aws.amazon.com/AmazonECS/)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [React Docs](https://react.dev)

### **Comunidade & Suporte**
- Stack Overflow: Tag `render-com` ou `amazon-aws`
- Reddit: r/devops, r/aws, r/Spring
- Discord: Comunidades Spring Boot, React

### **Tools Úteis**
- **Postman**: Teste endpoints
- **pgAdmin**: Gerenciar banco PostgreSQL
- **AWS CLI**: Automação AWS
- **Docker Desktop**: Testes locais

---

## 🎓 Recursos de Aprendizado

### **Entender CORS**
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Spring: CORS Support](https://spring.io/guides/gs/rest-service-cors/)

### **Docker & Containerização**
- [Docker Official Docs](https://docs.docker.com)
- [Docker for Java Developers](https://spring.io/guides/topicals/spring-boot-docker/)

### **JWT & Segurança**
- [JWT.io: Introduction](https://jwt.io/introduction)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

### **Cloud Concepts**
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [The Twelve-Factor App](https://12factor.net/)

---

## ✅ Checklist Final Pré-Deploy

```
REPOSITÓRIO
  ☑ Código commitado em main
  ☑ .gitignore inclui .env, node_modules/, target/
  ☑ README.md atualizado

BACKEND
  ☑ pom.xml com todas as dependências
  ☑ application.properties configurado
  ☑ SecurityConfigurations.java com CORS
  ☑ Migrations Flyway presentes
  ☑ mvnw/mvnw.cmd presentes
  ☑ Dockerfile multi-stage otimizado
  ☑ Testes passando localmente

FRONTEND
  ☑ package.json com todas as dependências
  ☑ vite.config.ts configurado
  ☑ src/services/api.ts com URL correta
  ☑ Dockerfile para produção pronto
  ☑ npm run build funciona
  ☑ Testes passando localmente

VARIÁVEIS DE AMBIENTE
  ☑ JWT_SECRET definido (~32 caracteres)
  ☑ POSTGRES_* configurados
  ☑ VITE_API_URL definido
  ☑ .env criado LOCALMENTE (não commitado)

SEGURANÇA
  ☑ Nenhum secret hardcoded
  ☑ .env não está no Git
  ☑ CORS restritivo (não permite *)
  ☑ HTTPS/TLS habilitado
  ☑ Passwords encriptados (BCrypt)

DOCUMENTAÇÃO
  ☑ README.md completo
  ☑ DEPLOY_RENDER.md lido (se Render)
  ☑ DEPLOY_AWS.md lido (se AWS)
  ☑ CORS_CONFIGURATION.md lido
  ☑ Plano de backup documentado
```

---

## 🎉 Sucesso!

Quando tudo estiver funcionando:

✅ Frontend accessible em seu domínio  
✅ Backend respondendo a requisições  
✅ Banco de dados conectado e migrado  
✅ Autenticação JWT funcionando  
✅ Logs sendo capturados  
✅ Alertas configurados  

---

**Documentação atualizada em**: Abril de 2026  
**Versão do Projeto**: 0.0.1-SNAPSHOT  
**Java**: 21  
**Spring Boot**: 3.5.8  
**React**: 18.2  
**Node**: 20+  
**PostgreSQL**: 16  

**Contribuído por**: Nicholas (DevTec)  
**Status**: ✅ Production Ready  

---

Para dúvidas, consulte os documentos específicos ou a documentação oficial das plataformas.

**Boa sorte! 🚀**


