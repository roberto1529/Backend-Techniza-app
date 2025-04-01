# Etapa de compilación
FROM node:lts AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa de ejecución
FROM node:lts

WORKDIR /app
COPY --from=builder /app/dist/apps/core ./dist/apps/core
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Solo crea el directorio, no copies los certificados
RUN mkdir -p /app/certs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/apps/core/main.js"]