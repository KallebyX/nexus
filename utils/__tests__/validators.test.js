/**
 * Tests for validators
 * Nexus Framework
 */

import { describe, test, expect } from '@jest/globals';
import {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidCEP,
  isStrongPassword,
  isValidURL,
  isValidCreditCard,
  isValidDate,
  isMinAge,
  isValidFileType,
  isValidFileSize,
  isValidHexColor,
  isValidIP,
  isValidPostalCode,
} from '../validators.js';

describe('Email Validation', () => {
  test('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  test('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('test @example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('CPF Validation', () => {
  test('should validate correct CPF', () => {
    expect(isValidCPF('123.456.789-09')).toBe(true);
    expect(isValidCPF('12345678909')).toBe(true);
    expect(isValidCPF('111.444.777-35')).toBe(true);
  });

  test('should reject invalid CPF', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false); // All same digits
    expect(isValidCPF('123.456.789-00')).toBe(false); // Invalid check digits
    expect(isValidCPF('123')).toBe(false); // Too short
    expect(isValidCPF('12345678901234')).toBe(false); // Too long
  });
});

describe('CNPJ Validation', () => {
  test('should validate correct CNPJ', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  test('should reject invalid CNPJ', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false); // All same digits
    expect(isValidCNPJ('11.222.333/0001-00')).toBe(false); // Invalid check digits
    expect(isValidCNPJ('123')).toBe(false); // Too short
  });
});

describe('Phone Validation', () => {
  test('should validate correct Brazilian phone numbers', () => {
    expect(isValidPhone('(11) 98765-4321')).toBe(true); // Mobile with 9
    expect(isValidPhone('11987654321')).toBe(true); // Mobile without formatting
    expect(isValidPhone('(11) 3456-7890')).toBe(true); // Landline
    expect(isValidPhone('1134567890')).toBe(true); // Landline without formatting
  });

  test('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false); // Too short
    expect(isValidPhone('123456789012')).toBe(false); // Too long
  });
});

describe('CEP Validation', () => {
  test('should validate correct CEP', () => {
    expect(isValidCEP('12345-678')).toBe(true);
    expect(isValidCEP('12345678')).toBe(true);
  });

  test('should reject invalid CEP', () => {
    expect(isValidCEP('123')).toBe(false); // Too short
    expect(isValidCEP('123456789')).toBe(false); // Too long
  });
});

describe('Password Strength Validation', () => {
  test('should validate strong passwords', () => {
    expect(isStrongPassword('Test123!')).toBe(true);
    expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
    expect(isStrongPassword('Complex1ty!')).toBe(true);
  });

  test('should reject weak passwords', () => {
    expect(isStrongPassword('short')).toBe(false); // Too short
    expect(isStrongPassword('alllowercase1!')).toBe(false); // No uppercase
    expect(isStrongPassword('ALLUPPERCASE1!')).toBe(false); // No lowercase
    expect(isStrongPassword('NoNumbers!')).toBe(false); // No numbers
    expect(isStrongPassword('NoSpecial1')).toBe(false); // No special chars
  });

  test('should respect custom minimum length', () => {
    expect(isStrongPassword('Test1!', 6)).toBe(true);
    expect(isStrongPassword('Test1!', 10)).toBe(false);
  });
});

describe('URL Validation', () => {
  test('should validate correct URLs', () => {
    expect(isValidURL('https://example.com')).toBe(true);
    expect(isValidURL('http://localhost:3000')).toBe(true);
    expect(isValidURL('ftp://files.example.com')).toBe(true);
  });

  test('should reject invalid URLs', () => {
    expect(isValidURL('not a url')).toBe(false);
    expect(isValidURL('example.com')).toBe(false); // No protocol
    expect(isValidURL('')).toBe(false);
  });
});

describe('Credit Card Validation', () => {
  test('should validate correct credit card numbers', () => {
    expect(isValidCreditCard('4532015112830366')).toBe(true); // Visa
    expect(isValidCreditCard('4532-0151-1283-0366')).toBe(true); // Formatted
    expect(isValidCreditCard('6011111111111117')).toBe(true); // Discover
  });

  test('should reject invalid credit card numbers', () => {
    expect(isValidCreditCard('4532015112830367')).toBe(false); // Invalid check digit
    expect(isValidCreditCard('123')).toBe(false); // Too short
    expect(isValidCreditCard('12345678901234567890')).toBe(false); // Too long
  });
});

describe('Date Validation', () => {
  test('should validate correct dates', () => {
    expect(isValidDate('2023-01-01')).toBe(true);
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate('December 17, 1995')).toBe(true);
  });

  test('should reject invalid dates', () => {
    expect(isValidDate('not a date')).toBe(false);
    expect(isValidDate('2023-13-01')).toBe(false); // Invalid month
    expect(isValidDate('')).toBe(false);
  });
});

