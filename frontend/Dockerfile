# Etapa 1: Construcción
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Argumento de construcción para la URL de la API
# Esto permite inyectar la URL de producción durante el build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Realizamos el build de producción
RUN npm run build

# Etapa 2: Producción (Servidor Nginx)
FROM nginx:alpine

# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos generados por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
