#!/bin/sh

# Pastikan variabel yang diperlukan (UUID dan APP_URL) sudah diatur secara manual oleh pengguna
if [ -z "$UUID" ] || [ -z "$APP_URL" ]; then
  echo "Error: Variabel lingkungan UUID dan APP_URL harus diatur."
  echo "Silakan atur di konfigurasi layanan Koyeb Anda. Lihat README untuk instruksi."
  exit 1
fi

# Ekstrak nama aplikasi dari APP_URL untuk digunakan sebagai alias (nama koneksi)
APP_NAME=$(echo $APP_URL | sed -e 's|https://||' -e 's|\..*||')

# 1. Buat tautan VLESS yang akan ditampilkan di halaman web
DOMAIN=$(echo $APP_URL | sed 's|https://||')
VLESS_LINK="vless://${UUID}@${DOMAIN}:443?encryption=none&security=tls&type=ws&path=%2Fvless#${APP_NAME}"

# 2. Perbarui file HTML dengan tautan VLESS yang baru dibuat
sed -i "s|VLESS_LINK_PLACEHOLDER|${VLESS_LINK}|g" /var/www/public/index.html

# 3. Buat konfigurasi X-ray (tidak ada perubahan di sini)
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

# 4. Buat konfigurasi Nginx dengan port internal yang di-hardcode
# Koyeb akan secara otomatis merutekan lalu lintas dari port 80/443 ke port 8080 ini.
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
        listen 8080 default_server; # Diperbaiki: Gunakan port internal yang tetap
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