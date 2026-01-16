# Etapa 1: Construcción
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir con Nginx (Usando una imagen estable verificada)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos una configuración básica si la tienes, si no, Nginx usará la de por defecto
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]