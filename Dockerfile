# Multi-stage Dockerfile for Spring Boot 3 & Java 21 (Temurin)
# Optimized for free container deployment on Render, Railway, or Fly.io

# Stage 1: Build the Application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and POM for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source and build executable JAR
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Stage 2: Lightweight Production Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root application user for container security
RUN addgroup -S notesgroup && adduser -S notesuser -G notesgroup

# Copy the compiled JAR artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Ensure persistent data directory exists with write permissions
RUN mkdir -p /app/data && chown -R notesuser:notesgroup /app
USER notesuser

ENV PORT=8080
EXPOSE 8080

# Run Spring Boot with optimal container flags
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
