# Cloud Deployment Guide

## Overview

This guide covers deploying EduSphere's multi-tenant School ERP system to cloud platforms. Each school runs as an isolated instance with its own database.

---

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Google Cloud Deployment](#google-cloud-deployment)
7. [DigitalOcean Deployment](#digitalocean-deployment)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)

---

## Deployment Architecture

### Multi-Tenant Setup

```
┌──────────────────────────────────────────────────────────┐
│                  Load Balancer / CDN                      │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐    ┌──────────▼──────────┐
│  Admin Portal  │    │  School Instances    │
│                │    │                      │
│  - Frontend    │    │  School 1:          │
│  - Backend     │    │  - Frontend (Port)  │
│  - Admin DB    │    │  - Backend (Port)   │
└────────────────┘    │  - School DB        │
                      │                      │
                      │  School 2:          │
                      │  - Frontend (Port)  │
                      │  - Backend (Port)   │
                      │  - School DB        │
                      └─────────────────────┘
```

### Components

1. **Admin Portal**: Single instance managing all schools
2. **School Instances**: One per school (can share resources)
3. **PostgreSQL**: Multiple databases (1 admin + N schools)
4. **Redis**: Shared caching layer
5. **Object Storage**: File uploads (S3/GCS/Spaces)
6. **CDN**: Static asset delivery

---

## Prerequisites

### Required Tools

```bash
# Docker & Docker Compose
docker --version  # >= 24.0
docker-compose --version  # >= 2.0

# Node.js & npm
node --version  # >= 20.0
npm --version   # >= 10.0

# PostgreSQL Client
psql --version  # >= 15.0

# Git
git --version
```

### Domain Names

- Admin portal: `admin.yourdomain.com`
- School 1: `school1.yourdomain.com`
- School 2: `school2.yourdomain.com`

Or use subdomains dynamically:
- `{school-code}.yourdomain.com`

---

## Database Setup

### PostgreSQL Cloud Instances

#### Option 1: Managed PostgreSQL (Recommended)

**AWS RDS**:
```bash
# Instance: db.t3.medium (2 vCPU, 4GB RAM)
# Storage: 100GB GP3 SSD
# Backups: Automated daily
# Multi-AZ: Yes (for production)
```

**Google Cloud SQL**:
```bash
# Instance: db-n1-standard-2 (2 vCPU, 7.5GB RAM)
# Storage: 100GB SSD
# Backups: Automated daily
# High Availability: Yes
```

**DigitalOcean Managed Database**:
```bash
# Plan: 2 vCPU, 4GB RAM
# Storage: 80GB SSD
# Backups: Daily
# Standby: Optional
```

#### Option 2: Self-Hosted PostgreSQL

**Docker Compose** (`infra/docker/docker-compose.db.yml`):
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: edusphere-postgres
    environment:
      POSTGRES_USER: edusphere
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U edusphere"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: edusphere-pgbouncer
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: edusphere
      DATABASES_PASSWORD: ${DB_PASSWORD}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_data:
```

**Initial Database Setup** (`infra/docker/init-db.sh`):
```bash
#!/bin/bash
set -e

# Create admin database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE edusphere_admin;
EOSQL

echo "Admin database created successfully"
```

---

## Docker Deployment

### Building Docker Images

**Admin Frontend Dockerfile** (`Admin/client/Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

**Admin Backend Dockerfile** (`Admin/server/Dockerfile`):
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
```

### Docker Compose - Complete Stack

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: edusphere
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U edusphere"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Admin Backend
  admin-backend:
    build:
      context: ./Admin/server
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://edusphere:${DB_PASSWORD}@postgres:5432/edusphere_admin
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always

  # Admin Frontend
  admin-frontend:
    build:
      context: ./Admin/client
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://admin-backend:5000/api
    ports:
      - "3000:3000"
    depends_on:
      - admin-backend
    restart: always

  # School ERP Backend (Template - replicate per school)
  school-backend:
    build:
      context: ./erp/server
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://edusphere:${DB_PASSWORD}@postgres:5432/edusphere_school_demo
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      SCHOOL_ID: demo-school
      PORT: 5001
    ports:
      - "5001:5001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: always

  # School ERP Frontend (Template)
  school-frontend:
    build:
      context: ./erp/client
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://school-backend:5001/api
      NEXT_PUBLIC_SCHOOL_ID: demo-school
    ports:
      - "3001:3001"
    depends_on:
      - school-backend
    restart: always

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: edusphere-network
```

### Deployment Commands

```bash
# Clone repository
git clone https://github.com/yourusername/EduSphere.git
cd EduSphere

# Create .env file
cp .env.example .env
# Edit .env with your values

# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (caution!)
docker-compose down -v
```

---

## AWS Deployment

### Architecture

```
Route53 (DNS) → CloudFront (CDN) → ALB → ECS/EC2
                                     └─→ RDS PostgreSQL
                                     └─→ ElastiCache Redis
                                     └─→ S3 (Files)
```

### Step 1: VPC Setup

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24  # Public
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24  # Private
```

### Step 2: RDS PostgreSQL

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name edusphere-db-subnet \
  --subnet-ids subnet-xxx subnet-yyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier edusphere-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.5 \
  --master-username edusphere \
  --master-user-password ${DB_PASSWORD} \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-subnet-group-name edusphere-db-subnet \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false
```

### Step 3: ECS Deployment

**Task Definition** (`aws-ecs-task-admin.json`):
```json
{
  "family": "edusphere-admin",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "admin-backend",
      "image": "yourrepo/edusphere-admin-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@host:5432/db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/edusphere-admin",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Deploy:**
```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://aws-ecs-task-admin.json

# Create service
aws ecs create-service \
  --cluster edusphere-cluster \
  --service-name admin-backend \
  --task-definition edusphere-admin \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Step 4: Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name edusphere-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target group
aws elbv2 create-target-group \
  --name edusphere-admin-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 5: S3 for File Storage

```bash
# Create S3 bucket
aws s3 mb s3://edusphere-files

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket edusphere-files \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set CORS
aws s3api put-bucket-cors \
  --bucket edusphere-files \
  --cors-configuration file://cors.json
```

---

## Google Cloud Deployment

### Architecture

```
Cloud DNS → Cloud CDN → Load Balancer → GKE/Compute Engine
                                       └─→ Cloud SQL
                                       └─→ Memorystore Redis
                                       └─→ Cloud Storage
```

### Step 1: Cloud SQL Setup

```bash
# Create instance
gcloud sql instances create edusphere-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-2 \
  --region=us-central1 \
  --backup \
  --backup-start-time=03:00

# Create database
gcloud sql databases create edusphere_admin \
  --instance=edusphere-postgres

# Create user
gcloud sql users create edusphere \
  --instance=edusphere-postgres \
  --password=${DB_PASSWORD}
```

### Step 2: GKE Deployment

**Kubernetes Deployment** (`k8s/admin-backend.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: admin-backend
  template:
    metadata:
      labels:
        app: admin-backend
    spec:
      containers:
      - name: admin-backend
        image: gcr.io/your-project/admin-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: admin-backend-service
spec:
  type: LoadBalancer
  selector:
    app: admin-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
```

**Deploy:**
```bash
# Build and push image
gcloud builds submit --tag gcr.io/your-project/admin-backend ./Admin/server

# Apply deployment
kubectl apply -f k8s/admin-backend.yaml

# Check status
kubectl get pods
kubectl get services
```

---

## DigitalOcean Deployment

### Architecture

```
DNS → Spaces CDN → Load Balancer → Droplets/App Platform
                                   └─→ Managed Database
                                   └─→ Spaces (Storage)
```

### Option 1: App Platform (Easiest)

**App Spec** (`.do/app.yaml`):
```yaml
name: edusphere
region: nyc
services:
  - name: admin-backend
    github:
      repo: yourusername/EduSphere
      branch: main
      deploy_on_push: true
    source_dir: /Admin/server
    build_command: npm install && npx prisma generate
    run_command: npm start
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: professional-xs
    http_port: 5000
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${edusphere-db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        type: SECRET
        value: ${JWT_SECRET}

  - name: admin-frontend
    github:
      repo: yourusername/EduSphere
      branch: main
    source_dir: /Admin/client
    build_command: npm install && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: professional-xs
    http_port: 3000
    envs:
      - key: NEXT_PUBLIC_API_URL
        scope: BUILD_AND_RUN_TIME
        value: ${admin-backend.PUBLIC_URL}/api

databases:
  - name: edusphere-db
    engine: PG
    version: "15"
    size: db-s-2vcpu-4gb
    num_nodes: 1
```

**Deploy:**
```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml

# Monitor deployment
doctl apps list
doctl apps logs <app-id>
```

### Option 2: Droplets (Manual)

```bash
# Create droplet
doctl compute droplet create edusphere-app \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc1

# SSH into droplet
doctl compute ssh edusphere-app

# Install dependencies
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot

# Clone repo and deploy
git clone https://github.com/yourusername/EduSphere.git
cd EduSphere
docker-compose up -d
```

---

## SSL/TLS Configuration

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d admin.yourdomain.com -d school1.yourdomain.com

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

### Nginx Configuration

**File:** `/etc/nginx/sites-available/edusphere`

```nginx
# Admin Portal
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### Using Prometheus + Grafana

**Docker Compose Addition**:
```yaml
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
```

### Application Logging

**Winston Logger** (`server/utils/logger.js`):
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

---

## Backup & Recovery

### Automated Database Backups

**Backup Script** (`scripts/backup-db.sh`):
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_HOST="localhost"
DB_USER="edusphere"

# Backup admin database
pg_dump -h $DB_HOST -U $DB_USER edusphere_admin > $BACKUP_DIR/admin_$DATE.sql

# Backup all school databases
psql -h $DB_HOST -U $DB_USER -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'edusphere_school_%';" | while read db; do
  pg_dump -h $DB_HOST -U $DB_USER $db > $BACKUP_DIR/${db}_$DATE.sql
done

# Upload to S3
aws s3 sync $BACKUP_DIR s3://edusphere-backups/$(date +%Y/%m/%d)/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

**Cron Job**:
```bash
0 3 * * * /opt/scripts/backup-db.sh
```

---

## Cost Estimation

### AWS (Monthly)
- EC2 (2x t3.medium): $60
- RDS (db.t3.medium): $60
- ALB: $20
- S3: $10
- Data Transfer: $50
- **Total: ~$200/month** (for 5 schools)

### Google Cloud (Monthly)
- GKE (3 nodes, n1-standard-2): $140
- Cloud SQL (db-n1-standard-2): $90
- Cloud Storage: $10
- Load Balancer: $20
- **Total: ~$260/month**

### DigitalOcean (Monthly)
- App Platform (Professional): $12/container × 4 = $48
- Managed Database (4GB): $60
- Spaces: $5
- **Total: ~$113/month**

---

## Next Steps

1. Choose cloud provider
2. Set up databases
3. Configure DNS
4. Deploy admin portal
5. Deploy first school instance
6. Configure SSL certificates
7. Set up monitoring
8. Test thoroughly
9. Create runbook for adding new schools
10. Train operations team

---

## Support

For deployment assistance:
- Email: devops@edusphere.com
- Docs: https://docs.edusphere.com/deployment
- Slack: #deployment-support
