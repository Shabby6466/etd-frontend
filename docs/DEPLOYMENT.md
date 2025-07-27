# ETD System Deployment Guide

This guide provides step-by-step instructions for deploying the ETD System in production environments.

## 📋 Pre-Deployment Checklist

### System Requirements

**Server Specifications:**
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Storage: 20GB+ SSD
- OS: Linux (Ubuntu 20.04+ or CentOS 8+)

**Software Requirements:**
- Node.js 14.0.0+
- npm 6.0.0+
- Web server (Nginx/Apache)
- SSL Certificate
- Domain name

### Security Prerequisites

- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Security headers implemented
- [ ] Access logs enabled
- [ ] Backup strategy in place

## 🚀 Deployment Steps

### 1. Server Preparation

**Update System:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx nodejs npm git -y
```

**Create Application User:**
```bash
sudo adduser etd-system
sudo usermod -aG www-data etd-system
```

**Create Directory Structure:**
```bash
sudo mkdir -p /var/www/etd-system
sudo chown etd-system:www-data /var/www/etd-system
sudo chmod 755 /var/www/etd-system
```

### 2. Application Setup

**Clone Repository:**
```bash
cd /var/www/etd-system
git clone https://github.com/agency/etd-system.git .
```

**Install Dependencies:**
```bash
npm install --production
```

**Build Application:**
```bash
NODE_ENV=production npm run build
```

**Set Permissions:**
```bash
sudo chown -R etd-system:www-data /var/www/etd-system
sudo chmod -R 755 /var/www/etd-system
```

### 3. Web Server Configuration

**Nginx Configuration (`/etc/nginx/sites-available/etd-system`):**
```nginx
# ETD System Production Configuration
server {
    listen 80;
    server_name etd.gov.pk www.etd.gov.pk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name etd.gov.pk www.etd.gov.pk;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/etd.gov.pk.crt;
    ssl_certificate_key /etc/ssl/private/etd.gov.pk.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:;" always;

    # Document Root
    root /var/www/etd-system/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/etd-system.access.log;
    error_log /var/log/nginx/etd-system.error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static Asset Caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # HTML Caching
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Handle SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Endpoints (future)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~* \.(env|log|config)$ {
        deny all;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/etd-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate Setup

**Using Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d etd.gov.pk -d www.etd.gov.pk
```

**Auto-renewal:**
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Security Configuration

**Firewall Setup:**
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

**Fail2Ban Configuration:**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 6. Monitoring Setup

**Create Log Rotation:**
```bash
sudo vi /etc/logrotate.d/etd-system
```

```
/var/log/nginx/etd-system.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

**System Monitoring:**
```bash
# Install htop for system monitoring
sudo apt install htop iotop -y

# Create monitoring script
sudo vi /usr/local/bin/etd-monitor.sh
```

```bash
#!/bin/bash
# ETD System Health Check
LOG_FILE="/var/log/etd-system-health.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$TIMESTAMP - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "$TIMESTAMP - WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "$TIMESTAMP - ERROR: Nginx is not running" >> $LOG_FILE
    systemctl start nginx
fi

# Check website accessibility
if ! curl -s -o /dev/null -w "%{http_code}" https://etd.gov.pk | grep -q "200"; then
    echo "$TIMESTAMP - ERROR: Website is not accessible" >> $LOG_FILE
fi
```

**Make executable and add to cron:**
```bash
sudo chmod +x /usr/local/bin/etd-monitor.sh
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/etd-monitor.sh
```

## 🔄 Update Process

### Application Updates

**1. Backup Current Version:**
```bash
cp -r /var/www/etd-system /var/backups/etd-system-$(date +%Y%m%d)
```

**2. Pull Latest Changes:**
```bash
cd /var/www/etd-system
git pull origin main
```

**3. Install Dependencies:**
```bash
npm install --production
```

**4. Build Application:**
```bash
NODE_ENV=production npm run build
```

**5. Test and Deploy:**
```bash
# Test configuration
sudo nginx -t

# Reload services
sudo systemctl reload nginx
```

### Rollback Process

**If issues occur, rollback:**
```bash
# Stop services
sudo systemctl stop nginx

# Restore backup
rm -rf /var/www/etd-system
cp -r /var/backups/etd-system-YYYYMMDD /var/www/etd-system

# Restart services
sudo systemctl start nginx
```

## 📊 Performance Optimization

### Database Optimization (Future)

**For when API is implemented:**
```sql
-- Index optimization
CREATE INDEX idx_tracking_id ON documents(tracking_id);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_created_date ON documents(created_date);
```

### CDN Configuration

**For static assets:**
```nginx
# In nginx.conf
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    # Add CDN headers
    add_header X-CDN-Cache "HIT";
    expires 1y;
}
```

### Performance Monitoring

**Install performance monitoring tools:**
```bash
# Install New Relic agent
curl -Ls https://download.newrelic.com/install/install.sh | bash
sudo NEW_RELIC_API_KEY="YOUR_API_KEY" NEW_RELIC_ACCOUNT_ID="YOUR_ACCOUNT_ID" /usr/local/bin/newrelic install
```

## 🔒 Security Hardening

### Additional Security Measures

**1. Hide Server Information:**
```nginx
# In nginx.conf
server_tokens off;
```

**2. Rate Limiting:**
```nginx
# In nginx.conf
http {
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    server {
        location /src/pages/auth/login.html {
            limit_req zone=login burst=3 nodelay;
        }
    }
}
```

**3. IP Whitelisting (if needed):**
```nginx
# Allow specific IPs only
allow 192.168.1.0/24;
allow 10.0.0.0/8;
deny all;
```

**4. Security Updates:**
```bash
# Set up automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🚨 Troubleshooting

### Common Issues

**1. 502 Bad Gateway:**
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify file permissions
- Check if application is running

**2. SSL Certificate Issues:**
- Verify certificate files exist
- Check certificate expiration: `openssl x509 -in /etc/ssl/certs/etd.gov.pk.crt -text -noout`
- Renew certificate: `sudo certbot renew`

**3. High Memory Usage:**
- Check running processes: `htop`
- Restart nginx: `sudo systemctl restart nginx`
- Clear log files if too large

**4. Slow Page Loading:**
- Check server resources
- Verify gzip compression is working
- Optimize images and assets

### Emergency Procedures

**Service Restart:**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

**Emergency Maintenance Mode:**
```nginx
# Create maintenance page
server {
    listen 80 default_server;
    return 503;
    error_page 503 @maintenance;
    
    location @maintenance {
        root /var/www/maintenance;
        rewrite ^(.*)$ /maintenance.html break;
    }
}
```

## 📞 Support Contacts

**Emergency Contact:**
- System Administrator: admin@gov.pk
- Development Team: dev-team@gov.pk
- Network Operations: netops@gov.pk

**Escalation Process:**
1. Level 1: System Administrator
2. Level 2: Development Team Lead
3. Level 3: IT Director

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Review Schedule:** Quarterly 