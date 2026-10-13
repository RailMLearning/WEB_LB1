FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY java-backend/pom.xml ./
RUN mvn -q dependency:go-offline
COPY java-backend/src ./src
RUN mvn -q package

FROM quay.io/wildfly/wildfly:35.0.1.Final-jdk17
COPY --from=build --chown=jboss:root /build/target/postgresql.jar /opt/jboss/postgresql.jar
COPY --chown=jboss:root java-backend/docker/datasource.cli /opt/jboss/datasource.cli
RUN /opt/jboss/wildfly/bin/jboss-cli.sh --file=/opt/jboss/datasource.cli && rm -rf /opt/jboss/wildfly/standalone/configuration/standalone_xml_history
COPY --from=build --chown=jboss:root /build/target/ROOT.war /opt/jboss/wildfly/standalone/deployments/ROOT.war
EXPOSE 8080
CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "0.0.0.0"]
