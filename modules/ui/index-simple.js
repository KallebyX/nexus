/**
 * UI Module - Versão simplificada para Node.js
 * Componentes funcionais sem JSX para compatibilidade
 */

export class UIModule {
  constructor(config = {}) {
    this.config = {
      name: 'ui',
      version: '1.0.0',
      theme: 'default',
      ...config
    };

    this.initialized = false;
    console.log('🎨 UI Module carregado (modo Node.js)');
  }

  /**
   * Inicializar módulo UI
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando UI Module...');
      
      this.initialized = true;
      console.log('✅ UI Module inicializado');
      
      return {
        success: true,
        message: 'UI Module pronto para uso',
        mode: 'nodejs'
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar UI Module:', error.message);
      throw error;
    }
  }

  /**
   * Gerar CSS para componentes
   */
  generateCSS() {
    return `
/* Nexus UI Framework CSS */
.nexus-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.nexus-button-primary {
  background-color: #3b82f6;
  color: white;
}

.nexus-button-primary:hover {
  background-color: #2563eb;
}

.nexus-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: 100%;
}

.nexus-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexus-modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
}

.nexus-alert {
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1rem 0;
}

.nexus-alert-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #34d399;
}

.nexus-alert-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #f87171;
}

.nexus-alert-warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fbbf24;
}

.nexus-table {
  width: 100%;
  border-collapse: collapse;
}

.nexus-table th,
.nexus-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.nexus-table th {
  background-color: #f9fafb;
  font-weight: 600;
}
    `;
  }

  /**
   * Gerar HTML para componentes
   */
  generateHTML(component, props = {}) {
    switch (component) {
      case 'button':
        return this.generateButtonHTML(props);
      case 'input':
        return this.generateInputHTML(props);
      case 'modal':
        return this.generateModalHTML(props);
      case 'alert':
        return this.generateAlertHTML(props);
      case 'table':
        return this.generateTableHTML(props);
      default:
        return `<div class="nexus-component">${props.content || ''}</div>`;
    }
  }

  generateButtonHTML(props) {
    const { 
      text = 'Button', 
      variant = 'primary', 
      onClick = '', 
      disabled = false 
    } = props;

    return `
<button 
  class="nexus-button nexus-button-${variant}"
  ${onClick ? `onclick="${onClick}"` : ''}
  ${disabled ? 'disabled' : ''}
>
  ${text}
</button>`;
  }

  generateInputHTML(props) {
    const { 
      type = 'text', 
      placeholder = '', 
      name = '', 
      value = '' 
    } = props;

    return `
<input 
  type="${type}"
  class="nexus-input"
  placeholder="${placeholder}"
  name="${name}"
  value="${value}"
/>`;
  }

  generateModalHTML(props) {
    const { title = 'Modal', content = '', showClose = true } = props;

    return `
<div class="nexus-modal" id="nexus-modal">
  <div class="nexus-modal-content">
    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600;">${title}</h3>
      ${showClose ? '<button onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>' : ''}
    </div>
    <div class="modal-body">
      ${content}
    </div>
  </div>
</div>

<script>
function closeModal() {
  document.getElementById('nexus-modal').style.display = 'none';
}
</script>`;
  }

  generateAlertHTML(props) {
    const { type = 'info', message = '', dismissible = true } = props;

    return `
<div class="nexus-alert nexus-alert-${type}" ${dismissible ? 'id="nexus-alert"' : ''}>
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span>${message}</span>
    ${dismissible ? '<button onclick="dismissAlert()" style="background: none; border: none; cursor: pointer;">&times;</button>' : ''}
  </div>
</div>

${dismissible ? `
<script>
function dismissAlert() {
  document.getElementById('nexus-alert').style.display = 'none';
}
</script>` : ''}`;
  }

  generateTableHTML(props) {
    const { headers = [], rows = [], sortable = false } = props;

    let headerHTML = headers.map(header => 
      `<th${sortable ? ` style="cursor: pointer;" onclick="sortTable('${header}')"` : ''}>${header}</th>`
    ).join('');

    let rowsHTML = rows.map(row => 
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
<table class="nexus-table">
  <thead>
    <tr>${headerHTML}</tr>
  </thead>
  <tbody>
    ${rowsHTML}
  </tbody>
</table>

${sortable ? `
<script>
function sortTable(column) {
  // Implementação de sorting seria adicionada aqui
  console.log('Sorting by:', column);
}
</script>` : ''}`;
  }

  /**
   * Gerar página completa com componentes
   */
  generatePage(components = [], options = {}) {
    const { title = 'Nexus App', includeCSS = true } = options;

    const css = includeCSS ? `<style>${this.generateCSS()}</style>` : '';
    const componentsHTML = components.map(comp => 
      this.generateHTML(comp.type, comp.props)
    ).join('\n');

    return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${css}
</head>
<body>
  <div class="nexus-app" style="padding: 2rem;">
    ${componentsHTML}
  </div>
</body>
</html>`;
  }

  /**
   * Health check do módulo
   */
  async healthCheck() {
    return {
      module: 'UI',
      status: this.initialized ? 'healthy' : 'not_initialized',
      timestamp: new Date().toISOString(),
      mode: 'nodejs',
      features: [
        'CSS generation',
        'HTML components',
        'Static pages',
        'Form builders'
      ]
    };
  }

  /**
   * Obter informações do módulo
   */
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      initialized: this.initialized,
      description: 'Sistema de UI components para Node.js',
      features: [
        'Geração de CSS automática',
        'Componentes HTML',
        'Sistema de temas',
        'Páginas estáticas',
        'Formulários dinâmicos'
      ]
    };
  }
}

// Instância padrão
export const uiModule = new UIModule();

// Export default para compatibilidade
export default UIModule;