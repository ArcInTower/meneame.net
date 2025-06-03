#!/bin/bash
set -e

# Configuración
WEBROOT="/var/www/vhosts/$(hostname)/httpdocs" # Cambia esto si tu ruta es diferente
REPO_URL="<TU_REPO_GIT>" # Cambia esto por la URL real de tu repo
BRANCH="main" # Cambia si usas otra rama

# Clonar o actualizar el repo
echo "==> Desplegando código en $WEBROOT"
if [ ! -d "$WEBROOT/.git" ]; then
    echo "Clonando repo..."
    git clone "$REPO_URL" "$WEBROOT"
else
    echo "Actualizando repo..."
    cd "$WEBROOT"
    git pull origin "$BRANCH"
fi

# Instalar Composer si no está
if ! command -v composer &> /dev/null; then
    echo "Instalando Composer..."
    EXPECTED_SIGNATURE=$(wget -q -O - https://composer.github.io/installer.sig)
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    ACTUAL_SIGNATURE=$(php -r "echo hash_file('SHA384', 'composer-setup.php');")
    if [ "$EXPECTED_SIGNATURE" != "$ACTUAL_SIGNATURE" ]; then
        >&2 echo 'ERROR: Invalid installer signature'
        rm composer-setup.php
        exit 1
    fi
    php composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm composer-setup.php
fi

# Instalar dependencias si hay composer.json
if [ -f "$WEBROOT/composer.json" ]; then
    echo "Instalando dependencias con Composer..."
    cd "$WEBROOT"
    composer install --no-dev --optimize-autoloader
fi

# Ajustar permisos
find "$WEBROOT" -type d -exec chmod 755 {} \;
find "$WEBROOT" -type f -exec chmod 644 {} \;
chown -R www-data:www-data "$WEBROOT"

# Limpieza opcional de cachés
# rm -rf "$WEBROOT/cache/*"

echo "==> Despliegue completado con éxito." 