describe('Minimum Age Validation', () => {
  test('should validate age correctly', () => {
    const today = new Date();
    const twentyYearsAgo = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());

    expect(isMinAge(twentyYearsAgo, 18)).toBe(true);
    expect(isMinAge(tenYearsAgo, 18)).toBe(false);
  });

  test('should respect custom minimum age', () => {
    const today = new Date();
    const fifteenYearsAgo = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());

    expect(isMinAge(fifteenYearsAgo, 13)).toBe(true);
    expect(isMinAge(fifteenYearsAgo, 18)).toBe(false);
  });

  test('should handle birthday edge cases', () => {
    const today = new Date();
    const almostEighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    const exactlyEighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    expect(isMinAge(almostEighteen, 18)).toBe(false);
    expect(isMinAge(exactlyEighteen, 18)).toBe(true);
  });
});

describe('File Type Validation', () => {
  test('should validate correct file types', () => {
    expect(isValidFileType('document.pdf', ['pdf', 'doc'])).toBe(true);
    expect(isValidFileType('image.JPG', ['jpg', 'png'])).toBe(true);
    expect(isValidFileType('archive.tar.gz', ['gz'])).toBe(true);
  });

  test('should reject invalid file types', () => {
    expect(isValidFileType('script.exe', ['pdf', 'doc'])).toBe(false);
    expect(isValidFileType('image.bmp', ['jpg', 'png'])).toBe(false);
  });
});

describe('File Size Validation', () => {
  test('should validate correct file sizes', () => {
    expect(isValidFileSize(1024 * 1024, 2)).toBe(true); // 1MB file, 2MB limit
    expect(isValidFileSize(5 * 1024 * 1024, 10)).toBe(true); // 5MB file, 10MB limit
  });

  test('should reject oversized files', () => {
    expect(isValidFileSize(3 * 1024 * 1024, 2)).toBe(false); // 3MB file, 2MB limit
    expect(isValidFileSize(11 * 1024 * 1024, 10)).toBe(false); // 11MB file, 10MB limit
  });

  test('should handle exact size limit', () => {
    expect(isValidFileSize(2 * 1024 * 1024, 2)).toBe(true); // Exactly 2MB
  });
});

describe('Hex Color Validation', () => {
  test('should validate correct hex colors', () => {
    expect(isValidHexColor('#FFFFFF')).toBe(true);
    expect(isValidHexColor('#000')).toBe(true);
    expect(isValidHexColor('#abc123')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(true);
  });

  test('should reject invalid hex colors', () => {
    expect(isValidHexColor('FFFFFF')).toBe(false); // Missing #
    expect(isValidHexColor('#GG0000')).toBe(false); // Invalid characters
    expect(isValidHexColor('#12')).toBe(false); // Too short
    expect(isValidHexColor('#1234567')).toBe(false); // Too long
  });
});

describe('IP Address Validation', () => {
  test('should validate correct IPv4 addresses', () => {
    expect(isValidIP('192.168.1.1')).toBe(true);
    expect(isValidIP('10.0.0.1')).toBe(true);
    expect(isValidIP('255.255.255.255')).toBe(true);
  });

  test('should validate correct IPv6 addresses', () => {
    expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIP('fe80:0000:0000:0000:0204:61ff:fe9d:f156')).toBe(true);
  });

  test('should reject invalid IP addresses', () => {
    expect(isValidIP('256.1.1.1')).toBe(false); // Invalid octet
    expect(isValidIP('192.168.1')).toBe(false); // Incomplete
    expect(isValidIP('not an ip')).toBe(false);
  });
});

describe('Postal Code Validation', () => {
  test('should validate Brazilian CEP', () => {
    expect(isValidPostalCode('12345-678', 'BR')).toBe(true);
    expect(isValidPostalCode('12345678', 'BR')).toBe(true);
  });

  test('should validate US ZIP code', () => {
    expect(isValidPostalCode('12345', 'US')).toBe(true);
    expect(isValidPostalCode('12345-6789', 'US')).toBe(true);
  });

  test('should validate UK postal code', () => {
    expect(isValidPostalCode('SW1A 1AA', 'UK')).toBe(true);
    expect(isValidPostalCode('M1 1AE', 'UK')).toBe(true);
  });

  test('should validate Canadian postal code', () => {
    expect(isValidPostalCode('K1A 0B1', 'CA')).toBe(true);
    expect(isValidPostalCode('M5W 1E6', 'CA')).toBe(true);
  });

  test('should reject invalid postal codes', () => {
    expect(isValidPostalCode('123', 'BR')).toBe(false);
    expect(isValidPostalCode('ABCDE', 'US')).toBe(false);
  });

  test('should return true for unknown country codes', () => {
    expect(isValidPostalCode('anything', 'XX')).toBe(true);
  });
});
