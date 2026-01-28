# =============== FRONTEND ===============
# Etapa 1: Construcción
FROM node:18-alpine AS build
WORKDIR /app

# 1. Copiar solo los archivos de dependencias primero
COPY package*.json ./

# 2. Instalar dependencias (esto se guardará en caché si no cambias el package.json)
RUN npm install

# 3. Copiar el resto del código (esto cambia seguido)
COPY . .

# 4. Construir el proyecto
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine
# Limpiar el directorio por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*
# Copiar el build desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
# Simplificamos el CMD para producción
CMD ["nginx", "-g", "daemon off;"]