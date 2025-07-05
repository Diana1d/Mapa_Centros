# Imagen base con PHP y Apache
FROM php:8.2-apache

# Copia todo el contenido del proyecto al directorio del servidor web
COPY . /var/www/html/

# Habilita el módulo de reescritura si usas URLs amigables
RUN a2enmod rewrite

# Configuración opcional (ajusta según tus necesidades)
# Establece permisos si fuera necesario
# RUN chown -R www-data:www-data /var/www/html

# Exponer el puerto 80 (el estándar para HTTP)
EXPOSE 80
