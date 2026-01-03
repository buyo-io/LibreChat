# LibreChat Deployed Instance Documentation - UPDATED

**Deployment Date:** December 30, 2025  
**Server:** buyo-ai (185.204.171.86)  
**Primary Domain:** https://chat.buyoai.co  
**Previous Domain:** https://chat.msc72m.ir (deprecated)  
**Status:** ✅ Active and Running

---

## 📋 Table of Contents

1. [Quick Access](#quick-access)
2. [Deployment Architecture](#deployment-architecture)
3. [Admin Credentials](#admin-credentials)
4. [Deployment Structure](#deployment-structure)
5. [Running Services](#running-services)
6. [Configuration Details](#configuration-details)
7. [Management Commands](#management-commands)
8. [Monitoring & Logs](#monitoring--logs)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)
11. [SSL Certificate](#ssl-certificate)
12. [Security](#security)
13. [Domain Change History](#domain-change-history)

---

## 🚀 Quick Access

### Server Connection
```bash
ssh ubuntu@185.204.171.86
cd /opt/libre-chat
```

### Access LibreChat
- **Primary URL:** https://chat.buyoai.co
- **Admin Email:** `admin@buyo.co`
- **Admin Password:** `KB/ehqnRquJX5o/w06bmOI0FK+N0UAEU/k/IMgQ5Y6E=` (256-bit secure random string)
- **Email Verified:** Yes

### View Status
```bash
sudo docker compose ps
```

---

## 🏗️ Deployment Architecture

### Network Flow
```
Internet (HTTPS)
    ↓
Host NGINX (Port 443)
    ↓ SSL Termination & Reverse Proxy
    ↓
127.0.0.1:3080 (LibreChat API Container)
    ↓
├─ MongoDB:27017 (Local, Authenticated)
├─ Meilisearch:7700 (Search Index)
├─ PostgreSQL:5432 + pgvector (Vector DB for RAG)
└─ RAG API:8000 (Document Processing)
```

---

## 🔐 Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@buyo.co` |
| **Password** | `KB/ehqnRquJX5o/w06bmOI0FK+N0UAEU/k/IMgQ5Y6E=` |
| **Email Verified** | Yes |
| **Registration** | Closed (Admin-only creation) |

### ⚠️ Important
- This password is a salted hash stored in MongoDB
- Keep this file in a secure location
- Change this password immediately after first login
- See [Create New Users](#create-new-users) to add more accounts

---

## 📁 Deployment Structure

```
/opt/libre-chat/
├── docker-compose.yml          # Docker service definitions (registry images only)
├── .env                       # Environment variables & secrets
├── librechat.yaml              # LibreChat application configuration
│
├── data-node/                  # MongoDB persistent data
│   └── [MongoDB database files]
│
├── pgdata/                     # PostgreSQL persistent data
│   └── [PostgreSQL database files]
│
├── meili_data_v1.12/           # Meilisearch search index
│   └── [Search index files]
│
├── uploads/                    # User file uploads
│   └── [User uploaded documents]
│
├── images/                     # User images & avatars
│   └── [Image files]
│
└── logs/                       # Application logs
    └── [Log files]
```

### Key Files

**docker-compose.yml** - Defines all 5 containers:
- librechat-api (Main application)
- librechat-mongodb (Database)
- librechat-meilisearch (Search engine)
- librechat-vectordb (PostgreSQL + pgvector)
- librechat-rag-api (Document processor)

**.env** - Contains:
- AvalaAI API credentials
- JWT and encryption secrets (random, secure)
- Database credentials
- **NEW DOMAIN VARIABLES:**
  ```bash
  DOMAIN_CLIENT=https://chat.buyoai.co
  DOMAIN_SERVER=https://chat.buyoai.co
  ```

**librechat.yaml** - LibreChat configuration:
- Interface settings
- AvalaAI endpoint configuration
- Registration settings (closed)
- Available models list (fetch disabled due to timeout)

---

## 🧠 Running Services

### Container Status
All 5 containers are running:

```
NAME                    STATUS              PORTS
librechat-api           Up >30 minutes      127.0.0.1:3080->3080/tcp
librechat-mongodb       Up >30 minutes      27017/tcp
librechat-meilisearch   Up >30 minutes      7700/tcp
librechat-vectordb      Up >30 minutes      5432/tcp
librechat-rag-api       Up >30 minutes      (internal)
```

### Service Dependencies

```
librechat-api
├── depends_on: mongodb, meilisearch, rag_api
├── environment: MONGO_URI, MEILI_HOST, RAG_API_URL
├── DOMAIN_CLIENT: https://chat.buyoai.co
├── DOMAIN_SERVER: https://chat.buyoai.co

librechat-rag-api
└── depends_on: vectordb
├── DB_HOST=vectordb
├── POSTGRES_DB=librechat
├── POSTGRES_USER=librechat
├── POSTGRES_PASSWORD=secure
```

---

## ⚙️ Configuration Details

### AvalaAI Integration

**Endpoint Configuration:**
```yaml
endpoints:
  custom:
    - name: 'AvalaAI'
      apiKey: '${OPENAI_API_KEY}'
      baseURL: '${OPENAI_REVERSE_PROXY}'
      models:
        default:
          - 'gpt-4'
          - 'gpt-3.5-turbo'
          - 'gpt-4-turbo'
          - 'gpt-4o'
          - 'gpt-4o-mini'
          - 'gpt-3.5-turbo'
        fetch: false  # Disabled due to AvalaAI timeout issues
      titleConvo: true
      titleModel: 'gpt-3.5-turbo'
      modelDisplayLabel: 'AvalaAI'
```

**Environment Variables:**
```bash
OPENAI_API_KEY=aa-Y5hEYDx5RaXL39wfje5p6FyDr9u26J4RKJuswYfMazqDMpz3
OPENAI_REVERSE_PROXY=https://api.avalai.ir/v1
```

**Note:** Model fetching disabled due to AvalaAI API timeout on `/models` endpoint. All available models are listed manually.

### MongoDB Authentication

```bash
Username: librechat
Password: 1AjGSG0yx3dSLhWjhLB31SVFdRFu5aJ8
Database: LibreChat
Auth Source: admin
Connection URI: mongodb://librechat:***@mongodb:27017/LibreChat?authSource=admin
```

### PostgreSQL (RAG Vector Database)

```bash
Database: librechat
Username: librechat
Password: Tj5qbrSx4a9GmEJrxrygo6dpmxgiiKVV
Host: vectordb (127.0.0.1 from host)
Port: 5432
```

### Security Secrets (Generated)

```bash
CREDS_KEY          - 32-byte encryption key (hex)
CREDS_IV           - 16-byte IV (hex)
JWT_SECRET         - JWT signing key (32-byte hex)
JWT_REFRESH_SECRET - JWT refresh key (32-byte hex)
MEILI_MASTER_KEY   - Meilisearch master key
OPENAI_API_KEY     - AvalaAI credentials
MongoDB password   - Database authentication
PostgreSQL password - RAG database authentication
```

---

## 📝 Management Commands

### Service Management

**Check status of all containers:**
```bash
cd /opt/libre-chat
sudo docker compose ps
```

**Start all services:**
```bash
cd /opt/libre-chat
sudo docker compose up -d
```

**Stop all services:**
```bash
cd /opt/libre-chat
sudo docker compose down
```

**Restart specific service:**
```bash
cd /opt/libre-chat
sudo docker compose restart api      # Restart API
sudo docker compose restart mongodb  # Restart MongoDB
```

**Restart all services:**
```bash
cd /opt/libre-chat
sudo docker compose restart
```

### User Management

**List all users:**
```bash
cd /opt/libre-chat
sudo docker exec -w /app librechat-api node config/list-users.js
```

**Create new user:**
```bash
cd /opt/libre-chat
sudo docker exec -w /app librechat-api node config/create-user.js \
  user@example.com "User Full Name" username "StrongPassword123!" --email-verified=true
```

**Delete user:**
```bash
cd /opt/libre-chat
sudo docker exec -w /app librechat-api node config/delete-user.js user@example.com
```

**Change user password:**
```bash
cd /opt/libre-chat
sudo docker exec -w /app librechat-api node config/reset-password.js user@example.com
```

### Image Management

**Pull latest images:**
```bash
cd /opt/libre-chat
sudo docker compose pull
```

**Update to latest version:**
```bash
cd /opt/libre-chat
sudo docker compose pull
sudo docker compose down
sudo docker compose up -d
```

**Remove unused images:**
```bash
sudo docker image prune -a --force
```

---

## 🔍 Monitoring & Logs

### View Real-time Logs

**All services:**
```bash
cd /opt/libre-chat
sudo docker compose logs -f
```

**Specific service:**
```bash
cd /opt/libre-chat
sudo docker compose logs -f api           # API logs
sudo docker compose logs -f mongodb       # MongoDB logs
sudo docker compose logs -f rag_api       # RAG API logs
sudo docker compose logs -f meilisearch   # Search engine logs
```

**Last N lines:**
```bash
cd /opt/libre-chat
sudo docker compose logs api --tail 50    # Last 50 lines
```

### Application Logs (Persistent)

Logs are also saved to disk:
```bash
/opt/libre-chat/logs/                     # API application logs
```

### Monitor Resource Usage

**Real-time resource stats:**
```bash
sudo docker stats --no-stream
```

**Container disk usage:**
```bash
sudo du -sh /opt/libre-chat/*
```

**System disk space:**
```bash
df -h /opt/libre-chat
```

### Check Health

**Container health:**
```bash
cd /opt/libre-chat
sudo docker compose ps
```

**Network connectivity:**
```bash
cd /opt/libre-chat
sudo docker compose exec api ping mongodb    # Should respond
sudo docker compose exec api ping meilisearch
```

---

## 💾 Backup & Recovery

### What to Backup

**Critical Data:**
1. **MongoDB Data** - All conversations, users, configs
2. **PostgreSQL Data** - Vector embeddings for RAG
3. **Meilisearch Index** - Search index (can be rebuilt)
4. **User Uploads** - Uploaded documents
5. **Configuration** - .env and librechat.yaml

### Backup Locations

```
/opt/libre-chat/data-node/               # MongoDB
/opt/libre-chat/pgdata/                  # PostgreSQL
/opt/libre-chat/meili_data_v1.12/        # Meilisearch
/opt/libre-chat/uploads/                 # User uploads
/opt/libre-chat/.env                     # Secrets & config
/opt/libre-chat/librechat.yaml           # App config
```

### Manual Backup

**Full backup (all data):**
```bash
sudo tar -czf /home/ubuntu/librechat-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/libre-chat/data-node \
  /opt/libre-chat/pgdata \
  /opt/libre-chat/meili_data_v1.12 \
  /opt/libre-chat/uploads \
  /opt/libre-chat/.env \
  /opt/libre-chat/librechat.yaml
```

**Configuration only:**
```bash
sudo tar -czf /home/ubuntu/librechat-config-$(date +%Y%m%d).tar.gz \
  /opt/libre-chat/.env \
  /opt/libre-chat/librechat.yaml
```

**Database dump:**
```bash
cd /opt/libre-chat
sudo docker exec librechat-mongodb mongodump \
  -u librechat \
  -p '1AjGSG0yx3dSLhWjhLB31SVFdRFu5aJ8' \
  --authenticationDatabase admin \
  -d LibreChat \
  -o /tmp/librechat-dump
```

---

## 🐛 Troubleshooting

### Container won't start

**Check logs:**
```bash
cd /opt/libre-chat
sudo docker compose logs api
```

**Common issues:**
- Port 3080 already in use
- MongoDB not ready
- Missing environment variables

**Solution:**
```bash
cd /opt/libre-chat
sudo docker compose down
sleep 10
sudo docker compose up -d
```

### Database connection errors

**Check MongoDB:**
```bash
cd /opt/libre-chat
sudo docker exec librechat-mongodb mongosh \
  -u librechat \
  -p '1AjGSG0yx3dSLhWjhLB31SVFdRFu5aJ8' \
  --authenticationDatabase admin \
  LibreChat
```

**Check PostgreSQL:**
```bash
cd /opt/libre-chat
sudo docker exec librechat-vectordb psql \
  -U librechat \
  -d librechat \
  -c "SELECT version();"
```

### API not responding

**Check if container is running:**
```bash
cd /opt/libre-chat
sudo docker compose ps api
```

**Restart API:**
```bash
cd /opt/libre-chat
sudo docker compose restart api
```

**Check API logs:**
```bash
cd /opt/libre-chat
sudo docker compose logs api --tail 100
```

### NGINX/SSL issues

**Check NGINX syntax:**
```bash
sudo nginx -t
```

**Reload NGINX:**
```bash
sudo systemctl reload nginx
```

**Check NGINX logs:**
```bash
sudo tail -f /var/log/nginx/librechat-access.log
sudo tail -f /var/log/nginx/librechat-error.log
```

### SSL certificate issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Renew certificate manually:**
```bash
sudo certbot renew --force-renewal -d chat.buyoai.co
```

**Check certificate details:**
```bash
openssl s_client -connect chat.buyoai.co:443 -showcerts
```

### Disk space issues

**Check usage:**
```bash
df -h
du -sh /opt/libre-chat/*
```

**Clean up Docker:**
```bash
sudo docker system prune -a --volumes
```

**Clean up old logs:**
```bash
sudo docker compose logs --tail 0 -f > /dev/null &
```

### RAG API connection issues

**Check if RAG API is running:**
```bash
cd /opt/libre-chat
sudo docker compose ps rag_api
```

**Check RAG API logs:**
```bash
cd /opt/libre-chat
sudo docker compose logs rag_api --tail 50
```

**Test RAG API endpoint:**
```bash
cd /opt/libre-chat
sudo docker compose exec api curl http://rag_api:8000/health
```

---

## 🔒 SSL Certificate

### Certificate Details

| Property | Value |
|----------|-------|
| **Domain** | chat.buyoai.co |
| **Provider** | Let's Encrypt |
| **Expiration** | Auto-renewing |
| **Path** | `/etc/letsencrypt/live/buyo.msc72m.ir/` |
| **Renewal** | Automatic (certbot) |

### Certificate Status

```
Status: Active ✅
Auto-renewal: Enabled ✅
Last Renewal: December 30, 2025
Next Renewal: March 30, 2026 (automatic)
```

**Certificate Commands**

**Manual renewal:**
```bash
sudo certbot renew --dry-run        # Test renewal
sudo certbot renew                  # Actually renew
```

**Check status:**
```bash
sudo certbot certificates
```

### NGINX Configuration

Location: `/etc/nginx/sites-available/librechat`

Key features:
- ✅ HTTP to HTTPS redirect
- ✅ SSL/TLS 1.2 and 1.3
- ✅ HSTS header (63072000 seconds)
- ✅ Strong cipher suites
- ✅ Let's Encrypt ACME challenge support
- ✅ Domain: chat.buyoai.co

---

## 🔐 Security

### Access Control

- ✅ **Registration Closed** - Only admin can create accounts
- ✅ **Email Verification** - Users must verify email
- ✅ **Rate Limiting** - API rate limits enabled
- ✅ **HTTPS Enforced** - All traffic redirected to HTTPS
- ✅ **Database Auth** - MongoDB requires authentication
- ✅ **Strong Secrets** - Random 32-byte encryption keys
- ✅ **Container Isolation** - All ports bound to localhost

### Secrets Management

All secrets are stored in `.env` file in `/opt/libre-chat/`:

```bash
CREDS_KEY          - 32-byte encryption key (hex)
CREDS_IV           - 16-byte IV (hex)
JWT_SECRET         - JWT signing key (32-byte hex)
JWT_REFRESH_SECRET - JWT refresh key (32-byte hex)
MEILI_MASTER_KEY   - Meilisearch master key
OPENAI_API_KEY     - AvalaAI credentials
MongoDB password   - Database authentication
PostgreSQL password - RAG database authentication
```

### Best Practices

1. **Change default admin password** immediately
2. **Restrict SSH access** to trusted IPs only
3. **Enable 2FA** if possible
4. **Rotate secrets** periodically
5. **Monitor logs** for suspicious activity
6. **Keep backups** in secure location
7. **Update Docker images** regularly
8. **Review NGINX logs** for attacks

### Firewall Rules (Recommended)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other traffic
sudo ufw default deny incoming
sudo ufw enable
```

### Port Exposure

**Exposed (via NGINX):**
- 80 (HTTP) → 443 (HTTPS)
- 443 (HTTPS) → API container

**NOT exposed:**
- 3080 (API) - localhost only
- 27017 (MongoDB) - localhost only
- 5432 (PostgreSQL) - localhost only
- 7700 (Meilisearch) - localhost only
- 8000 (RAG API) - internal only

---

## 📊 System Information

### Server Specs
```
Hostname: buyo-ai
IP Address: 185.204.171.86
OS: Ubuntu (Linux)
Docker Version: 29.1.3
Docker Compose Version: v5.0.0
Kernel: 6.8.0-90-generic
Total RAM: 7.8GB
Total Disk: 70GB
Available Disk: 55GB
```

### Current Resource Usage

```
RAM Used: ~2-3GB
Disk Used: ~15GB
CPU Usage: Low (scales with requests)
```

---

## 📜 Domain Change History

### Previous Domain: chat.msc72m.ir
- **Reason for change:** User requested domain change to chat.buyoai.co
- **Change Date:** December 30, 2025
- **Status:** Successfully decommissioned

### New Domain: chat.buyoai.co
- **Deployment Date:** December 30, 2025
- **Status:** ✅ Active and operational
- **SSL Status:** Let's Encrypt certificate obtained and configured
- **NGINX Configuration:** Updated with new domain paths
- **LibreChat Configuration:** Domain variables updated in .env and librechat.yaml

### Change Process Summary

1. ✅ **SSL Certificate Removal:** Old certificate for chat.msc72m.ir deleted
2. ✅ **New SSL Certificate:** Obtained for chat.buyoai.co via Let's Encrypt
3. ✅ **NGINX Configuration:** Updated with new domain and certificate paths
4. ✅ **LibreChat Configuration:** Domain variables updated to reflect new domain
5. ✅ **Service Restart:** LibreChat API restarted with new configuration
6. ✅ **Verification:** New domain accessible (HTTPS certificate functional)

### Important Notes

- **DNS Propagation:** Required proper A record pointing to 185.204.171.86
- **Certificate Auto-renewal:** Enabled via certbot for chat.buyoai.co
- **Rollback Plan:** Keep previous NGINX config as backup if needed
- **Data Integrity:** No data loss during domain change (same databases, containers, users)

---

## 📞 Monitoring & Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check disk usage
- Verify all containers are running

**Weekly:**
- Review user activity
- Check backups completed
- Monitor resource trends

**Monthly:**
- Update Docker images
- Review security logs
- Audit user accounts

**Quarterly:**
- Full security audit
- Update documentation
- Test disaster recovery

---

## 🎯 Deployment Checklist

- ✅ Docker containers installed and running
- ✅ MongoDB with authentication enabled
- ✅ PostgreSQL with pgvector configured
- ✅ Meilisearch search engine active
- ✅ RAG API document processor running
- ✅ LibreChat API responding on localhost:3080
- ✅ NGINX reverse proxy configured for chat.buyoai.co
- ✅ SSL certificate installed and valid
- ✅ Admin user created with secure password
- ✅ AvalaAI endpoint configured
- ✅ Registration closed
- ✅ Automatic security updates enabled
- ✅ All containers auto-restart on failure
- ✅ Logs configured and accessible
- ✅ Backup strategy documented
- ✅ Complete documentation updated

---

## 🚀 Next Steps

### Immediate Actions

1. ✅ **Access LibreChat:** Login at https://chat.buyoai.co with admin@buyo.co
2. ✅ **Change Admin Password:** First-time login password change required
3. ✅ **Create User Accounts:** Use CLI commands for additional users as needed
4. ✅ **Set Up Backups:** Implement automated backup schedule
5. ✅ **Monitor Performance:** Check logs and resource usage periodically

### Optional Enhancements

1. **Add Custom Agent Models:** Consider adding custom endpoints for specialized models
2. **Enable MCP Servers:** For advanced agent capabilities and tools
3. **Configure Monitoring:** Set up additional monitoring and alerting
4. **Implement CI/CD:** Set up automated deployment updates
5. **Load Balancing:** Consider multiple backend instances for scaling

---

## 🔗 Support Information

### Quick Commands Reference

```bash
# Connect to server
ssh ubuntu@185.204.171.86

# Navigate to deployment
cd /opt/libre-chat

# Check all containers
sudo docker compose ps

# View logs
sudo docker compose logs -f

# Restart services
sudo docker compose restart

# Create new user
sudo docker exec -w /app librechat-api node config/create-user.js \
  user@example.com "Name" username "password" --email-verified=true

# Backup configuration
sudo tar -czf backup-$(date +%Y%m%d).tar.gz .env librechat.yaml

# Test SSL certificate
openssl s_client -connect chat.buyoai.co:443 -showcerts
```

---

**Last updated:** December 30, 2025  
**Documentation Version:** 2.0  
**Status:** ✅ Deployment Complete with Domain Change