# ===== BUILD STAGE =====
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package -DskipTests


# ===== RUNTIME STAGE =====
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# 🔥 CRIA USUÁRIO PRIMEIRO
RUN useradd -m appuser

# 🔥 CRIA PASTA E DÁ PERMISSÃO
RUN mkdir -p /app/relatorios && chown -R appuser:appuser /app

# Segurança
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]