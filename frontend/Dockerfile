# Etapa 1: Construcción
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
ENV VITE_BACKEND_URL=""
RUN npm run build

# Etapa 2: Servir con Nginx (Usando una imagen estable verificada)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["/bin/sh", "-c", "echo 'Frontend accessible at http://localhost:8080' && nginx -g 'daemon off;'"]