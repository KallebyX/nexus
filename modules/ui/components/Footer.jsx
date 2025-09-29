/**
 * Componente Footer - Nexus UI
 * Footer reutilizável para qualquer projeto
 */

import React from 'react';

const Footer = ({ 
  brand = 'Powered by Nexus',
  links = [],
  socialLinks = [],
  copyright = `© ${new Date().getFullYear()} Todos os direitos reservados`,
  className = '',
  theme = 'light', // light, dark
  layout = 'default' // default, minimal, extended
}) => {
  const themeClasses = {
    light: 'bg-gray-50 text-gray-600 border-gray-200',
    dark: 'bg-gray-900 text-gray-300 border-gray-700'
  };

  const layouts = {
    minimal: () => (
      <div className="text-center py-6">
        <p className="text-sm">{copyright}</p>
      </div>
    ),
    
    default: () => (
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold text-lg mb-2">{brand}</h3>
            <p className="text-sm">{copyright}</p>
          </div>
          
          {links.length > 0 && (
            <div className="flex flex-wrap gap-6">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-sm hover:text-blue-600 transition-colors"
                  target={link.external ? '_blank' : '_self'}
                  rel={link.external ? 'noopener noreferrer' : ''}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          
          {socialLinks.length > 0 && (
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon || social.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    
    extended: () => (
      <div className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold text-lg mb-4">{brand}</h3>
            <p className="text-sm mb-4">
              Framework modular para desenvolvimento acelerado de aplicações web modernas.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    {social.icon || social.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          {links.length > 0 && (
            <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
              {Array.from({ length: Math.ceil(links.length / Math.ceil(links.length / 2)) }).map((_, groupIndex) => (
                <div key={groupIndex}>
                  <h4 className="font-medium mb-4">
                    {groupIndex === 0 ? 'Links' : 'Recursos'}
                  </h4>
                  <ul className="space-y-2">
                    {links
                      .slice(
                        groupIndex * Math.ceil(links.length / 2),
                        (groupIndex + 1) * Math.ceil(links.length / 2)
                      )
                      .map((link, index) => (
                        <li key={index}>
                          <a
                            href={link.href}
                            className="text-sm hover:text-blue-600 transition-colors"
                            target={link.external ? '_blank' : '_self'}
                            rel={link.external ? 'noopener noreferrer' : ''}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <p className="text-sm text-center">{copyright}</p>
        </div>
      </div>
    )
  };

  return (
    <footer className={`border-t ${themeClasses[theme]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {layouts[layout]()}
      </div>
    </footer>
  );
};

// Componente de Footer específico para E-commerce
export const EcommerceFooter = (props) => (
  <Footer
    {...props}
    links={[
      { label: 'Sobre Nós', href: '/about' },
      { label: 'Contato', href: '/contact' },
      { label: 'Política de Privacidade', href: '/privacy' },
      { label: 'Termos de Uso', href: '/terms' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Suporte', href: '/support' },
      ...props.links || []
    ]}
    layout="extended"
  />
);

// Componente de Footer específico para SaaS
export const SaaSFooter = (props) => (
  <Footer
    {...props}
    links={[
      { label: 'Documentação', href: '/docs', external: true },
      { label: 'API', href: '/api-docs', external: true },
      { label: 'Status', href: '/status', external: true },
      { label: 'Blog', href: '/blog' },
      { label: 'Suporte', href: '/support' },
      { label: 'Contato', href: '/contact' },
      ...props.links || []
    ]}
    layout="extended"
  />
);

// Componente de Footer minimalista
export const MinimalFooter = (props) => (
  <Footer
    {...props}
    layout="minimal"
  />
);

export default Footer;