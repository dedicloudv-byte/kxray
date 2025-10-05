# Use a lightweight Nginx image as the base
FROM nginx:alpine

# Install necessary packages and download X-ray
RUN apk add --no-cache curl unzip \
    && curl -L -H "Cache-Control: no-cache" -o /tmp/xray.zip https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip \
    && unzip /tmp/xray.zip -d /usr/local/bin/ \
    && rm /tmp/xray.zip \
    && chmod +x /usr/local/bin/xray

# Create directories for X-ray config and web content
RUN mkdir -p /etc/xray /var/www/public

# Copy the static web files
COPY public/ /var/www/public/

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /entrypoint.sh

# Set the entrypoint script as the command to run
CMD ["/entrypoint.sh"]