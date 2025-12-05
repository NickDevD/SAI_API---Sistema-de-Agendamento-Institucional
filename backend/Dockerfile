# Usa a imagem base do Java para rodar o Spring Boot
FROM openjdk:22-jdk-slim AS build

WORKDIR /app

# 0. Instalação necessária para corrigir o formato (dos2unix)
# Você precisará instalar uma ferramenta de gerenciamento de pacotes (ex: apt ou apk)
# Se a imagem openjdk:22-jdk-slim for baseada em Debian:
RUN apt-get update && apt-get install -y dos2unix

# 1. COPIA os arquivos de build
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# 2. **CORREÇÃO CRÍTICA (dos2unix):** Converte a quebra de linha de Windows para Linux
RUN dos2unix mvnw

# 3. Garante permissão de execução
RUN chmod +x mvnw

# 4. COPIA o código-fonte
COPY src ./src

RUN ./mvnw clean package -DskipTests

# Estágio de Runtime (Mantido)
FROM openjdk:22-jdk-slim
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]