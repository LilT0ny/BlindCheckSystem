#!/bin/bash

# Detectar comando docker compose
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  COMPOSE="docker-compose"
fi

domains=(blindcheck.space)
rsa_key_size=4096
data_path="./certbot"
email="anjagoni@gmail.com"
staging=1

# --- MEJORA: Evitar interacción manual ---
if [ -d "$data_path/conf/live/$domains" ]; then
  echo "### Ya existen certificados para $domains. Saltando inicialización..."
  exit 0
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Descargando parámetros TLS recomendados..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

echo "### Creando certificado temporal para $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
$COMPOSE run --rm --entrypoint "openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 -keyout '$path/privkey.pem' -out '$path/fullchain.pem' -subj '/CN=localhost'" certbot

echo "### Levantando frontend (Nginx) temporalmente..."
$COMPOSE up --force-recreate -d frontend

echo "### Eliminando certificado temporal..."
$COMPOSE run --rm --entrypoint "rm -Rf /etc/letsencrypt/live/$domains && rm -Rf /etc/letsencrypt/archive/$domains && rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot

echo "### Solicitando certificado real a Let's Encrypt..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="-m $email" ;;
esac

staging_arg=""
if [ $staging != "0" ]; then staging_arg="--staging"; fi

$COMPOSE run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal \
    --non-interactive \
    --break-my-certs \
    --cert-name blindcheck.space" certbot

echo "### Recargando Nginx..."
$COMPOSE exec frontend nginx -s reload