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

# Set after npm ci so devDependencies (e.g. webpack-cli) are still installed.
# Production mode enables password auth and disables /manage-prototype.
# Override via the container environment (e.g. ECS task definition) if needed.
ENV NODE_ENV=production

ENTRYPOINT npm run dev