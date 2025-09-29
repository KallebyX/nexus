# Multi-stage Dockerfile gerado pelo Nexus Framework

# Stage 1: Build
FROM node:18-alpine AS builder

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
FROM node:18-alpine AS production

# Metadata
LABEL maintainer="Nexus Framework"
LABEL version="1.0.0"
LABEL description="Aplicação Node.js otimizada para produção"

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Instalar curl para health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/build ./build 2>/dev/null || true

# Copiar código da aplicação
COPY --chown=nextjs:nodejs . .

# Remover arquivos desnecessários
RUN rm -rf src/ test/ tests/ docs/ *.md .git* || true

# Expor porta
EXPOSE 3000

# Mudança para usuário não-root
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]
