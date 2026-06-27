# Stage 1: Build the application using Maven
FROM docker.io/library/maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and resolve dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build the jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Create the minimal runtime image
FROM docker.io/library/eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Run as non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]