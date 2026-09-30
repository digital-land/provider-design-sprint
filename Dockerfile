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
# Production mode disables /manage-prototype.
# Override via the container environment (e.g. ECS task definition) if needed.
ENV NODE_ENV=production
# HTTPS redirects are handled by the CDN. The kit's own redirect would also
# send load balancer health checks (plain HTTP) a 302 instead of a 200.
ENV USE_HTTPS=false
# The prototype is public, so no password is required. /manage-prototype stays
# disabled because it depends on NODE_ENV, not on auth.
ENV USE_AUTH=false

ENTRYPOINT npm run dev