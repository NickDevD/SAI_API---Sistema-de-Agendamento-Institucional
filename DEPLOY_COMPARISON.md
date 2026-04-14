# 🌐 Comparativo: RENDER vs AWS | Boas Práticas de Deploy

## 📊 Comparação de Plataformas

### **1. Facilidade de Uso**

| Aspecto | RENDER | AWS |
|--------|--------|-----|
| **Setup Inicial** | ⭐⭐⭐⭐⭐ Muito fácil | ⭐⭐⭐ Complexo |
| **Curva de Aprendizado** | Rápida (~1 hora) | Lenta (~1 semana) |
| **Integração GitHub** | Automática via webhook | Requer manual ou CodePipeline |
| **Documentação** | Boa e simples | Excelente mas volumosa |
| **Suporte** | Chat comunitário | Comunidade grande + AWS Support |
| **Dashboard** | Intuitivo | Muito complexo |

### **2. Preço**

| Serviço | RENDER | AWS |
|---------|--------|-----|
| **Backend (2 CPU, 2GB RAM)** | $12/mês | $35/mês |
| **Frontend (1 CPU, 512MB RAM)** | $7/mês | $35/mês |
| **Database (PostgreSQL)** | $7/mês (mini) | $25/mês |
| **Armazenamento** | Grátis | ~$10/mês |
| **TOTAL (mínimo)** | **~$26/mês** | **~$100/mês** |
| **TOTAL (recomendado)** | **~$50/mês** | **~$150/mês** |

> ⚠️ AWS oferece tier gratuito por 12 meses (alguns serviços ilimitados)

### **3. Performance & Escalabilidade**

| Aspecto | RENDER | AWS |
|--------|--------|-----|
| **Tempo de Cold Start** | 20-30s | 5-10s |
| **Latência** | 100-150ms | 20-50ms |
| **Auto Scaling** | Manual (upgrade plano) | Automático via políticas |
| **Regiões Disponíveis** | ~5 regiões | 30+ regiões |
| **Load Balancer** | Incluído | Cobrado separadamente |
| **CDN** | Não | CloudFront (~$0.085/GB) |

### **4. Recursos & Funcionalidades**

| Recurso | RENDER | AWS |
|---------|--------|-----|
| **HTTPS/SSL** | ✅ Grátis | ✅ Grátis (ACM) |
| **Environment Variables** | ✅ Sim | ✅ Sim (Secrets Manager) |
| **Logs Centralizados** | ✅ Web UI | ✅ CloudWatch |
| **Health Checks** | ✅ Automático | ✅ Configurável |
| **CI/CD Pipeline** | ❌ Não (auto-deploy via GitHub) | ✅ CodePipeline/CodeBuild |
| **Database Backup** | ✅ Automático | ✅ Automático + On-demand |
| **VPC/Networking** | ❌ Não | ✅ Completo |
| **Monitoramento** | ✅ Básico | ✅ Avançado (CloudWatch) |
| **Alertas** | ✅ Email/Slack | ✅ SNS/Email/Slack |

### **5. Segurança**

| Aspecto | RENDER | AWS |
|--------|--------|-----|
| **HTTPS por Padrão** | ✅ Sim | ✅ Sim (necessário configurar) |
| **Encryption at Rest** | ✅ Padrão | ✅ Opcional (KMS) |
| **Encryption in Transit** | ✅ Sim | ✅ Sim |
| **VPC Isolation** | ❌ Compartilhado | ✅ Totalmente isolado |
| **Compliance** | ✅ GDPR | ✅ SOC 2, HIPAA, PCI-DSS |
| **IAM Roles** | ❌ Não | ✅ Sim |
| **Secrets Management** | ✅ Environment Vars | ✅ AWS Secrets Manager |

### **6. Recuperação de Desastres**

| Aspecto | RENDER | AWS |
|--------|--------|-----|
| **RTO (Recovery Time Objective)** | ~5 minutos | ~1 minuto |
| **RPO (Recovery Point Objective)** | ~1 dia | ~15 minutos |
| **Multi-region Failover** | ❌ Não | ✅ Sim |
| **Backup Automático** | ✅ Diário | ✅ Configurável |
| **Backup Retention** | ~30 dias | Ilimitado |
| **Data Export** | ✅ SQL dump | ✅ RDS snapshots |

---

## 🎯 Recomendações por Caso de Uso

### **Use RENDER quando:**

✅ Projeto pequeno/médio  
✅ Orçamento limitado  
✅ Precisa de setup rápido  
✅ Equipe inexperiente em cloud  
✅ Desenvolvimento/Staging  
✅ Prototipagem rápida  
✅ Startup com MVP  
✅ Tráfego previsível (<1M requisições/mês)  

**Exemplo**: SAI em fase inicial, para validar mercado

---

### **Use AWS quando:**

✅ Aplicação de grande escala  
✅ Requisitos de compliance (HIPAA, SOC2)  
✅ Múltiplas regiões geográficas  
✅ Alta disponibilidade crítica  
✅ Máximo controle/customização  
✅ Empresa maior com TI dedicada  
✅ Integração com outros serviços AWS  
✅ Tráfego >10M requisições/mês  

