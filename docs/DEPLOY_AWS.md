# Deploy Guide - AWS (Amazon Web Services)

Este guia detalha como fazer deploy do Nexus Framework na AWS usando diferentes serviços.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Arquitetura AWS](#arquitetura-aws)
3. [Deploy com AWS Elastic Beanstalk](#deploy-com-aws-elastic-beanstalk)
4. [Deploy com AWS ECS (Docker)](#deploy-com-aws-ecs-docker)
5. [Deploy com AWS EC2](#deploy-com-aws-ec2)
6. [Deploy com AWS Lambda (Serverless)](#deploy-com-aws-lambda-serverless)
7. [Configuração de Database (RDS)](#configuração-de-database-rds)
8. [Configuração de Cache (ElastiCache)](#configuração-de-cache-elasticache)
9. [Configuração de Storage (S3)](#configuração-de-storage-s3)
10. [CI/CD com AWS CodePipeline](#cicd-com-aws-codepipeline)
11. [Monitoramento e Logs](#monitoramento-e-logs)
12. [SSL/TLS com AWS Certificate Manager](#ssltls-com-aws-certificate-manager)
13. [Custos Estimados](#custos-estimados)

---

## 🔧 Pré-requisitos

### 1. Conta AWS
- Criar conta em [aws.amazon.com](https://aws.amazon.com)
- Configurar billing alerts
- Criar IAM user com permissões adequadas

### 2. AWS CLI
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verificar instalação
aws --version

# Configurar credenciais
aws configure
```

### 3. EB CLI (para Elastic Beanstalk)
```bash
pip install awsebcli --upgrade --user

# Verificar instalação
eb --version
```

### 4. Docker (para ECS)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalação
docker --version
```

---

## 🏗️ Arquitetura AWS

### Arquitetura Recomendada (Production)

```
┌─────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                       │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 CloudFront (CDN)                         │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│     Application Load Balancer (ALB)                      │
│                   (SSL/TLS)                              │
└─────────┬──────────────────────────┬────────────────────┘
          │                          │
┌─────────▼──────────┐    ┌─────────▼──────────┐
│  ECS/Fargate       │    │  ECS/Fargate       │
│  (App Container)   │    │  (App Container)   │
│  AZ-1              │    │  AZ-2              │
└─────────┬──────────┘    └─────────┬──────────┘
          │                          │
          └──────────┬───────────────┘
                     │
        ┌────────────┴───────────────────────┐
        │                                    │
┌───────▼──────────┐            ┌───────────▼────────┐
│  RDS PostgreSQL  │            │  ElastiCache Redis │
│  Multi-AZ        │            │  Cluster           │
└──────────────────┘            └────────────────────┘
        │
┌───────▼──────────┐
│   S3 Bucket      │
│   (Storage)      │
└──────────────────┘
```

### Componentes

- **Route 53**: DNS management
- **CloudFront**: CDN para assets estáticos
- **ALB**: Load balancer com SSL/TLS
- **ECS/Fargate**: Containers da aplicação
- **RDS**: PostgreSQL managed database
- **ElastiCache**: Redis para cache e sessions
- **S3**: Storage para uploads e backups
- **CloudWatch**: Logs e monitoring
- **Secrets Manager**: Gerenciamento de secrets

---

## 🚀 Deploy com AWS Elastic Beanstalk

### Método 1: Deploy Rápido (Recomendado para Desenvolvimento)

#### 1. Inicializar Elastic Beanstalk

```bash
# No diretório do projeto
eb init

# Configurações:
# - Region: us-east-1 (ou sua preferência)
# - Application name: nexus-app
# - Platform: Node.js
# - CodeCommit: No
# - SSH: Yes
```

#### 2. Criar arquivo .ebextensions

```bash
mkdir .ebextensions
```

**`.ebextensions/01_nodecommand.config`**:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8080
```

**`.ebextensions/02_environment.config`**:
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NPM_USE_PRODUCTION: true
```

#### 3. Criar ambiente

```bash
# Criar ambiente de staging
eb create nexus-staging \
  --instance-type t3.small \
  --envvars NODE_ENV=staging

# Criar ambiente de production
eb create nexus-production \
  --instance-type t3.medium \
  --envvars NODE_ENV=production
```

#### 4. Configurar variáveis de ambiente

```bash
# Via CLI
eb setenv \
  JWT_SECRET=your_secret \
  POSTGRES_HOST=your_rds_endpoint \
  POSTGRES_USER=nexus_user \
  POSTGRES_PASSWORD=your_password \
  REDIS_HOST=your_elasticache_endpoint

# Ou via Console AWS
# Elastic Beanstalk > Environment > Configuration > Software > Environment properties
```

#### 5. Deploy

```bash
# Deploy para ambiente atual
eb deploy

# Deploy para ambiente específico
eb deploy nexus-production

# Abrir no browser
eb open
```

#### 6. Logs e Monitoramento

```bash
# Ver logs
eb logs

# Ver status
eb status

# SSH para instância
eb ssh
```

---

## 🐳 Deploy com AWS ECS (Docker)

### Método 2: Container Orchestration (Recomendado para Produção)

#### 1. Build e Push da Imagem Docker

```bash
# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Criar repositório ECR
aws ecr create-repository --repository-name nexus-app --region us-east-1

# Build da imagem
docker build -t nexus-app .

# Tag da imagem
docker tag nexus-app:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nexus-app:latest

# Push para ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nexus-app:latest
```

#### 2. Criar Task Definition

**`ecs-task-definition.json`**:
```json
{
  "family": "nexus-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "nexus-app",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nexus-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:nexus/jwt-secret"
        },
        {
          "name": "POSTGRES_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:nexus/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nexus-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### 3. Registrar Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

#### 4. Criar ECS Cluster

```bash
aws ecs create-cluster --cluster-name nexus-cluster
```

#### 5. Criar Application Load Balancer

```bash
# Criar ALB
aws elbv2 create-load-balancer \
  --name nexus-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Criar Target Group
aws elbv2 create-target-group \
  --name nexus-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health

# Criar Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 6. Criar ECS Service

```bash
aws ecs create-service \
  --cluster nexus-cluster \
  --service-name nexus-service \
  --task-definition nexus-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=nexus-app,containerPort=3000"
```

#### 7. Configurar Auto Scaling

```bash
# Registrar target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/nexus-cluster/nexus-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Criar scaling policy (CPU)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/nexus-cluster/nexus-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name nexus-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://cpu-scaling-policy.json
```

**`cpu-scaling-policy.json`**:
```json
{
  "TargetValue": 75.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

---

## 💻 Deploy com AWS EC2

### Método 3: VM Traditional (Mais Controle)

#### 1. Criar Instância EC2

```bash
# Via AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Ubuntu 22.04 LTS
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nexus-app}]'
```

#### 2. User Data Script

**`user-data.sh`**:
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
# Add other env vars from Secrets Manager
EOF

# Start with PM2
pm2 start index.js --name nexus-app
pm2 startup
pm2 save

# Install nginx
apt-get install -y nginx

# Configure nginx
cat > /etc/nginx/sites-available/nexus << 'EOF'
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
    }
}
EOF

ln -s /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx
```

#### 3. Deploy Updates

```bash
# SSH para instância
ssh -i your-key.pem ubuntu@ec2-ip-address

# Update code
cd /opt/nexus
git pull origin main
npm install --production
pm2 restart nexus-app
```

---

## ⚡ Deploy com AWS Lambda (Serverless)

### Método 4: Serverless (Cost-Effective para tráfego variável)

#### 1. Instalar Serverless Framework

```bash
npm install -g serverless
serverless --version
```

#### 2. Criar Configuração Serverless

**`serverless.yml`**:
```yaml
service: nexus-app

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 1024
  timeout: 30
  environment:
    NODE_ENV: ${self:provider.stage}
    POSTGRES_HOST: ${env:POSTGRES_HOST}
    POSTGRES_USER: ${env:POSTGRES_USER}
    POSTGRES_PASSWORD: ${env:POSTGRES_PASSWORD}
    JWT_SECRET: ${env:JWT_SECRET}
    REDIS_HOST: ${env:REDIS_HOST}

  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - rds:*
            - elasticache:*
            - s3:*
          Resource: "*"

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.yourdomain.com
    certificateName: '*.yourdomain.com'
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true
```

#### 3. Criar Handler Lambda

**`lambda.js`**:
```javascript
import serverless from 'serverless-http';
import express from 'express';
import { initializeApp } from './index.js';

const app = express();

// Initialize Nexus Framework
async function setupApp() {
  await initializeApp(app);
  return app;
}

let appPromise;
export const handler = async (event, context) => {
  if (!appPromise) {
    appPromise = setupApp();
  }
  const app = await appPromise;
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};
```

#### 4. Deploy

```bash
# Deploy para dev
serverless deploy --stage dev

# Deploy para production
serverless deploy --stage prod

# Ver logs
serverless logs -f api --tail

# Remove deployment
serverless remove
```

---

## 🗄️ Configuração de Database (RDS)

### Criar PostgreSQL RDS

```bash
# Via CLI
aws rds create-db-instance \
  --db-instance-identifier nexus-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username nexus_admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name my-db-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'

# Aguardar criação
aws rds wait db-instance-available --db-instance-identifier nexus-db

# Obter endpoint
aws rds describe-db-instances \
  --db-instance-identifier nexus-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Configurar Backup Automático

```bash
# Criar snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier nexus-db \
  --db-snapshot-identifier nexus-db-snapshot-$(date +%Y%m%d)
```

---

## 🔄 Configuração de Cache (ElastiCache)

### Criar Redis ElastiCache

```bash
# Criar cluster Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id nexus-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name my-cache-subnet-group \
  --security-group-ids sg-xxxxx \
  --port 6379

# Aguardar disponibilidade
aws elasticache wait cache-cluster-available --cache-cluster-id nexus-redis

# Obter endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id nexus-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

---

## 📦 Configuração de Storage (S3)

### Criar S3 Bucket

```bash
# Criar bucket
aws s3api create-bucket \
  --bucket nexus-app-uploads \
  --region us-east-1

# Configurar versionamento
aws s3api put-bucket-versioning \
  --bucket nexus-app-uploads \
  --versioning-configuration Status=Enabled

# Configurar lifecycle
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket nexus-app-uploads \
  --lifecycle-configuration file://lifecycle.json

# Configurar CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket nexus-app-uploads \
  --cors-configuration file://cors.json
```

---

## 🔄 CI/CD com AWS CodePipeline

### Criar Pipeline

**`buildspec.yml`** (para CodeBuild):
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nexus-app
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"nexus-app","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
```

### Criar Pipeline via CLI

```bash
# Criar pipeline
aws codepipeline create-pipeline --cli-input-json file://pipeline.json
```

---

## 📊 Monitoramento e Logs

### CloudWatch Logs

```bash
# Criar log group
aws logs create-log-group --log-group-name /aws/nexus-app

# Ver logs
aws logs tail /aws/nexus-app --follow

# Criar métrica customizada
aws cloudwatch put-metric-data \
  --namespace Nexus \
  --metric-name ActiveUsers \
  --value 100
```

### CloudWatch Alarms

```bash
# Criar alarm para CPU alta
aws cloudwatch put-metric-alarm \
  --alarm-name nexus-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🔒 SSL/TLS com AWS Certificate Manager

### Criar Certificado

```bash
# Request certificado
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS

# Validar via DNS (adicionar records no Route 53)
# Aguardar validação

# Listar certificados
aws acm list-certificates
```

---

## 💰 Custos Estimados

### Cenário Pequeno (Startup/Dev)
- **EC2**: t3.small (2 vCPU, 2 GB RAM) - ~$15/mês
- **RDS**: db.t3.micro (PostgreSQL) - ~$12/mês
- **ElastiCache**: cache.t3.micro (Redis) - ~$12/mês
- **S3**: 10 GB storage + requests - ~$1/mês
- **Total**: ~$40/mês

### Cenário Médio (Produção)
- **ECS Fargate**: 2 tasks (0.5 vCPU, 1 GB each) - ~$30/mês
- **ALB**: Application Load Balancer - ~$20/mês
- **RDS**: db.t3.small (Multi-AZ) - ~$50/mês
- **ElastiCache**: cache.t3.small (clustered) - ~$35/mês
- **S3**: 100 GB + CloudFront - ~$10/mês
- **Total**: ~$145/mês

### Cenário Grande (Enterprise)
- **ECS Fargate**: 10 tasks (1 vCPU, 2 GB each) - ~$300/mês
- **ALB**: Application Load Balancer - ~$20/mês
- **RDS**: db.r5.large (Multi-AZ, 2 vCPU, 16 GB) - ~$250/mês
- **ElastiCache**: cache.r5.large (clustered) - ~$200/mês
- **S3**: 1 TB + CloudFront - ~$50/mês
- **Total**: ~$820/mês

*Custos são estimativas e podem variar por região e uso real*

---

## 🎯 Checklist de Deploy

- [ ] AWS account configurada
- [ ] IAM users e roles criados
- [ ] VPC e subnets configuradas
- [ ] Security groups configurados
- [ ] RDS database criado e configurado
- [ ] ElastiCache Redis criado
- [ ] S3 bucket criado
- [ ] Secrets Manager configurado
- [ ] Application deployada (EB/ECS/EC2/Lambda)
- [ ] Load Balancer configurado
- [ ] Auto Scaling configurado
- [ ] CloudWatch alarms configurados
- [ ] SSL/TLS certificado configurado
- [ ] Domain name configurado (Route 53)
- [ ] Backup automático configurado
- [ ] CI/CD pipeline configurado
- [ ] Logs centralizados
- [ ] Monitoramento ativo

---

## 📞 Suporte

Para dúvidas sobre deploy AWS:
- [AWS Documentation](https://docs.aws.amazon.com)
- [AWS Support](https://aws.amazon.com/support)
- Nexus Framework: docs/README.md

---

**Última atualização**: 2025-11-18
**Versão do Guia**: 1.0
