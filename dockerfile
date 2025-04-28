FROM node:lts-slim

WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
COPY crud-vendedores /usr/src/app/crud-vendedores

RUN npm install --production
RUN npm prune --production

EXPOSE 3000
