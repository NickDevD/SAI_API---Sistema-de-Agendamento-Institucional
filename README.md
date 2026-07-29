# 💻 SAI - Sistema de Agendamento Institucional

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat&logo=spring-boot)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=flat&logo=postgresql)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=flat)

**URLs de Deploy:**
>🔗 Backend: https://sai-api-sistema-de-agendamento.onrender.com

>🔗 Frontend: https://sai-api-sistema-de-agendamento-inst.vercel.app/

## 📋 Visão Geral do Projeto

O **SAI** (Sistema de Agendamento Institucional) é uma aplicação moderna desenvolvida com uma arquitetura que separa completamente o Frontend e o Backend, permitindo escalabilidade e manutenção independente.

### 🏗️ Arquitetura

- **Backend (API REST)**: Construída com Spring Boot 3.x e Java, responsável pela lógica de negócios, persistência de dados e segurança com autenticação JWT.

- **Frontend (Cliente Web)**: Em desenvolvimento com React e TypeScript, utilizando Material UI para uma interface responsiva e profissional.

- **Banco de Dados**: PostgreSQL com versionamento de schema via Flyway, containerizado com Docker para fácil setup.

## 🛠️ Pré-requisitos de Desenvolvimento

Para rodar este projeto localmente, você precisa ter instalado:

- **Java Development Kit (JDK)** 21 ou superior
- **Maven** (para gerenciar as dependências do Java)
- **Node.js** LTS (para o Frontend React)
- **npm** (instalado junto com o Node.js)
- **PostgreSQL** (servidor de banco de dados)
- **Git** (para clonar o repositório)
- **Docker & Docker Compose** (opcional, para containerização)

## ⚙️ Configuração do Ambiente

O projeto usa Variáveis de Ambiente para gerenciar credenciais (Banco de Dados e Segredos JWT) de forma segura.

### 1. Variáveis de Ambiente (.env)

Na **raiz do repositório** (mesma pasta do `docker-compose.yml`, um nível acima de `backend/`), copie o `.env.example` para `.env` e ajuste os valores:

```bash
cp .env.example .env
```

```env
# PostgreSQL
POSTGRES_DB_NAME=agendamento_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Usuário admin criado pela migration Flyway V3 (login em texto puro + hash bcrypt da senha)
DEFAULT_USER_PASSWORD=admin123
FLYWAY_PLACEHOLDERS_ADMIN_LOGIN=admin
FLYWAY_PLACEHOLDERS_ADMIN_PASSWORD_HASH=hash_bcrypt_da_senha_acima

# Segurança JWT (Token Secreto)
JWT_SECRET=Insira_Aqui_Uma_Chave_Secreta_Longa_e_Unica_Para_Assinar_Tokens
```

> Para gerar o hash bcrypt de `FLYWAY_PLACEHOLDERS_ADMIN_PASSWORD_HASH`, rode a partir de `backend/`:
> ```bash
> mvnw.cmd exec:java -Dexec.mainClass=com.devtec.sai.util.GenerateHash -Dexec.args="sua_senha"
> ```
> Sem essas duas variáveis a migration `V3__insert_admin_user.sql` falha e a aplicação não sobe.
>
> Ao rodar `mvnw spring-boot:run` diretamente (sem Docker), o `.env` da raiz é carregado automaticamente pela aplicação.

### 2. Configuração do Banco de Dados

A aplicação utiliza **Docker Compose** para containerizar o PostgreSQL, facilitando o setup:

1. Certifique-se de que o arquivo `docker-compose.yml` está corretamente configurado com todas as variáveis de ambiente
2. Execute `docker-compose up -d` para iniciar o PostgreSQL
3. O **Flyway** gerenciará automaticamente as migrações e criará as tabelas:
   - `tb_usuarios` - Armazena dados dos usuários (com usuário admin padrão)
   - `tb_agendamentos` - Armazena os agendamentos registrados

## 🚀 Como Rodar a Aplicação

### 📦 Backend (Spring Boot)

1. **Na raiz do repositório, suba apenas o PostgreSQL com Docker Compose:**
   ```bash
   docker-compose up -d postgres-db
   ```

2. **Navegue até a pasta do backend e execute a aplicação:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   Ou no Windows:
   ```bash
   cd backend
   mvnw.cmd spring-boot:run
   ```