**Exemplo**: SAI em produção corporativa com SLA 99.9%

---

## 📁 Estrutura de Arquivos Necessários

### **Arquivos OBRIGATÓRIOS em ambos os deploys**

```
SAI_API/
├── .env                          ⚠️ NUNCA commitar (adicionar ao .gitignore)
├── .gitignore                    ✅ Bloquear .env, node_modules, target/
│
├── backend/
│   ├── pom.xml                   ✅ Dependências Maven
│   ├── Dockerfile                ✅ Multi-stage build
│   ├── mvnw / mvnw.cmd          ✅ Maven wrapper
│   ├── src/main/resources/
│   │   ├── application.properties           ✅ Configuração base
│   │   ├── application-prod.properties      ✅ Perfil produção
│   │   └── db/migration/
│   │       ├── V1__criar_tabela_agendamentos.sql
│   │       ├── V2__criar_tabela_usuarios.sql
│   │       └── V3__insert_admin_user.sql
│   └── src/main/java/com/devtec/sai/
│       ├── config/SecurityConfigurations.java  ✅ CORS + JWT
│       ├── controller/
│       ├── service/
│       ├── repository/
│       └── model/
│
├── front/
│   ├── package.json              ✅ Dependências npm
│   ├── Dockerfile                ✅ Produção (ou Dockerfile.prod)
│   ├── vite.config.ts            ✅ Build configuration
│   ├── tsconfig.json             ✅ TypeScript config
│   ├── .env.production           ⚠️ VITE_API_URL da API
│   └── src/
│       ├── services/api.ts       ✅ Axios client
│       ├── pages/
│       └── components/
│
├── docker-compose.yml            ✅ Orquestração local
├── README.md                     ✅ Documentação
├── DEPLOY_RENDER.md              ✅ Este arquivo
└── DEPLOY_AWS.md                 ✅ Este arquivo
```

---

## 🔧 Checklist de Configuração por Ambiente

### **LOCAL (docker-compose)**

```bash
✅ .env criado na raiz com todas as variáveis
✅ docker-compose.yml atualizado
✅ Banco PostgreSQL iniciado (docker-compose up)
✅ Migrations rodadas automaticamente via Flyway
✅ Backend acessível em http://localhost:8080
✅ Frontend acessível em http://localhost:5173
✅ Swagger disponível em http://localhost:8080/swagger-ui.html
✅ Login funcionando com credenciais de admin
```

### **RENDER**

```bash
✅ Repositório GitHub com código
✅ Banco de dados PostgreSQL criado
✅ Backend Web Service criado com Environment Variables
✅ Frontend Web Service criado com VITE_API_URL
✅ CORS configurado para domínio do frontend
✅ SSL/HTTPS funcionando automaticamente
✅ Deploy bem-sucedido (status: Live)
✅ Health check passando (/actuator/health)
✅ Logs acessíveis no dashboard
✅ Auto-deploy configurado via webhook GitHub
```

### **AWS**

```bash
✅ Conta AWS criada e configurada
✅ Variáveis em AWS Secrets Manager
✅ RDS PostgreSQL criado e disponível
✅ ECR repositories criados
✅ Imagens Docker buildadas e pushadas
✅ ECS Cluster criado
✅ Task Definitions criadas e testadas
✅ ALB criado e listeners configurados
✅ ECS Services rodando com 2+ tasks
✅ Health checks passando
✅ CloudWatch Logs capturando output
✅ Security Groups permite traffic correto
✅ Auto Scaling policies configuradas
✅ Monitoramento e alertas ativos
```

---

## 🚀 Procedimento de Migração (RENDER → AWS)

Se começou em RENDER e quer migrar para AWS:

### **Fase 1: Preparação (AWS)**

```bash
# 1. Criar RDS PostgreSQL
# 2. Criar ECR repositories
# 3. Criar ECS Cluster + Task Definitions
# 4. Criar ALB com listeners
# 5. Criar ECS Services
```

### **Fase 2: Migração de Dados**

```bash
# 1. Backup do banco RENDER
# Render Dashboard → Database → Backup

# 2. Restaurar em AWS RDS
aws s3 cp s3://seu-bucket/backup.sql /tmp/
psql -h aws-rds-endpoint.amazonaws.com -U saiuser -d sai_agendamento < /tmp/backup.sql

# 3. Validar dados
SELECT COUNT(*) FROM tb_agendamentos;
SELECT COUNT(*) FROM tb_usuarios;
```

### **Fase 3: Deploy em AWS**

```bash
# 1. Build e push de imagens
docker build -t sai-backend:aws-v1 ./backend
docker tag sai-backend:aws-v1 <account>.dkr.ecr.region.amazonaws.com/sai-backend:v1
docker push <account>.dkr.ecr.region.amazonaws.com/sai-backend:v1

# 2. Atualizar Task Definition com nova imagem

# 3. Deploy Service
aws ecs update-service \
  --cluster sai-cluster \
  --service sai-backend-service \
  --task-definition sai-backend-task:2 \
  --force-new-deployment

# 4. Monitorar deployment
aws ecs describe-services --cluster sai-cluster --services sai-backend-service
```

