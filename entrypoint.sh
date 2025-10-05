#!/bin/sh

# Pastikan variabel yang diperlukan sudah diatur
if [ -z "$UUID" ] || [ -z "$KOYEB_APP_URL" ]; then
  echo "Error: Variabel lingkungan UUID dan KOYEB_APP_URL harus diatur."
  echo "Silakan atur di konfigurasi layanan Koyeb Anda."
  exit 1
fi

# Koyeb menyediakan nama aplikasi, tetapi kita siapkan cadangan.
APP_NAME=${KOYEB_APP_NAME:-koyeb-vless}

# 1. Buat tautan VLESS
# Formatnya adalah vless://<uuid>@<alamat>:<port>?<opsi>#<alias>
# Koyeb menggunakan port 443 untuk lalu lintas HTTPS.
# Domain disediakan oleh KOYEB_APP_URL (kita hapus https://).
DOMAIN=$(echo $KOYEB_APP_URL | sed 's|https://||')
VLESS_LINK="vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&type=ws&path=%2Fvless#${APP_NAME}"

# 2. Perbarui file HTML dengan tautan VLESS
# Gunakan sed untuk mengganti placeholder. Gunakan pembatas yang berbeda karena tautan berisi garis miring.
sed -i "s|VLESS_LINK_PLACEHOLDER|${VLESS_LINK}|g" /var/www/public/index.html

# 3. Buat konfigurasi X-ray (tetap sama)
cat << EOF > /etc/xray/config.json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 10000,
      "listen": "127.0.0.1",
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "${UUID}"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "/vless"
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom"
    }
  ]
}
EOF

# 4. Buat konfigurasi Nginx (tetap sama)
cat << EOF > /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
pid /run/nginx.pid;
events {
    worker_connections 768;
}
http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen ${PORT} default_server;
        server_name _;

        location /vless {
            proxy_pass http://127.0.0.1:10000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }

        location / {
            root /var/www/public;
            index index.html;
        }
    }
}
EOF

# 5. Jalankan X-ray di latar belakang
/usr/local/bin/xray -config /etc/xray/config.json &

# 6. Jalankan Nginx di latar depan
nginx -g 'daemon off;'