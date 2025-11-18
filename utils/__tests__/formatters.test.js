/**
 * Tests for formatters
 * Nexus Framework
 */

import { describe, test, expect } from '@jest/globals';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatFileSize,
  formatName,
  truncateText,
  createSlug,
} from '../formatters.js';

describe('Currency Formatting', () => {
  test('should format BRL currency', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });

  test('should format USD currency', () => {
    const result = formatCurrency(1234.56, 'USD', 'en-US');
    expect(result).toContain('$');
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  test('should handle zero values', () => {
    const result = formatCurrency(0);
    expect(result).toBeDefined();
  });

  test('should handle negative values', () => {
    const result = formatCurrency(-100);
    expect(result).toBeDefined();
    expect(result).toContain('100');
  });
});

describe('Date Formatting', () => {
  test('should format date with short format', () => {
    const date = new Date('2023-12-25');
    const result = formatDate(date, 'short');
    expect(result).toBeDefined();
    expect(result).toContain('25');
    expect(result).toContain('12');
  });

  test('should format date with medium format', () => {
    const date = new Date('2023-12-25');
    const result = formatDate(date, 'medium');
    expect(result).toBeDefined();
  });

  test('should format date with full format', () => {
    const date = new Date('2023-12-25');
    const result = formatDate(date, 'full');
    expect(result).toBeDefined();
  });

  test('should use default short format', () => {
    const date = new Date('2023-12-25');
    const result = formatDate(date);
    expect(result).toBeDefined();
  });
});

describe('Relative Time Formatting', () => {
  test('should format seconds ago', () => {
    const date = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    const result = formatRelativeTime(date);
    expect(result).toBeDefined();
  });

  test('should format minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const result = formatRelativeTime(date);
    expect(result).toBeDefined();
  });

  test('should format hours ago', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const result = formatRelativeTime(date);
    expect(result).toBeDefined();
  });

  test('should format days ago', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const result = formatRelativeTime(date);
    expect(result).toBeDefined();
  });
});

describe('Number Formatting', () => {
  test('should format numbers with default locale', () => {
    const result = formatNumber(1234567.89);
    expect(result).toBeDefined();
    expect(result).toContain('1');
  });

  test('should format numbers with custom locale', () => {
    const result = formatNumber(1234567.89, 'en-US');
    expect(result).toBeDefined();
  });

  test('should format numbers with custom options', () => {
    const result = formatNumber(0.1234, 'en-US', { style: 'percent' });
    expect(result).toBeDefined();
  });
});

describe('Phone Formatting', () => {
  test('should format 11-digit mobile phone', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  test('should format 10-digit landline', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
  });

  test('should handle already formatted phone', () => {
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
  });

  test('should return original if invalid length', () => {
    expect(formatPhone('123')).toBe('123');
  });
});

describe('CPF Formatting', () => {
  test('should format CPF correctly', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
  });

  test('should handle already formatted CPF', () => {
    expect(formatCPF('123.456.789-09')).toBe('123.456.789-09');
  });

  test('should handle CPF with partial formatting', () => {
    expect(formatCPF('123456789-09')).toBe('123.456.789-09');
  });
});

describe('CNPJ Formatting', () => {
  test('should format CNPJ correctly', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  test('should handle already formatted CNPJ', () => {
    expect(formatCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81');
  });
});

describe('CEP Formatting', () => {
  test('should format CEP correctly', () => {
    expect(formatCEP('12345678')).toBe('12345-678');
  });

  test('should handle already formatted CEP', () => {
    expect(formatCEP('12345-678')).toBe('12345-678');
  });
});

describe('File Size Formatting', () => {
  test('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
  });

  test('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  test('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  test('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(2147483648)).toBe('2 GB');
  });

  test('should format terabytes', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB');
  });

  test('should respect decimal places', () => {
    expect(formatFileSize(1536, 0)).toBe('2 KB');
    expect(formatFileSize(1536, 1)).toBe('1.5 KB');
    expect(formatFileSize(1536, 3)).toBe('1.500 KB');
  });
});

describe('Name Formatting', () => {
  test('should capitalize first letter of each word', () => {
    expect(formatName('joao silva')).toBe('Joao Silva');
  });

  test('should handle all uppercase', () => {
    expect(formatName('MARIA SANTOS')).toBe('Maria Santos');
  });

  test('should handle mixed case', () => {
    expect(formatName('pEdRo AlVeS')).toBe('Pedro Alves');
  });

  test('should handle single word', () => {
    expect(formatName('pedro')).toBe('Pedro');
  });

  test('should handle multiple spaces', () => {
    expect(formatName('joao  silva')).toBe('Joao  Silva');
  });
});

describe('Text Truncation', () => {
  test('should truncate long text', () => {
    const text = 'This is a very long text that needs to be truncated';
    expect(truncateText(text, 20)).toBe('This is a very long ...');
  });

  test('should not truncate short text', () => {
    const text = 'Short text';
    expect(truncateText(text, 20)).toBe('Short text');
  });

  test('should use custom suffix', () => {
    const text = 'This is a long text';
    expect(truncateText(text, 10, '…')).toBe('This is a …');
  });

  test('should handle exact length', () => {
    const text = 'Exact';
    expect(truncateText(text, 5)).toBe('Exact');
  });

  test('should handle empty text', () => {
    expect(truncateText('', 10)).toBe('');
  });
});

describe('Slug Creation', () => {
  test('should create slug from text', () => {
    expect(createSlug('Hello World')).toBe('hello-world');
  });

  test('should remove accents', () => {
    expect(createSlug('Olá Mundo Àéíóú')).toBe('ola-mundo-aeiou');
  });

  test('should remove special characters', () => {
    expect(createSlug('Hello@World!')).toBe('helloworld');
  });

  test('should handle multiple spaces', () => {
    expect(createSlug('Hello   World')).toBe('hello-world');
  });

  test('should handle multiple hyphens', () => {
    expect(createSlug('Hello--World')).toBe('hello-world');
  });

  test('should trim hyphens', () => {
    expect(createSlug('-Hello World-')).toBe('hello-world');
  });

  test('should handle already lowercase', () => {
    expect(createSlug('hello-world')).toBe('hello-world');
  });

  test('should handle numbers', () => {
    expect(createSlug('Product 123')).toBe('product-123');
  });

  test('should handle empty string', () => {
    expect(createSlug('')).toBe('');
  });

  test('should handle Portuguese characters', () => {
    expect(createSlug('São Paulo')).toBe('sao-paulo');
    expect(createSlug('Açúcar')).toBe('acucar');
  });
});
