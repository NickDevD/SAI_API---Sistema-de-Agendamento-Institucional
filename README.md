# 💻 SAI - Sistema de Agendamento Institucional

## Visão Geral do Projeto
O SAI (Sistema de Agendamento Institucional) é uma aplicação moderna desenvolvida com uma arquitetura microservice-like que separa completamente o Frontend e o Backend.

- Backend (API): Construída com Spring Boot 3.x e Java, responsável pela lógica de negócios, persistência de dados e segurança (JWT).

- Frontend (Cliente) Em Desenvolvimento: Construída com React e TypeScript, utilizando Material UI para uma interface de usuário responsiva e profissional.

- Banco de Dados: PostgreSQL, com versionamento de schema via Flyway rodando via Docker.

## 🛠️ Pré-requisitos de Desenvolvimento
Para rodar este projeto localmente, você precisa ter instalado:

-- Java Development Kit (JDK) 21+

-- Maven (para gerenciar as dependências do Java)

-- Node.js (LTS) (para o Frontend React)

-- npm (instalado junto com o Node.js)

-- PostgreSQL (servidor de banco de dados)

-- Git (para clonar o repositório)

## ⚙️ Configuração do Ambiente
O projeto usa Variáveis de Ambiente para gerenciar credenciais (Banco de Dados e Segredos JWT).

#### 1. Variáveis de Ambiente (.env)
   Na raiz da pasta do Backend (onde está o pom.xml e o docker-compose.yml), crie um arquivo chamado .env com as seguintes variáveis.

'''
    Snippet de código
    
    # Configuração de Segurança JWT (Token Secreto)
    JWT_SECRET=Insira_Aqui_Uma_Chave_Secreta_Longa_e_Unica_Para_Assinar_Tokens
    
    # Configuração do PostgreSQL (Valores padrão, ajuste se necessário)
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432(Padrão) - ou 8080
    POSTGRES_USER=seu_usuario_postgres
    POSTGRES_PASSWORD=sua_senha_postgres
    POSTGRES_DB_NAME=sai_agendamento
'''
#### 2. Configuração do Banco de Dados
   Certifique-se de que o servidor PostgreSQL está rodando.

Para utilizar o banco PostgreSQL, basta que o arquivo docker-compose esteja configurado corretamento com todas as
variáveis de ambiente devidamente preenchidas. A imagem do PostgreSQL no docker cuidará de subir o servidor para
utilizar o banco via docker sem necessidade de instalação.

O Flyway cuidará das migrações e criará as tabelas tb_usuarios e tb_agendamentos na primeira execução do Backend.

## 🚀 Como Rodar a Aplicação

-- Em desenvolvimento

🤝 Colaboração

#### 🛠 Solução de Problemas
- Em caso de problemas de conexão com o banco de dados, verifique as credenciais no seu arquivo .env.

- Em caso de erros de segurança (403/401), verifique se o Token no Swagger está fresco e se foi colado com o prefixo Bearer (com espaço).
- Verificar se a classe SwaggerConfig.java está aplicada a toda API, para evitar que o token não seja reconhecido. 