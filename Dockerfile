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

# Crea directorio para certificados y copia los de Let's Encrypt
RUN mkdir -p /app/certs
COPY /etc/letsencrypt/live/admin.techniza.mx/fullchain.pem /app/certs/
COPY /etc/letsencrypt/live/admin.techniza.mx/privkey.pem /app/certs/

ENV NODE_ENV=production
EXPOSE 3000
EXPOSE 443

CMD ["node", "dist/apps/core/main.js"]