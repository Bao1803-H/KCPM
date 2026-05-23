FROM jenkins/jenkins:lts-jdk17

USER root

ARG DOCKER_COMPOSE_VERSION=v2.29.7

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        docker.io \
        git \
        nodejs \
        npm \
    && mkdir -p /usr/local/lib/docker/cli-plugins \
    && curl -fsSL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose \
    && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose \
    && ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER jenkins
