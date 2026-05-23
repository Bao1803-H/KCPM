FROM jenkins/jenkins:lts-jdk17

USER root

ARG DOCKER_CLI_VERSION=27.5.1
ARG DOCKER_COMPOSE_VERSION=v2.29.7

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        nodejs \
        npm \
        tar \
    && curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_CLI_VERSION}.tgz" \
        -o /tmp/docker.tgz \
    && tar -xzf /tmp/docker.tgz -C /tmp \
    && mv /tmp/docker/docker /usr/local/bin/docker \
    && chmod +x /usr/local/bin/docker \
    && rm -rf /tmp/docker /tmp/docker.tgz \
    && mkdir -p /usr/local/lib/docker/cli-plugins \
    && curl -fsSL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose \
    && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose \
    && ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER jenkins
