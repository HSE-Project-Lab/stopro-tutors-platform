# СТОПРО Backend - Java 21 Spring Boot Dockerfile
# Multi-stage build для оптимального размера образа

# ===========================================
# Stage 1: Build
# ===========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Установка Maven
RUN apk add --no-cache maven

# Копируем только pom.xml для кеширования зависимостей
COPY pom.xml .

# Загружаем зависимости (кешируется если pom.xml не изменился)
RUN mvn dependency:go-offline -B

# Копируем исходный код
COPY src ./src

# Сборка приложения
RUN mvn clean package -DskipTests -B

# ===========================================
# Stage 2: Runtime
# ===========================================
FROM eclipse-temurin:21-jre-alpine

# wget для HEALTHCHECK
RUN apk add --no-cache wget

WORKDIR /app

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Копируем JAR из builder stage
COPY --from=builder /app/target/*.jar app.jar

# Каталог для загруженных файлов и права на /app
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

# Переключаемся на непривилегированного пользователя
USER appuser

# Порт приложения
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM параметры для контейнера
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# Запуск приложения
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
