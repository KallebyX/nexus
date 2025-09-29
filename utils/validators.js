/**
 * Validadores - Nexus Framework
 * Funções de validação padronizadas
 */

// Validação de Email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de CPF
export const isValidCPF = (cpf) => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (parseInt(numbers[9]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return parseInt(numbers[10]) === digit;
};

// Validação de CNPJ
export const isValidCNPJ = (cnpj) => {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (parseInt(numbers[12]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  return parseInt(numbers[13]) === digit;
};

// Validação de Telefone Brasileiro
export const isValidPhone = (phone) => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10 || numbers.length === 11;
};

// Validação de CEP
export const isValidCEP = (cep) => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
};

// Validação de Senha Forte
export const isStrongPassword = (password, minLength = 8) => {
  if (password.length < minLength) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// Validação de URL
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validação de Número de Cartão de Crédito (Algoritmo de Luhn)
export const isValidCreditCard = (cardNumber) => {
  const numbers = cardNumber.replace(/\D/g, '');
  
  if (numbers.length < 13 || numbers.length > 19) return false;
  
  let sum = 0;
  let alternate = false;
  
  for (let i = numbers.length - 1; i >= 0; i--) {
    let digit = parseInt(numbers[i]);
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
};

// Validação de Data
export const isValidDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Validação de Idade Mínima
export const isMinAge = (birthDate, minAge = 18) => {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= minAge;
  }
  
  return age >= minAge;
};

// Validação de Arquivo por Extensão
export const isValidFileType = (filename, allowedTypes) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

// Validação de Tamanho de Arquivo
export const isValidFileSize = (fileSize, maxSizeInMB) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return fileSize <= maxSizeInBytes;
};

// Validação de Código de Cor Hex
export const isValidHexColor = (color) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Validação de IP
export const isValidIP = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// Validação de Código Postal Internacional
export const isValidPostalCode = (code, country = 'BR') => {
  const patterns = {
    BR: /^\d{5}-?\d{3}$/, // CEP brasileiro
    US: /^\d{5}(-\d{4})?$/, // ZIP code americano
    UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, // Postal code britânico
    CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, // Postal code canadense
  };
  
  return patterns[country] ? patterns[country].test(code) : true;
};