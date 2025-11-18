# Deploy Guide - GCP (Google Cloud Platform)

Este guia detalha como fazer deploy do Nexus Framework no Google Cloud Platform usando diferentes serviços.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Arquitetura GCP](#arquitetura-gcp)
3. [Deploy com Cloud Run](#deploy-com-cloud-run)
4. [Deploy com Google Kubernetes Engine (GKE)](#deploy-com-google-kubernetes-engine-gke)
5. [Deploy com App Engine](#deploy-com-app-engine)
6. [Deploy com Compute Engine](#deploy-com-compute-engine)
7. [Configuração de Database (Cloud SQL)](#configuração-de-database-cloud-sql)
8. [Configuração de Cache (Memorystore)](#configuração-de-cache-memorystore)
9. [Configuração de Storage (Cloud Storage)](#configuração-de-storage-cloud-storage)
10. [CI/CD com Cloud Build](#cicd-com-cloud-build)
11. [Monitoramento e Logs](#monitoramento-e-logs)
12. [SSL/TLS e Domain](#ssltls-e-domain)
13. [Custos Estimados](#custos-estimados)

---

## 🔧 Pré-requisitos

### 1. Conta GCP
- Criar conta em [cloud.google.com](https://cloud.google.com)
- Ativar billing
- Criar projeto

### 2. Google Cloud SDK
```bash
# Instalar gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Inicializar
gcloud init

# Login
gcloud auth login

# Configurar projeto
gcloud config set project YOUR_PROJECT_ID
```

### 3. Habilitar APIs necessárias
```bash
gcloud services enable \
  run.googleapis.com \
  container.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com
```

### 4. Docker
```bash
# Configure Docker para GCR
gcloud auth configure-docker
```

---

## 🏗️ Arquitetura GCP

### Arquitetura Recomendada (Production)

```
┌─────────────────────────────────────────────────────────┐
│                Cloud DNS (Domain)                        │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│               Cloud CDN + Cloud Armor                    │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│          Cloud Load Balancing (HTTPS)                    │
└─────────┬──────────────────────────┬────────────────────┘
          │                          │
┌─────────▼──────────┐    ┌─────────▼──────────┐
│  Cloud Run         │    │  Cloud Run         │
│  (Container)       │    │  (Container)       │
│  Region A          │    │  Region B          │
└─────────┬──────────┘    └─────────┬──────────┘
          │                          │
          └──────────┬───────────────┘
                     │
        ┌────────────┴───────────────────────┐
        │                                    │
┌───────▼──────────┐            ┌───────────▼────────┐
│  Cloud SQL       │            │  Memorystore       │
│  (PostgreSQL)    │            │  (Redis)           │
│  HA Config       │            │                    │
└──────────────────┘            └────────────────────┘
        │
┌───────▼──────────┐
│  Cloud Storage   │
│  (Buckets)       │
└──────────────────┘
```

### Componentes

- **Cloud DNS**: Gerenciamento de DNS
- **Cloud CDN**: CDN global para assets estáticos
- **Cloud Load Balancing**: Load balancer HTTPS
- **Cloud Run**: Containers serverless
- **Cloud SQL**: PostgreSQL managed
- **Memorystore**: Redis managed
- **Cloud Storage**: Object storage
- **Cloud Logging**: Logs centralizados
- **Cloud Monitoring**: Métricas e alertas
- **Secret Manager**: Gerenciamento de secrets

---

## 🚀 Deploy com Cloud Run

### Método 1: Serverless Container (Recomendado)

#### 1. Build da Imagem

```bash
# Build usando Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/nexus-app

# Ou build local e push
docker build -t gcr.io/YOUR_PROJECT_ID/nexus-app .
docker push gcr.io/YOUR_PROJECT_ID/nexus-app
```

#### 2. Deploy para Cloud Run

```bash
# Deploy básico
gcloud run deploy nexus-app \
  --image gcr.io/YOUR_PROJECT_ID/nexus-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000

# Deploy com configurações avançadas
gcloud run deploy nexus-app \
  --image gcr.io/YOUR_PROJECT_ID/nexus-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 100 \
  --min-instances 1 \
  --concurrency 80 \
  --set-env-vars "NODE_ENV=production,PORT=3000" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,POSTGRES_PASSWORD=db-password:latest"
```

#### 3. Configurar Variáveis de Ambiente

```bash
# Atualizar env vars
gcloud run services update nexus-app \
  --region us-central1 \
  --set-env-vars "^@^NODE_ENV=production@PORT=3000@APP_URL=https://yourapp.com"

# Ou via arquivo YAML
cat > service.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: nexus-app
spec:
  template:
    spec:
      containers:
      - image: gcr.io/YOUR_PROJECT_ID/nexus-app
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: POSTGRES_HOST
          value: /cloudsql/PROJECT:REGION:INSTANCE
        resources:
          limits:
            memory: 1Gi
            cpu: "2"
EOF

gcloud run services replace service.yaml --region us-central1
```

#### 4. Conectar ao Cloud SQL

```bash
# Deploy com conexão Cloud SQL
gcloud run deploy nexus-app \
  --image gcr.io/YOUR_PROJECT_ID/nexus-app \
  --region us-central1 \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:nexus-db \
  --set-env-vars "POSTGRES_HOST=/cloudsql/YOUR_PROJECT_ID:us-central1:nexus-db"
```

#### 5. Configurar Custom Domain

```bash
# Mapear domínio
gcloud run domain-mappings create \
  --service nexus-app \
  --domain app.yourdomain.com \
  --region us-central1

# Adicionar records DNS conforme instruções
```

---

## ☸️ Deploy com Google Kubernetes Engine (GKE)

### Método 2: Kubernetes Orchestration

#### 1. Criar Cluster GKE

```bash
# Criar cluster
gcloud container clusters create nexus-cluster \
  --region us-central1 \
  --num-nodes 3 \
  --machine-type e2-medium \
  --disk-size 30 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --network default \
  --subnetwork default

# Obter credenciais
gcloud container clusters get-credentials nexus-cluster --region us-central1
```

#### 2. Criar Manifests Kubernetes

**`deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexus-app
  labels:
    app: nexus
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nexus
  template:
    metadata:
      labels:
        app: nexus
    spec:
      containers:
      - name: nexus-app
        image: gcr.io/YOUR_PROJECT_ID/nexus-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: POSTGRES_HOST
          valueFrom:
            secretKeyRef:
              name: nexus-secrets
              key: postgres-host
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: nexus-secrets
              key: postgres-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: nexus-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: nexus-service
spec:
  type: LoadBalancer
  selector:
    app: nexus
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nexus-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nexus-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 3. Criar Secrets

```bash
# Criar secret
kubectl create secret generic nexus-secrets \
  --from-literal=postgres-host=your-cloud-sql-ip \
  --from-literal=postgres-password=your-password \
  --from-literal=jwt-secret=your-jwt-secret

# Ou via arquivo
kubectl create secret generic nexus-secrets --from-env-file=.env.production
```

#### 4. Deploy

```bash
# Apply manifests
kubectl apply -f deployment.yaml

# Verificar status
kubectl get deployments
kubectl get pods
kubectl get services

# Ver logs
kubectl logs -f deployment/nexus-app

# Escalar manualmente
kubectl scale deployment nexus-app --replicas=5
```

#### 5. Configurar Ingress com SSL

**`ingress.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nexus-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "nexus-ip"
    networking.gke.io/managed-certificates: "nexus-cert"
spec:
  rules:
  - host: app.yourdomain.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: nexus-service
            port:
              number: 80
---
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: nexus-cert
spec:
  domains:
    - app.yourdomain.com
```

```bash
# Reservar IP estático
gcloud compute addresses create nexus-ip --global

# Apply ingress
kubectl apply -f ingress.yaml
```

---

## 🏃 Deploy com App Engine

### Método 3: PaaS Tradicional

#### 1. Criar app.yaml

**`app.yaml`**:
```yaml
runtime: nodejs18
instance_class: F2
env: standard

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.65
  target_throughput_utilization: 0.65

env_variables:
  NODE_ENV: "production"
  PORT: "8080"

vpc_access_connector:
  name: projects/YOUR_PROJECT_ID/locations/us-central1/connectors/nexus-connector

handlers:
- url: /.*
  script: auto
  secure: always
  redirect_http_response_code: 301
```

#### 2. Deploy

```bash
# Deploy
gcloud app deploy app.yaml

# Deploy com version
gcloud app deploy --version v1 --no-promote

# Migrar tráfego
gcloud app services set-traffic default --splits v1=1

# Ver logs
gcloud app logs tail -s default

# Abrir no browser
gcloud app browse
```

---

## 💻 Deploy com Compute Engine

### Método 4: VM Traditional

#### 1. Criar Instância

```bash
# Criar instância
gcloud compute instances create nexus-vm \
  --machine-type e2-medium \
  --zone us-central1-a \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 30GB \
  --boot-disk-type pd-ssd \
  --tags http-server,https-server \
  --metadata-from-file startup-script=startup.sh
```

#### 2. Startup Script

**`startup.sh`**:
```bash
#!/bin/bash

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install git
apt-get install -y git

# Clone repository
cd /opt
git clone https://github.com/your-org/nexus.git
cd nexus

# Install dependencies
npm install --production

# Setup environment
cat > .env << EOF
NODE_ENV=production
PORT=3000
POSTGRES_HOST=your-cloud-sql-ip
POSTGRES_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
EOF

# Start with PM2
pm2 start index.js --name nexus-app
pm2 startup
pm2 save

# Install nginx
apt-get install -y nginx

# Configure nginx
cat > /etc/nginx/sites-available/nexus << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx
```

#### 3. Criar Firewall Rules

```bash
# Permitir HTTP
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Permitir HTTPS
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags https-server
```

---

## 🗄️ Configuração de Database (Cloud SQL)

### Criar PostgreSQL Instance

```bash
# Criar instância
gcloud sql instances create nexus-db \
  --database-version POSTGRES_15 \
  --tier db-f1-micro \
  --region us-central1 \
  --root-password your-root-password \
  --storage-type SSD \
  --storage-size 10GB \
  --storage-auto-increase \
  --backup-start-time 03:00 \
  --enable-bin-log \
  --maintenance-window-day SUN \
  --maintenance-window-hour 04 \
  --availability-type REGIONAL

# Criar database
gcloud sql databases create nexus \
  --instance nexus-db

# Criar user
gcloud sql users create nexus_user \
  --instance nexus-db \
  --password your-user-password

# Conectar via proxy (desenvolvimento)
cloud_sql_proxy -instances=YOUR_PROJECT_ID:us-central1:nexus-db=tcp:5432
```

### Configurar High Availability

```bash
# Ativar HA
gcloud sql instances patch nexus-db \
  --availability-type REGIONAL \
  --enable-bin-log
```

---

## 🔄 Configuração de Cache (Memorystore)

### Criar Redis Instance

```bash
# Criar instância Redis
gcloud redis instances create nexus-redis \
  --size 1 \
  --region us-central1 \
  --redis-version redis_7_0 \
  --tier basic

# Obter informações
gcloud redis instances describe nexus-redis \
  --region us-central1

# Obter IP
gcloud redis instances describe nexus-redis \
  --region us-central1 \
  --format="value(host)"
```

---

## 📦 Configuração de Storage (Cloud Storage)

### Criar Bucket

```bash
# Criar bucket
gsutil mb -p YOUR_PROJECT_ID \
  -c STANDARD \
  -l US-CENTRAL1 \
  gs://nexus-app-uploads/

# Configurar CORS
cat > cors.json << EOF
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://nexus-app-uploads/

# Configurar lifecycle
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 365,
          "isLive": false
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://nexus-app-uploads/

# Fazer upload de arquivo
gsutil cp file.txt gs://nexus-app-uploads/
```

---

## 🔄 CI/CD com Cloud Build

### Criar cloudbuild.yaml

**`cloudbuild.yaml`**:
```yaml
steps:
  # Build da imagem
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/nexus-app:$COMMIT_SHA', '.']

  # Push para GCR
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/nexus-app:$COMMIT_SHA']

  # Deploy para Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'nexus-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/nexus-app:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'

images:
  - 'gcr.io/$PROJECT_ID/nexus-app:$COMMIT_SHA'

options:
  logging: CLOUD_LOGGING_ONLY

timeout: 1200s
```

### Configurar Trigger

```bash
# Criar trigger do GitHub
gcloud builds triggers create github \
  --repo-name YOUR_REPO \
  --repo-owner YOUR_ORG \
  --branch-pattern "^main$" \
  --build-config cloudbuild.yaml

# Build manual
gcloud builds submit --config cloudbuild.yaml
```

---

## 📊 Monitoramento e Logs

### Cloud Logging

```bash
# Ver logs do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nexus-app" \
  --limit 50 \
  --format json

# Criar sink para BigQuery
gcloud logging sinks create nexus-logs \
  bigquery.googleapis.com/projects/YOUR_PROJECT_ID/datasets/logs \
  --log-filter='resource.type="cloud_run_revision"'
```

### Cloud Monitoring

```bash
# Criar dashboard
gcloud monitoring dashboards create --config-from-file=dashboard.json
```

**`dashboard.json`** (exemplo):
```json
{
  "displayName": "Nexus App Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Count",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"nexus-app\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
```

---

## 🔒 SSL/TLS e Domain

### Configurar Domain com Cloud DNS

```bash
# Criar zona DNS
gcloud dns managed-zones create nexus-zone \
  --dns-name yourdomain.com \
  --description "Nexus App DNS Zone"

# Adicionar record
gcloud dns record-sets create app.yourdomain.com \
  --zone nexus-zone \
  --type A \
  --ttl 300 \
  --rrdatas YOUR_LOAD_BALANCER_IP
```

---

## 💰 Custos Estimados

### Cenário Pequeno (Startup/Dev)
- **Cloud Run**: 1M requests, 360k vCPU-sec - ~$5/mês
- **Cloud SQL**: db-f1-micro - ~$7/mês
- **Memorystore**: 1GB basic - ~$25/mês
- **Cloud Storage**: 10GB - ~$0.20/mês
- **Total**: ~$37/mês

### Cenário Médio (Produção)
- **Cloud Run**: 10M requests, 3.6M vCPU-sec - ~$50/mês
- **Cloud SQL**: db-n1-standard-1 - ~$75/mês
- **Memorystore**: 5GB standard - ~$150/mês
- **Cloud Storage**: 100GB + egress - ~$5/mês
- **Load Balancing**: - ~$20/mês
- **Total**: ~$300/mês

### Cenário Grande (Enterprise)
- **GKE**: 3 nodes n1-standard-2 - ~$150/mês
- **Cloud SQL**: db-n1-standard-4 (HA) - ~$350/mês
- **Memorystore**: 20GB standard - ~$600/mês
- **Cloud Storage**: 1TB - ~$50/mês
- **Load Balancing + CDN**: - ~$100/mês
- **Total**: ~$1,250/mês

*Custos são estimativas e podem variar*

---

## 🎯 Checklist de Deploy

- [ ] Projeto GCP criado e configurado
- [ ] Billing habilitado
- [ ] APIs necessárias habilitadas
- [ ] Service accounts criados
- [ ] VPC configurada
- [ ] Cloud SQL instance criada
- [ ] Memorystore Redis criado
- [ ] Cloud Storage bucket criado
- [ ] Secret Manager configurado
- [ ] Aplicação deployada
- [ ] Load Balancer configurado
- [ ] Auto Scaling configurado
- [ ] Monitoring configurado
- [ ] Alertas configurados
- [ ] SSL/TLS configurado
- [ ] Domain configurado
- [ ] Backup configurado
- [ ] CI/CD pipeline configurado

---

**Última atualização**: 2025-11-18
**Versão do Guia**: 1.0
