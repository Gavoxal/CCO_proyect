# Imagen base ligera de Node
FROM node:20-alpine

# Instalamos dependencias necesarias para Prisma y MySQL en Alpine
RUN apk add --no-cache openssl libc6-compat

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos todas las dependencias (incluyendo dev para la generación de Prisma)
RUN npm install

# Copiamos el resto del código
COPY . .

# Generamos el Cliente de Prisma
RUN npx prisma generate

# Exponemos el puerto de la API
EXPOSE 3000

# Iniciamos la aplicación
# Usamos un comando que ejecute las migraciones pendientes antes de arrancar
CMD npx prisma migrate deploy && npm start
