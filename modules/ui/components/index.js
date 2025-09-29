/**
 * Componentes UI - Nexus Framework
 * Versão simplificada para Node.js
 */

// Componentes básicos como templates
export const Button = {
  name: 'Button',
  template: '<button class="nexus-button nexus-button-{{variant}}">{{text}}</button>',
  props: ['text', 'onClick', 'variant', 'disabled']
};

export const Input = {
  name: 'Input',
  template: '<input class="nexus-input" type="{{type}}" placeholder="{{placeholder}}" />',
  props: ['type', 'placeholder', 'value', 'onChange']
};

export const Alert = {
  name: 'Alert',
  template: '<div class="nexus-alert nexus-alert-{{type}}">{{message}}</div>',
  props: ['type', 'message', 'dismissible']
};

export const Footer = {
  name: 'Footer',
  template: '<footer class="nexus-footer">{{content}}</footer>',
  props: ['content', 'links']
};

export const LoginForm = {
  name: 'LoginForm',
  template: `<form class="nexus-login-form">
    <input type="email" placeholder="Email" required />
    <input type="password" placeholder="Password" required />
    <button type="submit" class="nexus-button nexus-button-primary">{{submitText}}</button>
  </form>`,
  props: ['onSubmit', 'submitText']
};

// Função para renderizar componentes
export function renderComponent(component, props = {}) {
  let template = component.template;
  Object.keys(props).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, props[key] || '');
  });
  return template;
}

// Dashboard Components (templates para Node.js)
export const DashboardLayout = {
  name: 'DashboardLayout',
  template: '<div class="nexus-dashboard">{{content}}</div>',
  props: ['content', 'sidebar']
};

export const StatsCard = {
  name: 'StatsCard',
  template: `<div class="nexus-stats-card">
    <h3>{{title}}</h3>
    <div class="stat-value">{{value}}</div>
    <div class="stat-change">{{change}}</div>
  </div>`,
  props: ['title', 'value', 'change']
};

export const DataTable = {
  name: 'DataTable',
  template: `<table class="nexus-table">
    <thead><tr>{{headers}}</tr></thead>
    <tbody>{{rows}}</tbody>
  </table>`,
  props: ['headers', 'rows', 'sortable']
};