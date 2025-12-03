# Usa a imagem base do Java para rodar o Spring Boot
FROM openjdk:22-jdk-slim AS build

# Define o diretório de trabalho
WORKDIR /app

# 1. Copia o arquivo principal de configuração do Maven
COPY pom.xml .

# 2. Copia o script do Maven Wrapper e o diretório de configurações do Maven
# (Isso resolve o erro "./mvnw: not found")
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# 3. Copia o código-fonte (classes, controllers, services)
COPY src ./src

# 4. Compila o projeto
# O Docker agora tem acesso ao script mvnw
RUN ./mvnw clean package -DskipTests

# Estágio de Runtime (Mantido)
FROM openjdk:22-jdk-slim
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]