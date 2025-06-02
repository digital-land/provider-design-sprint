FROM node:24.1.0

WORKDIR /usr/prototype

COPY . .

RUN npm install

ENTRYPOINT npm run dev