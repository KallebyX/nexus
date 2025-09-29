/**
 * Nexus UI Module - Enhanced Components Library
 * Advanced React components for enterprise applications
 * 
 * @version 2.0.0
 * @module Nexus/UI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

// Enhanced Button Component
export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    ghost: 'text-blue-600 hover:bg-blue-100'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

// Advanced DataTable Component
export const DataTable = ({
  data = [],
  columns = [],
  pagination = true,
  pageSize = 10,
  searchable = true,
  sortable = true,
  selectable = false,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  onSelectionChange,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Filter data based on search
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return columns.some(column => {
      const value = item[column.key]?.toString().toLowerCase();
      return value?.includes(searchTerm.toLowerCase());
    });
  });
  
  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination ? sortedData.slice(startIndex, startIndex + pageSize) : sortedData;
  
  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((_, index) => startIndex + index)));
    } else {
      setSelectedRows(new Set());
    }
    onSelectionChange?.(selectedRows);
  };
  
  const handleRowSelect = (index, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(startIndex + index);
    } else {
      newSelected.delete(startIndex + index);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white shadow-sm rounded-lg ${className}`}>
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortable && sortConfig.key === column.key && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(startIndex + index)}
                        onChange={(e) => handleRowSelect(index, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, index);
                            }}
                            className={`text-${action.color || 'blue'}-600 hover:text-${action.color || 'blue'}-900`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Component
export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) => {
  const modalRef = useRef(null);
  
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-4xl',
    fullscreen: 'max-w-full mx-4'
  };
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose?.();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
        ></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div
          ref={modalRef}
          className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 ${sizeClasses[size]} ${className}`}
        >
          <div className="flex items-center justify-between mb-4">
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Builder Component
export const FormBuilder = ({
  schema = [],
  onSubmit,
  initialValues = {},
  validation = {},
  className = ''
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    schema.forEach(field => {
      const value = formData[field.name];
      
      // Required validation
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }
      
      // Custom validation
      if (validation[field.name] && value) {
        const validationResult = validation[field.name](value, formData);
        if (validationResult !== true) {
          newErrors[field.name] = validationResult;
        }
      }
      
      // Type-specific validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      className: `mt-1 block w-full border ${errors[field.name] ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`,
      disabled: isSubmitting
    };
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return <input type={field.type} {...commonProps} placeholder={field.placeholder} />;
      
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
            placeholder={field.placeholder}
          />
        );
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            {...commonProps}
            checked={formData[field.name] || false}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );
      
      default:
        return <input type="text" {...commonProps} />;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {schema.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
            {field.helpText && (
              <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
};

// Chart Component (using Chart.js)
export const Chart = ({
  type = 'line',
  data = {},
  options = {},
  width = 400,
  height = 200,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // This would integrate with Chart.js or similar library
    // For now, we'll show a placeholder
    const ctx = canvasRef.current.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw placeholder
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${type.toUpperCase()} Chart`, width / 2, height / 2);
    ctx.fillText('Chart.js integration needed', width / 2, height / 2 + 20);
    
  }, [data, type, width, height]);
  
  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded"
      />
    </div>
  );
};

// PropTypes definitions
Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'outline', 'ghost']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func
};

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    render: PropTypes.func
  })).isRequired,
  pagination: PropTypes.bool,
  searchable: PropTypes.bool,
  sortable: PropTypes.bool,
  onRowClick: PropTypes.func
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen'])
};

export default {
  Button,
  DataTable,
  Modal,
  FormBuilder,
  Chart
};