# Módulo de Autenticação - Oryum Nexus

Este módulo fornece autenticação plug & play para aplicações Nexus.

## Funcionalidades

- JWT com refresh tokens
- Login social (Google, GitHub)
- Sistema de roles e permissões
- Onboarding automatizado
- Rate limiting por usuário

## Uso Básico

```javascript
import { AuthModule } from '@oryum/nexus/auth';

const auth = new AuthModule({
  provider: 'supabase',
  socialLogin: ['google', 'github'],
  roles: ['admin', 'user']
});

// Middleware para Express
app.use(auth.middleware());
```

## Configuração

Configurado automaticamente via `nexus.config.js`:

```javascript
modules: {
  auth: {
    enabled: true,
    provider: 'supabase',
    socialLogin: ['google', 'github'],
    jwt: true,
    roles: ['admin', 'user']
  }
}
```

## API Endpoints

- `POST /auth/login` - Login com email/senha
- `POST /auth/register` - Registro de usuário
- `POST /auth/refresh` - Renovar token
- `GET /auth/profile` - Perfil do usuário
- `POST /auth/logout` - Logout