4. **Acesse a API:**
   - Swagger UI: `http://localhost:8080/swagger-ui.html`
   - Base URL: `http://localhost:8080/api/v1`

### ⚛️ Frontend (React + TypeScript)

1. **Navegue até a pasta do frontend:**
   ```bash
   cd front
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:5173
   ```

### 🐳 Rodando com Docker (Opcional)

Para rodar a aplicação completa em containers:

```bash
docker-compose up
```

## 📚 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Autenticação de usuário |
| POST | `/api/v1/auth/register` | Cadastro de usuário |
| POST | `/api/v1/agendamentos/agendar` | Criar novo agendamento |
| GET | `/api/v1/agendamentos/consultar_agendamentos` | Listar todos os agendamentos |
| POST | `/api/v1/agendamentos/{id}/status` | Atualizar status de um agendamento |
| POST | `/api/v1/agendamentos/fechar-expediente` | Gerar relatório PDF do expediente (requer role ADMIN) |

## 🔒 Autenticação

A API utiliza **JWT (JSON Web Tokens)** para segurança:

1. Faça login em `/api/auth/login` com suas credenciais
2. Copie o token recebido na resposta
3. No Swagger ou em requisições HTTP, adicione o header:
   ```
   Authorization: Bearer seu_token_aqui
   ```

⚠️ **Nota:** Certifique-se de incluir o prefixo `Bearer ` (com espaço) antes do token.

## 🔄 Pipeline CI/CD e Deploy

Este projeto conta com **automação completa** através de:

### 🚀 Integração Contínua (CI)
- **GitHub Actions** - Executa testes e validações em cada push
- Builds automáticos do backend (Maven)
- Testes unitários automáticos
- Análise de qualidade do código

### 📡 Deploy Automático (CD)
- **Render** - Plataforma de deployment em produção
- Deploy automático a cada merge na branch main
- Zero downtime deployments
- Logs centralizados e monitoramento

**URLs de Deploy:**
- 🔗 Backend: `https://sai-api-sistema-de-agendamento.onrender.com` 
- 🔗 Frontend: `https://sai-api-sistema-de-agendamento-inst.vercel.app/` 

## 🤝 Colaboração

Este projeto está em desenvolvimento. Contribuições são bem-vindas!

#### 🛠 Solução de Problemas

**Problema:** Erro de conexão com o banco de dados
- ✅ **Solução:** Verifique se o PostgreSQL está rodando e as credenciais no arquivo `.env` estão corretas

**Problema:** Erro 403/401 (Não autorizado)
- ✅ **Solução:** Verifique se o token JWT no Swagger está fresco e foi colado com o prefixo `Bearer ` (com espaço antes do token)

**Problema:** Token não é reconhecido pela API
- ✅ **Solução:** Verifique se a classe `SwaggerConfig.java` está aplicada a toda API para garantir que o token seja reconhecido

**Problema:** Flyway não cria as tabelas
- ✅ **Solução:** Certifique-se de que o diretório `src/main/resources/db/migration/` contém os arquivos SQL de migração

## 📁 Estrutura do Projeto

```
SAI_API/
├── backend/                 # API Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/devtec/sai/
│   │   │   │       ├── controller/      # Controllers da API
│   │   │   │       ├── service/         # Lógica de negócios
│   │   │   │       ├── repository/      # Acesso a dados
│   │   │   │       ├── model/           # Entidades JPA
│   │   │   │       ├── dto/             # Data Transfer Objects
│   │   │   │       ├── config/          # Configurações (Security, Swagger)
│   │   │   │       ├── exception/       # Exceções customizadas
│   │   │   │       └── util/            # Utilitários
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── db/migration/        # Scripts Flyway
│   │   └── test/                        # Testes unitários
│   ├── pom.xml
│   └── Dockerfile
│
├── front/                   # Frontend React + TypeScript
│   ├── src/
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── components/      # Componentes React
│   │   ├── services/        # Serviços (API calls)
│   │   ├── theme/           # Temas e estilos
│   │   └── assets/          # Recursos estáticos
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml       # Orquestração de containers
└── README.md               # Este arquivo
```

## 🧪 Testes

Para rodar os testes do backend:

```bash
cd backend
mvnw test
```

## 📝 Licença

Este projeto está sob a licença [MIT](LICENSE).

## 👤 Autor

**Nicholas** - Desenvolvedor Full Stack

---

**⭐ Se este projeto foi útil, considere deixar uma estrela! ⭐**


