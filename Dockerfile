# Etapa de compilación
FROM node:lts AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de npm
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Compila la aplicación (asegúrate que en package.json tengas el script "build")
RUN npm run build

# Etapa de ejecución
FROM node:lts

WORKDIR /app

# Copia los archivos compilados y las dependencias necesarias
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Define la variable de entorno para producción (opcional)
ENV NODE_ENV=production

# Expone el puerto (por defecto NestJS utiliza el 3000)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]
