FROM maven:3.9.13-eclipse-temurin-21-alpine AS build

WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn -q -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV SERVER_PORT=8080
EXPOSE 8080
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
