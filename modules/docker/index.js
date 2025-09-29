/**
 * Docker Module - Containerização e DevOps
 * Geração automática de Dockerfiles, docker-compose e CI/CD
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

export class DockerModule {
  constructor(config = {}) {
    this.config = {
      name: 'docker',
      version: '1.0.0',
      baseImage: 'node:18-alpine',
      port: 3000,
      environment: 'production',
      registry: 'docker.io',
      namespace: 'nexus',
      enableMultiStage: true,
      enableHealthCheck: true,
      enableSecurityScanning: true,
      ...config
    };

    this.initialized = false;
    console.log('🐳 Docker Module carregado');
  }

  /**
   * Inicializar módulo Docker
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando Docker Module...');
      
      await this.validateDockerInstallation();
      await this.createDockerIgnore();
      
      this.initialized = true;
      console.log('✅ Docker Module inicializado com sucesso');
      
      return {
        success: true,
        message: 'Docker Module pronto para uso',
        config: this.config
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar Docker Module:', error.message);
      throw error;
    }
  }

  /**
   * Validar instalação do Docker
   */
  async validateDockerInstallation() {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('docker --version');
      console.log('✅ Docker instalado e acessível');
      
      try {
        await execAsync('docker-compose --version');
        console.log('✅ Docker Compose disponível');
      } catch {
        console.warn('⚠️  Docker Compose não encontrado');
      }
      
    } catch (error) {
      console.warn('⚠️  Docker não encontrado. Continuando sem validação.');
    }
  }

  /**
   * Criar .dockerignore
   */
  async createDockerIgnore() {
    const dockerIgnoreContent = `
# Dependências
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime
*.pid
*.seed
*.pid.lock

# Coverage e testes
coverage/
.nyc_output/
*.lcov

# Logs
logs/
*.log

# Ambiente
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/
*.swp
*.swo

# Sistema
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Build
dist/
build/
*.tgz

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# Documentação
README.md
docs/
*.md

# Configuração
.eslintrc*
.prettierrc*
jest.config.js
`;

    await fs.writeFile('.dockerignore', dockerIgnoreContent.trim());
    console.log('✅ .dockerignore criado');
  }

  /**
   * Gerar Dockerfile para aplicação Node.js
   */
  generateNodeDockerfile(options = {}) {
    const {
      baseImage = this.config.baseImage,
      port = this.config.port,
      enableMultiStage = this.config.enableMultiStage,
      enableHealthCheck = this.config.enableHealthCheck
    } = options;

    if (enableMultiStage) {
      return this.generateMultiStageDockerfile({ baseImage, port, enableHealthCheck });
    }

    return `# Dockerfile gerado pelo Nexus Framework
FROM ${baseImage}

# Metadata
LABEL maintainer="Nexus Framework"
LABEL version="1.0.0"
LABEL description="Aplicação Node.js containerizada"

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && \\
    npm cache clean --force

# Copiar código da aplicação
COPY --chown=nextjs:nodejs . .

# Expor porta
EXPOSE ${port}

# Mudança para usuário não-root
USER nextjs

# Health check
${enableHealthCheck ? `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1` : ''}

# Comando de inicialização
CMD ["npm", "start"]
`;
  }

  /**
   * Gerar Dockerfile multi-stage otimizado
   */
  generateMultiStageDockerfile(options = {}) {
    const {
      baseImage = this.config.baseImage,
      port = this.config.port,
      enableHealthCheck = this.config.enableHealthCheck
    } = options;

    return `# Multi-stage Dockerfile gerado pelo Nexus Framework

# Stage 1: Build
FROM ${baseImage} AS builder

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build 2>/dev/null || echo "Build step não disponível"

# Stage 2: Produção
FROM ${baseImage} AS production

# Metadata
LABEL maintainer="Nexus Framework"
LABEL version="1.0.0"
LABEL description="Aplicação Node.js otimizada para produção"

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001

# Instalar curl para health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && \\
    npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/build ./build 2>/dev/null || true

# Copiar código da aplicação
COPY --chown=nextjs:nodejs . .

# Remover arquivos desnecessários
RUN rm -rf src/ test/ tests/ docs/ *.md .git* || true

# Expor porta
EXPOSE ${port}

# Mudança para usuário não-root
USER nextjs

# Health check
${enableHealthCheck ? `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1` : ''}

# Comando de inicialização
CMD ["npm", "start"]
`;
  }

  /**
   * Gerar docker-compose.yml para desenvolvimento
   */
  generateDockerCompose(services = {}) {
    const defaultServices = {
      app: {
        build: '.',
        ports: [`${this.config.port}:${this.config.port}`],
        environment: [
          'NODE_ENV=development',
          'PORT=' + this.config.port
        ],
        volumes: [
          '.:/app',
          '/app/node_modules'
        ],
        depends_on: ['database', 'redis']
      },
      database: {
        image: 'postgres:15-alpine',
        environment: [
          'POSTGRES_DB=nexus_dev',
          'POSTGRES_USER=nexus',
          'POSTGRES_PASSWORD=nexus123'
        ],
        volumes: [
          'postgres_data:/var/lib/postgresql/data'
        ],
        ports: ['5432:5432']
      },
      redis: {
        image: 'redis:7-alpine',
        volumes: [
          'redis_data:/data'
        ],
        ports: ['6379:6379']
      }
    };

    const allServices = { ...defaultServices, ...services };

    const compose = {
      version: '3.8',
      services: allServices,
      volumes: {
        postgres_data: {},
        redis_data: {}
      },
      networks: {
        nexus_network: {
          driver: 'bridge'
        }
      }
    };

    return yaml.dump(compose, { indent: 2 });
  }

  /**
   * Gerar docker-compose para produção
   */
  generateDockerComposeProduction() {
    const compose = {
      version: '3.8',
      services: {
        app: {
          image: `${this.config.registry}/${this.config.namespace}/app:latest`,
          ports: [`${this.config.port}:${this.config.port}`],
          environment: [
            'NODE_ENV=production'
          ],
          restart: 'unless-stopped',
          depends_on: ['database', 'redis'],
          networks: ['nexus_network']
        },
        database: {
          image: 'postgres:15-alpine',
          environment: [
            'POSTGRES_DB=${DB_NAME}',
            'POSTGRES_USER=${DB_USER}',
            'POSTGRES_PASSWORD=${DB_PASSWORD}'
          ],
          volumes: [
            'postgres_data:/var/lib/postgresql/data'
          ],
          restart: 'unless-stopped',
          networks: ['nexus_network']
        },
        redis: {
          image: 'redis:7-alpine',
          volumes: [
            'redis_data:/data'
          ],
          restart: 'unless-stopped',
          networks: ['nexus_network']
        },
        nginx: {
          image: 'nginx:alpine',
          ports: ['80:80', '443:443'],
          volumes: [
            './nginx.conf:/etc/nginx/nginx.conf',
            './ssl:/etc/nginx/ssl'
          ],
          depends_on: ['app'],
          restart: 'unless-stopped',
          networks: ['nexus_network']
        }
      },
      volumes: {
        postgres_data: {},
        redis_data: {}
      },
      networks: {
        nexus_network: {
          driver: 'bridge'
        }
      }
    };

    return yaml.dump(compose, { indent: 2 });
  }

  /**
   * Gerar configuração do Nginx
   */
  generateNginxConfig(domain = 'localhost') {
    return `
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:${this.config.port};
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name ${domain};

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${domain};

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /health {
            proxy_pass http://app/health;
            access_log off;
        }
    }
}
`;
  }

  /**
   * Gerar workflow do GitHub Actions
   */
  generateGitHubActions() {
    return `
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run security audit
      run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: \${{ secrets.DOCKERHUB_USERNAME }}
        password: \${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          \${{ secrets.DOCKERHUB_USERNAME }}/nexus-app:latest
          \${{ secrets.DOCKERHUB_USERNAME }}/nexus-app:\${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploy para produção seria executado aqui"
        echo "Usando Docker Compose ou Kubernetes"
`;
  }

  /**
   * Criar todos os arquivos Docker em um projeto
   */
  async createDockerFiles(projectPath = '.', options = {}) {
    try {
      console.log('🐳 Criando arquivos Docker...');

      // Dockerfile
      const dockerfile = this.generateNodeDockerfile(options);
      await fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfile);
      console.log('✅ Dockerfile criado');

      // docker-compose.yml (desenvolvimento)
      const dockerCompose = this.generateDockerCompose();
      await fs.writeFile(path.join(projectPath, 'docker-compose.yml'), dockerCompose);
      console.log('✅ docker-compose.yml criado');

      // docker-compose.production.yml
      const dockerComposeProd = this.generateDockerComposeProduction();
      await fs.writeFile(path.join(projectPath, 'docker-compose.production.yml'), dockerComposeProd);
      console.log('✅ docker-compose.production.yml criado');

      // nginx.conf
      const nginxConfig = this.generateNginxConfig();
      await fs.writeFile(path.join(projectPath, 'nginx.conf'), nginxConfig);
      console.log('✅ nginx.conf criado');

      // GitHub Actions workflow
      const workflowDir = path.join(projectPath, '.github', 'workflows');
      await fs.ensureDir(workflowDir);
      const githubActions = this.generateGitHubActions();
      await fs.writeFile(path.join(workflowDir, 'ci-cd.yml'), githubActions);
      console.log('✅ GitHub Actions workflow criado');

      // .dockerignore já foi criado no initialize()

      return {
        success: true,
        message: 'Arquivos Docker criados com sucesso',
        files: [
          'Dockerfile',
          'docker-compose.yml',
          'docker-compose.production.yml',
          'nginx.conf',
          '.github/workflows/ci-cd.yml',
          '.dockerignore'
        ]
      };

    } catch (error) {
      console.error('❌ Erro ao criar arquivos Docker:', error.message);
      throw error;
    }
  }

  /**
   * Construir imagem Docker
   */
  async buildImage(imageName, options = {}) {
    try {
      console.log(`🔨 Construindo imagem Docker: ${imageName}...`);

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const {
        tag = 'latest',
        context = '.',
        dockerfile = 'Dockerfile',
        platform = 'linux/amd64',
        noCache = false
      } = options;

      const fullImageName = `${imageName}:${tag}`;
      let command = `docker build -t ${fullImageName}`;

      if (dockerfile !== 'Dockerfile') {
        command += ` -f ${dockerfile}`;
      }

      if (platform) {
        command += ` --platform ${platform}`;
      }

      if (noCache) {
        command += ' --no-cache';
      }

      command += ` ${context}`;

      console.log(`Executando: ${command}`);
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(stderr);
      }

      console.log('✅ Imagem construída com sucesso');
      return {
        success: true,
        image: fullImageName,
        output: stdout
      };

    } catch (error) {
      console.error('❌ Erro ao construir imagem:', error.message);
      throw error;
    }
  }

  /**
   * Executar containers com docker-compose
   */
  async runCompose(composeFile = 'docker-compose.yml', options = {}) {
    try {
      console.log('🚀 Iniciando containers com Docker Compose...');

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const {
        detach = true,
        build = false,
        services = []
      } = options;

      let command = `docker-compose -f ${composeFile} up`;

      if (detach) {
        command += ' -d';
      }

      if (build) {
        command += ' --build';
      }

      if (services.length > 0) {
        command += ` ${services.join(' ')}`;
      }

      console.log(`Executando: ${command}`);
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
        throw new Error(stderr);
      }

      console.log('✅ Containers iniciados com sucesso');
      return {
        success: true,
        output: stdout
      };

    } catch (error) {
      console.error('❌ Erro ao executar Docker Compose:', error.message);
      throw error;
    }
  }

  /**
   * Health check do módulo
   */
  async healthCheck() {
    const health = {
      module: 'Docker',
      status: this.initialized ? 'healthy' : 'not_initialized',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // Verificar Docker
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        await execAsync('docker --version');
        health.checks.docker = 'available';
      } catch {
        health.checks.docker = 'not_available';
      }

      try {
        await execAsync('docker-compose --version');
        health.checks.dockerCompose = 'available';
      } catch {
        health.checks.dockerCompose = 'not_available';
      }

      // Verificar arquivos
      health.checks.dockerignore = await fs.pathExists('.dockerignore') ? 'exists' : 'missing';

    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Obter informações do módulo
   */
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      initialized: this.initialized,
      description: 'Módulo de containerização e DevOps com Docker',
      features: [
        'Geração automática de Dockerfiles',
        'Docker Compose para dev e produção',
        'Configuração do Nginx',
        'CI/CD com GitHub Actions',
        'Multi-stage builds otimizados',
        'Health checks automáticos',
        'Configurações de segurança'
      ]
    };
  }
}

// Instância padrão
export const dockerModule = new DockerModule();

// Export default para compatibilidade
export default DockerModule;