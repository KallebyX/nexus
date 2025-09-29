/**
 * Template Frontend - Oryum Nexus
 * Aplicação React + Next.js com módulos integrados
 */

import React from 'react';
import { useAuth, DashboardLayout, Card, Button, Loading } from '@oryum/nexus/ui';

// Página principal do dashboard
export default function Dashboard() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <Loading text="Carregando dashboard..." />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const sidebarContent = (
    <nav className="space-y-2">
      <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
        📊 Dashboard
      </a>
      <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
        👥 Usuários
      </a>
      <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
        📈 Métricas
      </a>
      <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
        🔧 Configurações
      </a>
      <button 
        onClick={logout}
        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
      >
        🚪 Sair
      </button>
    </nav>
  );

  return (
    <DashboardLayout sidebar={sidebarContent} user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo ao Nexus Dashboard
          </h1>
          <p className="text-gray-600">
            Gerencie seu projeto com o poder dos módulos Nexus
          </p>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Usuários Ativos"
            value="1,234"
            change="+12%"
            icon="👥"
          />
          <MetricCard
            title="Requests/min"
            value="856"
            change="+5%"
            icon="📊"
          />
          <MetricCard
            title="Tempo Resposta"
            value="234ms"
            change="-8%"
            icon="⚡"
          />
          <MetricCard
            title="Uptime"
            value="99.9%"
            change="0%"
            icon="🟢"
          />
        </div>

        {/* Seções principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividade recente */}
          <Card title="Atividade Recente">
            <div className="space-y-3">
              <ActivityItem
                action="Novo usuário registrado"
                user="joão@email.com"
                time="2 min atrás"
              />
              <ActivityItem
                action="Deploy realizado"
                user="Sistema"
                time="15 min atrás"
              />
              <ActivityItem
                action="Backup executado"
                user="Sistema"
                time="1 hora atrás"
              />
            </div>
          </Card>

          {/* Quick actions */}
          <Card title="Ações Rápidas">
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                🚀 Fazer Deploy
              </Button>
              <Button variant="secondary" className="w-full">
                📝 Gerar Documentação
              </Button>
              <Button variant="outline" className="w-full">
                🧪 Executar Testes
              </Button>
              <Button variant="outline" className="w-full">
                🔍 Health Check
              </Button>
            </div>
          </Card>
        </div>

        {/* Módulos ativos */}
        <Card title="Módulos Nexus Ativos">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ModuleStatus name="Auth" status="active" icon="🔐" />
            <ModuleStatus name="Database" status="active" icon="📊" />
            <ModuleStatus name="UI" status="active" icon="🎨" />
            <ModuleStatus name="Monitoring" status="active" icon="📈" />
            <ModuleStatus name="AI" status="inactive" icon="🤖" />
            <ModuleStatus name="Payments" status="inactive" icon="💳" />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Componente de login
function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [credentials, setCredentials] = React.useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(credentials.email, credentials.password);
      if (!result.success) {
        alert('Erro no login: ' + result.error);
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Oryum Nexus</h1>
          <p className="text-gray-600">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({
                ...credentials,
                email: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({
                ...credentials,
                password: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            loading={loading}
            disabled={!credentials.email || !credentials.password}
          >
            Entrar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem conta? 
            <a href="#" className="text-blue-600 hover:text-blue-500 ml-1">
              Registrar-se
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}

// Componente de métrica
function MetricCard({ title, value, change, icon }) {
  const isPositive = change.startsWith('+');
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm ${changeColor}`}>{change}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </Card>
  );
}

// Componente de atividade
function ActivityItem({ action, user, time }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{action}</p>
        <p className="text-xs text-gray-600">{user}</p>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
}

// Componente de status do módulo
function ModuleStatus({ name, status, icon }) {
  const statusColor = status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
  const statusText = status === 'active' ? 'Ativo' : 'Inativo';

  return (
    <div className="text-center p-4 border border-gray-200 rounded-lg">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium text-gray-900">{name}</h3>
      <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColor}`}>
        {statusText}
      </span>
    </div>
  );
}