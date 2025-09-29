/**
 * Módulo de IA - Oryum Nexus
 * Integração com APIs de IA para automação de tarefas
 */

import OpenAI from 'openai';

export class AIModule {
  constructor(config = {}) {
    this.config = {
      provider: 'openai',
      model: 'gpt-4',
      features: ['docs', 'tests', 'refactor'],
      ...config
    };

    this.initializeProvider();
  }

  initializeProvider() {
    if (this.config.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      });
    }
  }

  async healthCheck() {
    try {
      // Teste simples para verificar se a API está funcionando
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });

      return { status: 'healthy', provider: this.config.provider };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Gerar documentação automática para código
   */
  async generateDocumentation(code, language = 'javascript') {
    const prompt = `
Analise o seguinte código ${language} e gere documentação técnica completa:

\`\`\`${language}
${code}
\`\`\`

Inclua:
1. Descrição geral da função/classe
2. Parâmetros e tipos
3. Valor de retorno
4. Exemplos de uso
5. Possíveis exceções

Formato: Markdown
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em documentação técnica. Gere documentação clara, concisa e completa.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      return {
        success: true,
        documentation: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar testes automaticamente para código
   */
  async generateTests(code, framework = 'jest') {
    const prompt = `
Gere testes unitários completos para o seguinte código usando ${framework}:

\`\`\`javascript
${code}
\`\`\`

Inclua:
1. Testes para casos normais
2. Testes para casos extremos
3. Testes para tratamento de erros
4. Mocks quando necessário
5. Cobertura de pelo menos 80%

Use boas práticas de nomenclatura e organização.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em testes automatizados com ${framework}. Gere testes completos e bem estruturados.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.2
      });

      return {
        success: true,
        tests: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sugerir refatorações para código
   */
  async suggestRefactoring(code, language = 'javascript') {
    const prompt = `
Analise o seguinte código ${language} e sugira melhorias e refatorações:

\`\`\`${language}
${code}
\`\`\`

Considere:
1. Performance
2. Legibilidade
3. Manutenibilidade
4. Boas práticas
5. Padrões de design
6. Segurança

Para cada sugestão, explique o motivo e forneça o código refatorado.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um senior software engineer especialista em refatoração e otimização de código.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.4
      });

      return {
        success: true,
        suggestions: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar código baseado em descrição
   */
  async generateCode(description, language = 'javascript', framework = null) {
    const frameworkText = framework ? ` usando ${framework}` : '';
    
    const prompt = `
Gere código ${language}${frameworkText} baseado na seguinte descrição:

${description}

O código deve:
1. Seguir as melhores práticas
2. Incluir tratamento de erros
3. Ser bem documentado
4. Ser testável
5. Seguir padrões de design apropriados

Inclua também comentários explicativos.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `Você é um desenvolvedor experiente que escreve código limpo e eficiente em ${language}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.3
      });

      return {
        success: true,
        code: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analisar código para vulnerabilidades de segurança
   */
  async analyzeSecurityVulnerabilities(code, language = 'javascript') {
    const prompt = `
Analise o seguinte código ${language} em busca de vulnerabilidades de segurança:

\`\`\`${language}
${code}
\`\`\`

Identifique:
1. Vulnerabilidades do OWASP Top 10
2. Problemas de validação de entrada
3. Possíveis injeções (SQL, XSS, etc.)
4. Problemas de autenticação/autorização
5. Exposição de informações sensíveis
6. Configurações inseguras

Para cada problema encontrado, forneça:
- Descrição da vulnerabilidade
- Nível de severidade (Alto/Médio/Baixo)
- Como corrigir
- Código corrigido (se aplicável)
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em segurança de aplicações. Analise código em busca de vulnerabilidades.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.2
      });

      return {
        success: true,
        analysis: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar README para projeto
   */
  async generateReadme(projectInfo) {
    const prompt = `
Gere um README.md completo e profissional para o seguinte projeto:

Nome: ${projectInfo.name}
Descrição: ${projectInfo.description}
Tecnologias: ${projectInfo.technologies?.join(', ') || 'Não especificado'}
Autor: ${projectInfo.author || 'Não especificado'}

O README deve incluir:
1. Título e descrição
2. Badges de status
3. Instalação
4. Uso básico
5. Exemplos
6. API/Documentação
7. Contribuição
8. Licença
9. Contato

Use markdown com formatação adequada e emojis quando apropriado.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em documentação de projetos. Gere READMEs claros e profissionais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.4
      });

      return {
        success: true,
        readme: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Otimizar performance de código
   */
  async optimizePerformance(code, language = 'javascript') {
    const prompt = `
Analise e otimize a performance do seguinte código ${language}:

\`\`\`${language}
${code}
\`\`\`

Foque em:
1. Complexidade algorítmica
2. Uso eficiente de memória
3. Operações custosas
4. Loops e iterações
5. Acesso a dados
6. Caching quando apropriado

Forneça:
- Análise dos gargalos
- Código otimizado
- Explicação das melhorias
- Estimativa de ganho de performance
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em otimização de performance. Analise e melhore código para máxima eficiência.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      });

      return {
        success: true,
        optimization: response.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AIModule;