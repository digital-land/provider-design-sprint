ARG NODE_VERSION
FROM node:${NODE_VERSION}-trixie-slim

RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/prototype
RUN chown node:node /usr/prototype

USER node

COPY --chown=node:node . .

RUN npm ci

ENTRYPOINT npm run dev