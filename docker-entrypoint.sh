#!/bin/sh
# Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
set -e

# Substitute environment variables into the nginx config template.
# Only substitute our custom variables — leave nginx's own $variables intact.
envsubst '${NGINX_SERVER_NAME} ${REACT_APP_API_URL}' \
  < /etc/nginx/templates/nginx.conf.template \
  > /etc/nginx/nginx.conf

echo "[entrypoint] NGINX_SERVER_NAME=${NGINX_SERVER_NAME:-localhost}"
echo "[entrypoint] REACT_APP_API_URL=${REACT_APP_API_URL:-__CODEPOST_API_URL_PLACEHOLDER__}"
echo "[entrypoint] Nginx config generated. Starting nginx..."

exec "$@"
