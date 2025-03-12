# Etapa de compilación
FROM node:lts AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de npm
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código del proyecto
COPY . .

# Ejecuta la compilación (se usará la configuración de nest-cli.json)
RUN npm run build

# Etapa de ejecución
FROM node:lts

WORKDIR /app

# Copia la carpeta compilada (en tu monorepo se genera en dist/apps/core)
COPY --from=builder /app/dist/apps/core ./dist/apps/core
# Copia también los módulos de node necesarios
COPY --from=builder /app/node_modules ./node_modules
# Copia el package.json si es necesario (para referencia o variables de entorno)
COPY --from=builder /app/package*.json ./

# Define la variable de entorno para producción
ENV NODE_ENV=production

# Expone el puerto en el que corre tu aplicación (por defecto Nest usa el 3000)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/apps/core/main.js"]
