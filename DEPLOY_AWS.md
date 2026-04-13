# ☁️ Guia Completo: Deploy SAI na AWS

> Sistema de Agendamento Institucional - Deployment Amazon Web Services

## 📋 Sumário
1. [Visão Geral](#visão-geral)
2. [Arquitetura AWS](#arquitetura-aws)
3. [Pré-requisitos](#pré-requisitos)
4. [Passo a Passo Completo](#passo-a-passo-completo)
5. [Configurações Avançadas](#configurações-avançadas)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)

---

## 👀 Visão Geral

A AWS oferece múltiplas opções para fazer deploy de uma aplicação full-stack. Este guia usa:

- **Elastic Container Service (ECS)** para orquestração de containers
- **RDS PostgreSQL** para banco de dados gerenciado
- **Elastic Container Registry (ECR)** para armazenar imagens Docker
- **Application Load Balancer (ALB)** para distribuição de carga
- **CloudWatch** para monitoramento e logs
- **Elastic IPs** para domínios estáticos

Custo estimado (tier gratuito parcialmente aplicável):
- RDS PostgreSQL: ~$20-30/mês
- ECS Fargate: ~$30-50/mês
- ALB: ~$15/mês
- Total: ~$50-100/mês em produção

---

## 🏗️ Arquitetura AWS

```
┌─────────────────────────────────────────────────────────┐
│                        AWS Cloud                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Application Load Balancer (ALB)         │   │
│  │  - Distribui traffic entre Frontend e Backend   │   │
│  │  - Termina conexões HTTPS/SSL                   │   │
│  └────────────────┬────────────────────────────────┘   │
│                   │                                      │
│    ┌──────────────┴──────────────┐                     │
│    │                             │                      │
│    ▼                             ▼                      │
│  ┌─────────────────┐   ┌──────────────────┐            │
│  │ ECS Task Group  │   │ ECS Task Group   │            │
│  │   (Frontend)    │   │  (Backend)       │            │
│  ├─────────────────┤   ├──────────────────┤            │
│  │ • Nginx/Node    │   │ • Spring Boot    │            │
│  │ • Port 80/443   │   │ • Port 8080      │            │
│  │ • 1-3 replicas  │   │ • 2-4 replicas   │            │
│  └─────────────────┘   └────────┬─────────┘            │
│                                  │                      │
│                    ┌─────────────▼──────────┐           │
│                    │  RDS PostgreSQL        │           │
│                    ├────────────────────────┤           │
│                    │ • db.t3.micro/small    │           │
│                    │ • Multi-AZ (opcional)  │           │
│                    │ • Backup automático    │           │
│                    │ • Port 5432            │           │
│                    └────────────────────────┘           │
│                                                          │
│  Suportes:                                              │
│  • CloudWatch Logs (todos os containers)                │
│  • Auto Scaling based on CPU/Memory                     │
│  • AWS Secrets Manager para secrets                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Pré-requisitos

### **1. Conta AWS**
- Criar em: https://aws.amazon.com/pt/
- Cartão de crédito necessário
- Tier gratuito disponível (12 meses para novos usuários)

### **2. AWS CLI**
```bash
# Instalar AWS CLI v2
# Windows: Download do instalador em https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: sudo apt install awscli

# Verificar instalação
aws --version
```

### **3. Configure Credenciais AWS**
```bash
aws configure

# Será solicitado:
# AWS Access Key ID: [sua access key]
# AWS Secret Access Key: [sua secret key]
# Default region: us-east-1 (ou escolha a mais próxima)
# Default output format: json
```

> Gere as chaves em: AWS Console → IAM → Users → Security credentials

### **4. Docker (para build local)**
```bash
# Windows/Mac: Download Docker Desktop
# Linux: sudo apt install docker.io docker-compose
```

### **5. Repositório GitHub**
- Código commitado e disponível
- Token de acesso pessoal (PAT) para CI/CD (opcional)

---

## 🚀 Passo a Passo Completo

### **FASE 1: Preparar Variáveis de Ambiente AWS**

#### 1.1 Gerar Secrets no AWS Secrets Manager

1. Acesse **AWS Console** → **Secrets Manager**
2. Clique em **"Store a new secret"**
3. Escolha **"Other type of secrets"**
4. Adicione as chaves:

```json
{
  "JWT_SECRET": "sua_chave_super_secreta_minimo_32_caracteres_aleatorios_12345678901234567890",
  "POSTGRES_USER": "saiuser",
  "POSTGRES_PASSWORD": "sua_senha_muito_secreta_123456",
  "POSTGRES_DB_NAME": "sai_agendamento"
}
```

5. Configure o **Rotation** (opcional) - deixe default por enquanto
6. Clique em **"Store secret"**
7. **Copie o ARN** (vai parecer: `arn:aws:secretsmanager:us-east-1:123456789:secret:sai-config`)

---

### **FASE 2: Criar Banco de Dados RDS PostgreSQL**

#### 2.1 Criar RDS Instance

1. Acesse **AWS Console** → **RDS** → **Databases**
2. Clique em **"Create database"**
3. Configure:

```
Engine options:
  └─ PostgreSQL (versão 16)

Deployment options:
  └─ Single DB instance (ou Multi-AZ para redundância)

DB instance class:
  └─ db.t3.micro (gratuito por 12 meses)

Storage:
  └─ 20 GB (padrão)

DB instance identifier:
  └─ sai-postgres

Credentials Settings:
  └─ Master username: saiuser
  └─ Master password: [gere uma senha forte]

Publicly accessible:
  └─ No (✓ mais seguro, acessa via VPC)

VPC security group:
  └─ Create new (ex: sai-rds-sg)

Database name:
  └─ sai_agendamento

Backup retention period:
  └─ 7 days (default)

Encryption:
  └─ Enable encryption (recomendado)
```

4. Clique em **"Create database"**
5. ⏳ Aguarde ~10-15 minutos para provisionar
6. Quando status for **"Available"**, copie:
   - **Endpoint** (ex: `sai-postgres.c9akciq32.us-east-1.rds.amazonaws.com`)
   - **Port**: `5432`
   - **Username**: `saiuser`
   - **Password**: [que você configurou]

#### 2.2 Configurar Security Group do RDS

1. No RDS, selecione a instance criada
2. Clique em **"VPC security groups"**
3. Edite as **inbound rules**:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Security group do ECS (vamos criar depois)
   - **Salve**

---

### **FASE 3: Criar Repositório ECR (Elastic Container Registry)**

O ECR armazena suas imagens Docker construídas.

#### 3.1 Criar Repository para Backend

1. Acesse **AWS Console** → **Elastic Container Registry** → **Repositories**
2. Clique em **"Create repository"**
3. Configure:
   - **Repository name**: `sai-backend`
   - **Scanning on push**: Enable (encontra vulnerabilidades)
   - **Encryption**: Enable
4. Clique em **"Create repository"**
5. Copie a **URI** (ex: `123456789.dkr.ecr.us-east-1.amazonaws.com/sai-backend`)

#### 3.2 Criar Repository para Frontend

Repita o processo:
   - **Repository name**: `sai-frontend`

---

### **FASE 4: Build e Push de Imagens Docker**

#### 4.1 Authenticate Docker com ECR

```bash
# Configure as credenciais
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
```

#### 4.2 Build Backend

```bash
# Navegar para pasta backend
cd backend

# Build da imagem
docker build -t sai-backend:latest .

# Tag para ECR
docker tag sai-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-backend:latest

# Push para ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-backend:latest
```

#### 4.3 Build Frontend (Versão Otimizada)

Crie `front/Dockerfile.prod`:

```dockerfile
# ===== BUILD STAGE =====
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ===== RUNTIME STAGE =====
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Configure Nginx para SPA routing
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \.js$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    location ~* \.css$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build:

```bash
# Navegar para pasta frontend
cd front

# Build
docker build -f Dockerfile.prod -t sai-frontend:latest .

# Tag para ECR
docker tag sai-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-frontend:latest

# Push para ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-frontend:latest
```

---

### **FASE 5: Configurar ECS (Elastic Container Service)**

#### 5.1 Criar ECS Cluster

1. Acesse **AWS Console** → **Elastic Container Service** → **Clusters**
2. Clique em **"Create cluster"**
3. Configure:
   - **Cluster name**: `sai-cluster`
   - **Infrastructure**: AWS Fargate (serverless)
   - **Default capacity provider**: FARGATE_SPOT (mais barato)
4. Clique em **"Create"**

#### 5.2 Criar Task Definition para Backend

1. Vá para **Task Definitions** → **Create new task definition**
2. Selecione **Fargate**
3. Configure:

```
Task definition name: sai-backend-task

Container name: backend
  └─ Image URI: 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-backend:latest
  └─ Container port: 8080
  └─ Protocol: tcp
  └─ Environment variables:
     • SPRING_DATASOURCE_URL=jdbc:postgresql://sai-postgres.c9akciq32.us-east-1.rds.amazonaws.com:5432/sai_agendamento
     • SPRING_DATASOURCE_USERNAME=saiuser
     • SPRING_DATASOURCE_PASSWORD=[sua_senha]
     • JWT_SECRET=[do Secrets Manager]
     • PORT=8080
     • SPRING_PROFILES_ACTIVE=prod

CPU: 0.5 GB (256)
Memory: 1 GB (1024)
Task role: (deixe default ou crie nova)
Logging:
  └─ CloudWatch Logs
  └─ Log group: /ecs/sai-backend
```

4. Clique em **"Create"**

#### 5.3 Criar Task Definition para Frontend

Repita o processo:

```
Task definition name: sai-frontend-task

Container name: frontend
  └─ Image URI: 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-frontend:latest
  └─ Container port: 80
  └─ Protocol: tcp
  └─ Environment variables:
     • VITE_API_URL=https://api.seu-dominio.com/api/v1
     (Ou use ALB DNS temporariamente)

CPU: 0.5 GB (256)
Memory: 512 MB (512)
Logging:
  └─ CloudWatch Logs
  └─ Log group: /ecs/sai-frontend
```

---

### **FASE 6: Criar Application Load Balancer**

#### 6.1 Criar ALB

1. Acesse **AWS Console** → **EC2** → **Load Balancers**
2. Clique em **"Create load balancer"** → **Application Load Balancer**
3. Configure:

```
Name: sai-alb

Scheme: Internet-facing
IP address type: IPv4

Listeners and routing:
  └─ HTTP : 80
  └─ Protocol: HTTP
  └─ Forward to target group: (criar nova)

Availability Zones:
  └─ Selecione as zonas desejadas
```

4. Clique em **"Create load balancer"**

#### 6.2 Criar Target Groups

**Para Backend:**

1. Vá para **Target Groups** → **Create target group**
2. Configure:
   - **Target type**: IP addresses
   - **Name**: `sai-backend-tg`
   - **Protocol**: HTTP
   - **Port**: 8080
   - **VPC**: Default
   - **Health check path**: `/actuator/health`
   - **Health check protocol**: HTTP

**Para Frontend:**

1. Repita com:
   - **Name**: `sai-frontend-tg`
   - **Port**: 80
   - **Health check path**: `/`

---

### **FASE 7: Criar Serviços ECS**

#### 7.1 Criar Serviço Backend

1. No Cluster, vá para **Services** → **Create**
2. Configure:

```
Launch type: FARGATE
Task definition: sai-backend-task
Service name: sai-backend-service
Number of tasks: 2 (mínimo para HA)
Load balancing:
  └─ Application Load Balancer
  └─ ALB: sai-alb
  └─ Target group: sai-backend-tg
  └─ Container port: 8080

Auto Scaling:
  └─ Minimum: 2
  └─ Maximum: 4
  └─ Desired: 2
  └─ CPU target: 70%
```

3. Clique em **"Create service"**

#### 7.2 Criar Serviço Frontend

Repita:
```
Service name: sai-frontend-service
Number of tasks: 2
Container port: 80
Target group: sai-frontend-tg
```

---

### **FASE 8: Configurar Listener Rules no ALB**

1. Vá para **Load Balancers** → **sai-alb** → **Listeners**
2. Clique em **listener HTTP:80**
3. Configure path-based routing:

```
Add rule:
  └─ Path: /api/* → Forward to sai-backend-tg
  └─ Path: /* → Forward to sai-frontend-tg
```

4. **Salve**

---

## ⚙️ Configurações Avançadas

### **HTTPS/SSL com AWS Certificate Manager**

1. Acesse **AWS Console** → **Certificate Manager**
2. Clique em **"Request certificate"**
3. Configure domínio (ex: `sai.seu-dominio.com`)
4. Valide via email/DNS
5. No ALB Listener, adicione listener HTTPS:443
6. Selecione o certificado
7. Configure redirecionamento HTTP → HTTPS

---

### **Auto Scaling com Métricas Customizadas**

```bash
# Via AWS CLI
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/sai-cluster/sai-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 8
```

---

### **Database Backup Automático**

1. No RDS → **DB instances** → **sai-postgres**
2. Vá para **Maintenance & backups**
3. Configure:
   - **Backup retention period**: 30 dias
   - **Backup window**: 03:00 UTC (horário de baixa atividade)
   - **Multi-AZ**: Enable (para alta disponibilidade)

---

## 📊 Monitoramento

### **CloudWatch Logs**

```bash
# Ver logs do backend
aws logs tail /ecs/sai-backend --follow

# Ver logs do frontend
aws logs tail /ecs/sai-frontend --follow
```

### **Criar Dashboard CloudWatch**

1. Acesse **AWS Console** → **CloudWatch** → **Dashboards**
2. Clique em **"Create dashboard"**
3. Adicione widgets:
   - ECS Service CPU/Memory
   - RDS Database CPU/Connections
   - ALB Request Count
   - ALB Target Health

---

## 🐛 Troubleshooting

### **Problema: Tarefas ECS não iniciam**

```bash
# Verificar status
aws ecs describe-services \
  --cluster sai-cluster \
  --services sai-backend-service

# Ver logs de erro
aws logs tail /ecs/sai-backend --follow
```

**Soluções comuns**:
- ECR image não existe ou tag incorreta
- Variáveis de ambiente ausentes
- Porta já em uso
- Sem permissões IAM

---

### **Problema: Banco de dados não conecta**

**Verificar**:
1. RDS status é "Available"
2. Security group permite porta 5432 do ECS
3. String de conexão está correta
4. Credenciais do banco estão certas

```bash
# Testar conexão RDS (de um EC2 na mesma VPC)
psql -h sai-postgres.c9akciq32.us-east-1.rds.amazonaws.com \
  -U saiuser \
  -d sai_agendamento
```

---

### **Problema: Frontend não consegue chamar backend**

**Verificar**:
1. Health check do backend está passando
2. VITE_API_URL está correto
3. ALB path routing está configurado
4. CORS no backend permite domínio do frontend

---

### **Problema: Custos aumentando rapidamente**

**Reduzir custos**:
1. Reduzir número de tasks (de 2 para 1)
2. Usar menores instâncias RDS (db.t3.micro)
3. Usar FARGATE_SPOT ao invés de ON_DEMAND
4. Limpar recursos não utilizados
5. Configurar CloudWatch log retention (ex: 7 dias)

---

## 🔒 Segurança

### **Boas Práticas**

1. ✅ Usar Secrets Manager para credentials
2. ✅ Habilitar encryption em RDS
3. ✅ Usar Security Groups restritivos
4. ✅ Habilitar VPC Flow Logs
5. ✅ Usar IAM roles ao invés de access keys
6. ✅ Habilitar CloudTrail para auditoria
7. ✅ Usar HTTPS/TLS em tudo

### **Backup & Disaster Recovery**

```bash
# Fazer snapshot manual do RDS
aws rds create-db-snapshot \
  --db-instance-identifier sai-postgres \
  --db-snapshot-identifier sai-postgres-manual-backup

# Listar snapshots
aws rds describe-db-snapshots
```

---

## 📊 Arquivos de Configuração Necessários

### **Backend - application.properties (Produção)**

```properties
# === DATABASE CONFIG (from Secrets Manager) ===
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

# === HIBERNATE & FLYWAY ===
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# === JWT ===
api.security.token.secret=${JWT_SECRET}

# === SERVER ===
server.port=${PORT:8080}
spring.profiles.active=prod

# === LOGGING ===
logging.level.root=INFO
logging.level.com.devtec.sai=DEBUG
logging.level.org.springframework.web=INFO

# === ACTUATOR (Health Checks) ===
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

### **Frontend - .env.production**

```env
VITE_API_URL=https://api.seu-dominio.com/api/v1
```

---

## 📝 Procedimento de Atualização após Deploy

```bash
# 1. Fazer alterações localmente
git add .
git commit -m "Feature: descrição"
git push origin main

# 2. Rebuild imagens
cd backend && docker build -t sai-backend:v2 . && cd ..
docker tag sai-backend:v2 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-backend:v2
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/sai-backend:v2

# 3. Atualizar Task Definition
# No console AWS → ECS → Task Definitions
# Criar nova revisão com nova imagem tag

# 4. Atualizar Service para usar nova Task Definition
aws ecs update-service \
  --cluster sai-cluster \
  --service sai-backend-service \
  --task-definition sai-backend-task:2 \
  --force-new-deployment

# 5. Monitorar deployment
aws ecs describe-services --cluster sai-cluster --services sai-backend-service
```

---

## 💰 Estimativa de Custos (Fora do Tier Gratuito)

| Serviço | Quantidade | Custo/mês |
|---------|-----------|----------|
| ECS Fargate (backend) | 2 tasks × 0.5GB CPU | $35 |
| ECS Fargate (frontend) | 2 tasks × 0.5GB CPU | $35 |
| RDS PostgreSQL | db.t3.micro | $25 |
| ALB | 1 ALB | $15 |
| Data Transfer | ~100GB | $10 |
| **TOTAL** | | **~$120/mês** |

> Tier gratuito cobre até 750h/mês de RDS db.t2.micro e 1 ALB por 12 meses

---

## ✅ Checklist Final

- [ ] Conta AWS criada e configurada
- [ ] Variáveis de ambiente em Secrets Manager
- [ ] RDS PostgreSQL criado e disponível
- [ ] ECR repositories criados
- [ ] Imagens Docker buildadas e pushadas
- [ ] ECS Cluster criado
- [ ] Task Definitions criadas
- [ ] ALB criado e configurado
- [ ] ECS Services rodando com tasks saudáveis
- [ ] Health checks passando
- [ ] Frontend consegue chamar backend
- [ ] Login funcionando
- [ ] CORS configurado
- [ ] CloudWatch logs sendo capturados
- [ ] Monitoramento ativo

---

## 🔗 Links Úteis

- [AWS ECS Getting Started](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started.html)
- [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [ECR Documentation](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)

---

**🎉 Parabéns! Sua aplicação SAI está na AWS!**

Para suporte, consulte os logs no CloudWatch e a documentação oficial AWS.


