ARG NODE_VERSION
FROM node:${NODE_VERSION}

WORKDIR /usr/prototype

COPY . .

RUN npm ci

ENTRYPOINT npm run dev