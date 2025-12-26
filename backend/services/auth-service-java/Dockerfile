# Mnbara Auth Service - eBay-Level Java/Spring Boot Service
# Multi-stage build for optimized production image

# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml first for better Docker layer caching
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

# Install additional packages for production
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S mnbara && \
    adduser -S mnbara -u 1001 -G mnbara

WORKDIR /app

# Copy built JAR from build stage
COPY --from=build /app/target/auth-service-*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs && chown -R mnbara:mnbara /app

# Switch to non-root user
USER mnbara

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/auth/health || exit 1

# Expose port
EXPOSE 3001

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -XX:+OptimizeStringConcat \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.profiles.active=docker"

# Application configuration
ENV SERVER_PORT=3001
ENV SPRING_PROFILES_ACTIVE=docker

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# Labels for better container management
LABEL maintainer="Mnbara Platform Team"
LABEL service="auth-service"
LABEL version="1.0.0"
LABEL description="eBay-Level Authentication Service for Mnbara Platform"