/**
 * Type Helpers - Nexus Framework
 * Utilitários para verificação e manipulação de tipos
 */

// Verificações de Tipo
export const isString = (value) => typeof value === 'string';
export const isNumber = (value) => typeof value === 'number' && !isNaN(value);
export const isBoolean = (value) => typeof value === 'boolean';
export const isFunction = (value) => typeof value === 'function';
export const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isArray = (value) => Array.isArray(value);
export const isNull = (value) => value === null;
export const isUndefined = (value) => value === undefined;
export const isNullOrUndefined = (value) => value === null || value === undefined;
export const isEmpty = (value) => {
  if (isNullOrUndefined(value)) return true;
  if (isString(value) || isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
};

// Verificações Específicas
export const isEmail = (value) => {
  if (!isString(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isUrl = (value) => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isDate = (value) => {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (isString(value)) return !isNaN(new Date(value).getTime());
  return false;
};

export const isPromise = (value) => {
  return value && typeof value.then === 'function';
};

export const isIterable = (value) => {
  return value != null && typeof value[Symbol.iterator] === 'function';
};

// Conversões de Tipo Seguras
export const toString = (value, defaultValue = '') => {
  if (isNullOrUndefined(value)) return defaultValue;
  return String(value);
};

export const toNumber = (value, defaultValue = 0) => {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const toInt = (value, defaultValue = 0) => {
  if (isNumber(value)) return Math.floor(value);
  if (isString(value)) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const toBoolean = (value, defaultValue = false) => {
  if (isBoolean(value)) return value;
  if (isString(value)) {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  if (isNumber(value)) return value !== 0;
  return defaultValue;
};

export const toArray = (value) => {
  if (isArray(value)) return value;
  if (isNullOrUndefined(value)) return [];
  return [value];
};

export const toDate = (value, defaultValue = null) => {
  if (value instanceof Date) return value;
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? defaultValue : date;
  }
  return defaultValue;
};

// Utilitários de Objeto
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
};

export const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

export const pick = (obj, keys) => {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const flatten = (obj, prefix = '', result = {}) => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (isObject(value) && !isArray(value)) {
      flatten(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  });
  return result;
};

// Utilitários de Array
export const unique = (array) => [...new Set(array)];

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Utilitários de String
export const capitalize = (str) => {
  if (!isString(str)) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelCase = (str) => {
  if (!isString(str)) return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

export const kebabCase = (str) => {
  if (!isString(str)) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
};

export const snakeCase = (str) => {
  if (!isString(str)) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
};

// Utilitários de Performance
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

export const once = (fn) => {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
};