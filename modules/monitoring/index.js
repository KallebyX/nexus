/**
 * Módulo de Monitoramento - Oryum Nexus
 * Sistema completo de logs, métricas e alertas
 */

import winston from 'winston';
import { performance } from 'perf_hooks';

export class MonitoringModule {
  constructor(config = {}) {
    this.config = {
      logging: true,
      metrics: true,
      alerts: true,
      logLevel: 'info',
      maxLogFiles: 5,
      maxLogSize: '20m',
      ...config
    };

    this.metrics = new Map();
    this.alertRules = new Map();
    this.initializeLogger();
  }

  initializeLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...meta
        });
      })
    );

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: logFormat,
      transports: [
        // Console para desenvolvimento
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        }),
        
        // Arquivo para todos os logs
        new winston.transports.File({
          filename: 'logs/nexus.log',
          maxsize: this.config.maxLogSize,
          maxFiles: this.config.maxLogFiles
        }),
        
        // Arquivo separado para erros
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: this.config.maxLogSize,
          maxFiles: this.config.maxLogFiles
        })
      ]
    });
  }

  /**
   * Middleware para Express.js
   * Registra automaticamente requisições e respostas
   */
  middleware() {
    return (req, res, next) => {
      const startTime = performance.now();
      
      // Log da requisição
      this.log('info', 'HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });

      // Interceptar resposta
      const originalSend = res.send;
      res.send = function(data) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log da resposta
        this.log('info', 'HTTP Response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration.toFixed(2)}ms`,
          userId: req.user?.id
        });

        // Registrar métrica de performance
        this.recordMetric('http_request_duration', duration, {
          method: req.method,
          status: res.statusCode
        });

        // Verificar se é erro
        if (res.statusCode >= 400) {
          this.recordMetric('http_errors_total', 1, {
            method: req.method,
            status: res.statusCode
          });
        }

        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Registrar log
   */
  log(level, message, metadata = {}) {
    if (!this.config.logging) return;

    this.logger.log(level, message, {
      ...metadata,
      service: 'nexus',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Registrar métrica
   */
  recordMetric(name, value, tags = {}) {
    if (!this.config.metrics) return;

    const timestamp = new Date().toISOString();
    const metricKey = `${name}_${JSON.stringify(tags)}`;

    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, {
        name,
        values: [],
        tags,
        lastUpdated: timestamp
      });
    }

    const metric = this.metrics.get(metricKey);
    metric.values.push({ value, timestamp });
    metric.lastUpdated = timestamp;

    // Manter apenas últimos 1000 valores para evitar memory leak
    if (metric.values.length > 1000) {
      metric.values = metric.values.slice(-1000);
    }

    // Verificar alertas
    this.checkAlerts(name, value, tags);
  }

  /**
   * Obter métricas
   */
  getMetrics(name = null) {
    if (name) {
      const filteredMetrics = {};
      for (const [key, metric] of this.metrics) {
        if (metric.name === name) {
          filteredMetrics[key] = metric;
        }
      }
      return filteredMetrics;
    }

    return Object.fromEntries(this.metrics);
  }

  /**
   * Calcular estatísticas de métrica
   */
  getMetricStats(name, startTime = null, endTime = null) {
    const metrics = this.getMetrics(name);
    const stats = {};

    for (const [key, metric] of Object.entries(metrics)) {
      let values = metric.values;

      // Filtrar por tempo se especificado
      if (startTime || endTime) {
        values = values.filter(v => {
          const time = new Date(v.timestamp);
          if (startTime && time < new Date(startTime)) return false;
          if (endTime && time > new Date(endTime)) return false;
          return true;
        });
      }

      if (values.length === 0) continue;

      const numericValues = values.map(v => v.value);
      
      stats[key] = {
        count: values.length,
        sum: numericValues.reduce((a, b) => a + b, 0),
        avg: numericValues.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        latest: values[values.length - 1].value,
        tags: metric.tags
      };
    }

    return stats;
  }

  /**
   * Configurar regra de alerta
   */
  addAlertRule(name, condition, action) {
    this.alertRules.set(name, { condition, action });
  }

  /**
   * Verificar alertas
   */
  checkAlerts(metricName, value, tags) {
    if (!this.config.alerts) return;

    for (const [alertName, rule] of this.alertRules) {
      try {
        if (rule.condition(metricName, value, tags)) {
          this.triggerAlert(alertName, metricName, value, tags);
        }
      } catch (error) {
        this.log('error', 'Alert rule error', {
          alertName,
          error: error.message
        });
      }
    }
  }

  /**
   * Disparar alerta
   */
  triggerAlert(alertName, metricName, value, tags) {
    const alert = {
      name: alertName,
      metric: metricName,
      value,
      tags,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(alertName)
    };

    this.log('warning', 'Alert triggered', alert);

    // Executar ação do alerta
    const rule = this.alertRules.get(alertName);
    if (rule.action) {
      try {
        rule.action(alert);
      } catch (error) {
        this.log('error', 'Alert action error', {
          alertName,
          error: error.message
        });
      }
    }
  }

  /**
   * Determinar severidade do alerta
   */
  getAlertSeverity(alertName) {
    // Lógica simples baseada no nome
    if (alertName.includes('critical') || alertName.includes('error')) {
      return 'critical';
    } else if (alertName.includes('warning') || alertName.includes('high')) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Health check do módulo
   */
  healthCheck() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      status: 'healthy',
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
      },
      metrics: {
        total: this.metrics.size,
        alerts: this.alertRules.size
      }
    };
  }

  /**
   * Criar dashboard de métricas simples
   */
  generateDashboard() {
    const stats = {};
    const commonMetrics = [
      'http_request_duration',
      'http_errors_total',
      'memory_usage',
      'cpu_usage'
    ];

    for (const metric of commonMetrics) {
      stats[metric] = this.getMetricStats(metric);
    }

    return {
      timestamp: new Date().toISOString(),
      system: this.healthCheck(),
      metrics: stats,
      recentAlerts: this.getRecentAlerts()
    };
  }

  /**
   * Obter alertas recentes
   */
  getRecentAlerts(limit = 10) {
    // Em uma implementação real, isso viria de um banco de dados
    // Por agora, retornar lista vazia
    return [];
  }

  /**
   * Configurar alertas padrão
   */
  setupDefaultAlerts() {
    // Alerta para muitos erros HTTP
    this.addAlertRule(
      'high_error_rate',
      (metricName, value, tags) => {
        return metricName === 'http_errors_total' && value > 10;
      },
      (alert) => {
        console.log(`🚨 ALERTA: Taxa alta de erros HTTP detectada`);
        // Aqui poderia enviar email, webhook, etc.
      }
    );

    // Alerta para tempo de resposta alto
    this.addAlertRule(
      'slow_response',
      (metricName, value, tags) => {
        return metricName === 'http_request_duration' && value > 5000; // 5 segundos
      },
      (alert) => {
        console.log(`⚠️ ALERTA: Tempo de resposta alto: ${alert.value}ms`);
      }
    );

    // Alerta para uso alto de memória
    this.addAlertRule(
      'high_memory_usage',
      (metricName, value, tags) => {
        return metricName === 'memory_usage' && value > 80; // 80% da memória
      },
      (alert) => {
        console.log(`🧠 ALERTA: Uso alto de memória: ${alert.value}%`);
      }
    );
  }

  /**
   * Inicializar monitoramento do sistema
   */
  startSystemMonitoring() {
    // Monitorar uso de memória a cada minuto
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      this.recordMetric('memory_usage', memPercent);
    }, 60000);

    // Monitorar CPU usage (simulado)
    setInterval(() => {
      const cpuUsage = Math.random() * 100; // Em produção, usar biblioteca real
      this.recordMetric('cpu_usage', cpuUsage);
    }, 60000);

    this.log('info', 'System monitoring started');
  }
}

export default MonitoringModule;