### **Fase 4: Testes & Validação**

```bash
# 1. Testar endpoints
curl -X GET https://sai-backend-alb.amazonaws.com/actuator/health

# 2. Testar login
curl -X POST https://sai-api.seu-dominio.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}'

# 3. Testar agendamentos
curl -X GET https://sai-api.seu-dominio.com/api/v1/agendamentos \
  -H "Authorization: Bearer $TOKEN"
```

### **Fase 5: DNS & Cutover**

```bash
# 1. Apontar DNS para ALB do AWS
# No seu DNS provider:
# api.seu-dominio.com -> ALB DNS name

# 2. Aguardar propagação DNS (~24h)
nslookup api.seu-dominio.com

# 3. Decommission do RENDER (opcional)
# Render Dashboard → Services → Delete
```

---

## 📊 Matriz de Decisão

Responda as perguntas abaixo e siga as setas:

```
1. Orçamento < $50/mês?
   ├─ SIM → RENDER ✅
   └─ NÃO → Questão 2

2. Precisa de compliance (SOC2, HIPAA)?
   ├─ SIM → AWS ✅
   └─ NÃO → Questão 3

3. Equipipe tech pode gerenciar cloud?
   ├─ SIM (DevOps/Cloud Engineers) → AWS ✅
   └─ NÃO (Startup/Pequena empresa) → RENDER ✅

4. Tráfego esperado > 10M reqs/mês?
   ├─ SIM → AWS ✅
   └─ NÃO → RENDER ✅

5. Múltiplas regiões geográficas?
   ├─ SIM → AWS ✅
   └─ NÃO → RENDER ✅

6. Integração com outros serviços cloud?
   ├─ SIM (S3, DynamoDB, Lambda) → AWS ✅
   └─ NÃO → RENDER ✅
```

---

## ⚠️ Gotchas & Armadilhas Comuns

### **RENDER**

| Problema | Causa | Solução |
|----------|-------|---------|
| Aplicação dorme após inatividade | Free tier hibernation | Upgrade para plano pago |
| Servidor não tem espaço | Limite de storage | Usar RDS separado |
| Logs desaparecem | Retenção limitada | Exportar regularmente |
| Sem acesso direto banco | Apenas via JDBC | Usar pgAdmin via internet |

### **AWS**

| Problema | Causa | Solução |
|----------|-------|---------|
| Conta foi hackeada | Credentials expostos | Usar IAM roles + Secrets Manager |
| Conta cobrada inesperadamente | Free tier expirou | Configurar billing alerts |
| RDS lento | Multi-AZ ativo | Otimizar queries/índices |
| Task não inicia | Security group bloqueado | Verificar inbound rules |
| Custos duplicados | Múltiplas instâncias | Terminar recursos obsoletos |

---

## 🔐 Segurança: Checklist Final

### **Antes de ir para Produção**

```bash
✅ JWT_SECRET tem >32 caracteres aleatórios
✅ Banco de dados não é acessível publicamente
✅ HTTPS/TLS ativo em tudo
✅ CORS configurado apenas para domínios autorizados
✅ Logs não expõem dados sensíveis
✅ Passwords/secrets não hardcoded no código
✅ .env adicionado ao .gitignore
✅ Atualizações de segurança Maven/npm aplicadas
✅ SQL injection prevenido (usando JPA/Parameterized queries)
✅ CSRF tokens ativados (Spring Security)
✅ Rate limiting/throttling configurado
✅ Monitoramento e alertas ativos
✅ Backup automático habilitado
✅ Disaster recovery plan documentado
```

---

## 📚 Referências & Recursos

### **RENDER**
- [Render Docs](https://render.com/docs)
- [Deploy Spring Boot](https://render.com/docs/deploy-spring)
- [PostgreSQL Database](https://render.com/docs/databases)

### **AWS**
- [ECS Getting Started](https://docs.aws.amazon.com/AmazonECS/)
- [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/)

### **General**
- [Spring Boot Docker](https://spring.io/guides/topicals/spring-boot-docker/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

---

## 📞 Suporte & Troubleshooting

### **Para RENDER**
- 📧 support@render.com
- 💬 Discord Community: https://discord.gg/6Kee5g2
- 📖 Docs: https://render.com/docs

### **Para AWS**
- 💬 Stack Overflow: tag `amazon-aws`
- 💬 AWS Forum: https://forums.aws.amazon.com
- 📞 AWS Support: https://console.aws.amazon.com/support

### **Para o Projeto SAI**
- 📧 Nicholas (Dev): [seu-email]
- 🐙 GitHub Issues: [seu-repo/issues]
- 📝 Confluence/Wiki: [seu-wiki]

---

**Última atualização**: Abril de 2026  
**Versão do Projeto**: 0.0.1  
**Java Version**: 21  
**Spring Boot**: 3.5.8  
**React**: 18.2  
**PostgreSQL**: 16


