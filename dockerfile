FROM node:lts-slim

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY src ./src
COPY public ./public

RUN npm install --production
RUN npm run build
RUN npm prune --production
RUN rm -rf src public

EXPOSE 3000
CMD ["node", "dist/index.js"]