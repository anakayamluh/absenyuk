#!/bin/bash

# Absenlah - Production Setup Script for Ubuntu Server
# Strictly excluding Google Maps API tokens as per requirement.

set -e

echo "🚀 Starting Absenlah Enterprise Setup..."

# 1. Update & Install Dependencies
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# 2. Purge Old Containers
echo "🧹 Purging old containers..."
docker-compose down || true
docker system prune -f

# 3. Configure Environment Variables
echo "⚙️ Configuring environment..."
cat <<EOF > .env
EXPO_PUBLIC_BACKEND_URL=https://api.absenlah.com
JWT_SECRET=$(openssl rand -base64 32)
PB_VERSION=0.22.20
EOF

# 4. Build and Run Docker Stack
echo "🐳 Starting Docker stack..."
docker-compose up -d --build

# 5. Nginx Reverse Proxy Configuration
echo "🌐 Configuring Nginx..."
cat <<EOF | sudo tee /etc/nginx/sites-available/absenlah
server {
    listen 80;
    server_name api.absenlah.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/absenlah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Setup complete! Absenlah Backend is running at http://localhost:8080"
echo "👉 Don't forget to run 'certbot --nginx' to enable SSL."
